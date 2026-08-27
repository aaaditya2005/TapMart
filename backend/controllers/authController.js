const User = require('../model/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendmail');

const OTP_EXPIRY_MINUTES = 10;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const createOtp = () => crypto.randomInt(100000, 1000000).toString();

const setOtp = async (user) => {
    const otp = createOtp();
    user.otpHash = await bcrypt.hash(otp, 10);
    user.otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    user.otpAttempts = 0;
    user.otpLastSentAt = new Date();
    await user.save();
    return otp;
};

const sendVerificationOtp = (email, otp) => sendEmail(
    email,
    'TapMart Email Verification OTP',
    `Your TapMart verification code is ${otp}. It expires in ${OTP_EXPIRY_MINUTES} minutes. Do not share it with anyone.`
);

const userResponse = (user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    verified: user.verified
});

const registerUser = async (req, res) => {
    const { name, username, email, password } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    try{
        if ((!name && !username) || !normalizedEmail || typeof password !== 'string' || password.length < 8) {
            return res.status(400).json({ message: 'Name, valid email, and a password of at least 8 characters are required' });
        }
        const existingUser = await User.findOne({ email: normalizedEmail });
        if(existingUser){
            if (!existingUser.verified) {
                return res.status(409).json({ message: 'Account exists but email is not verified', requiresVerification: true });
            }
            return res.status(400).json({ message: 'User already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = await User.create({ name: name || username, email: normalizedEmail, password: hashedPassword });
        const otp = await setOtp(newUser);
        await sendVerificationOtp(newUser.email, otp);
        res.status(201).json({ ...userResponse(newUser), requiresVerification: true });
    }catch(err){
        console.error('Registration error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    try {
        if (!normalizedEmail || typeof password !== 'string') {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (!user.verified) {
            return res.status(403).json({ message: 'Please verify your email before logging in', requiresVerification: true });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        res.json({
            _id: user._id,
            username: user.name,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id)
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const logoutUser = async (req, res) => {
    res.json({ message: 'Logged out successfully' });
};

const getAllUsers = async (req, res) => {
    try{
        const users = await User.find({}, '-password'); // Exclude password field
        res.json(users);
    }catch(err){
        res.status(500).json({ message: 'Server error' });
    }
}

const verifyEmail = async (req, res) => {
    const { email, otp } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const submittedOtp = typeof otp === 'string' ? otp.trim() : String(otp || '').trim();

    try {
        const user = await User.findOne({ email: normalizedEmail }).select('+otpHash +otpExpiresAt +otpAttempts');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.verified) {
            return res.status(400).json({ message: 'Email is already verified' });
        }
        if (!/^\d{6}$/.test(submittedOtp)) {
            return res.status(400).json({ message: 'OTP must be a 6-digit code' });
        }
        if (!user.otpHash || !user.otpExpiresAt || user.otpExpiresAt.getTime() < Date.now()) {
            return res.status(400).json({ message: 'OTP is expired. Request a new code' });
        }
        if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
            return res.status(429).json({ message: 'Too many invalid attempts. Request a new code' });
        }

        const isValidOtp = await bcrypt.compare(submittedOtp, user.otpHash);
        if (!isValidOtp) {
            user.otpAttempts += 1;
            await user.save();
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        user.verified = true;
        user.otpHash = undefined;
        user.otpExpiresAt = undefined;
        user.otpAttempts = 0;
        user.otpLastSentAt = undefined;
        await user.save();

        res.json({ message: 'Email verified successfully', ...userResponse(user), token: generateToken(user._id) });
    } catch (err) {
        console.error('Email verification error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const resendVerificationOtp = async (req, res) => {
    const normalizedEmail = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    try {
        const user = await User.findOne({ email: normalizedEmail }).select('+otpLastSentAt');
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.verified) return res.status(400).json({ message: 'Email is already verified' });
        if (user.otpLastSentAt && Date.now() - user.otpLastSentAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
            return res.status(429).json({ message: 'Please wait before requesting another OTP' });
        }
        const otp = await setOtp(user);
        await sendVerificationOtp(user.email, otp);
        res.json({ message: 'A new verification OTP has been sent' });
    } catch (err) {
        console.error('Resend OTP error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { registerUser, loginUser, logoutUser, getAllUsers, verifyEmail, resendVerificationOtp };