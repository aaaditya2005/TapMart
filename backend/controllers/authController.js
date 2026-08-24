const User = require('../model/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendmail');

const generateToken = (id) =>{
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

const registerUser = async (req, res) => {
    const {username, email, password } = req.body;
    try{
        const existingUser = await User.findOne({ email });
        if(existingUser){
            return res.status(400).json({ message: 'User already exists' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = await User.create({ username, email, password: hashedPassword });
        if(newUser){
            const secureOtp = crypto.getRandomValues(new Uint32Array(1))[0] % 1000000;
            const finalOtp = secureOtp.toString().padStart(6, '0');
            const message = `Welcome to TapMart!\n
            Your OTP for TapMart registration is ${finalOtp}.\n
            Please do not share this OTP with anyone.`;

            await sendEmail(email, 'TapMart Registration OTP', message);
            res.status(201).json({ 
                _id: newUser._id, 
                username: newUser.username, 
                email: newUser.email, 
                role: newUser.role,
                token: generateToken(newUser._id)
            });
        }else{
            res.status(400).json({ message: 'Invalid user data' });
        }
    }catch(err){
        res.status(500).json({ message: 'Server error' });
    }

}

const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            token: generateToken(user._id)
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

const logoutUser = async (req, res) => {
    
}

const getAllUsers = async (req, res) => {
    try{
        const users = await User.find({}, '-password'); // Exclude password field
        res.json(users);
    }catch(err){
        res.status(500).json({ message: 'Server error' });
    }
}

module.exports = { registerUser, loginUser, logoutUser, getAllUsers };