const User = require('../model/User');

const generateToken = (id) =>{
    
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
            res.staus(201).json({  });
        }
    }catch(err){
        res.status(500).json({ message: 'Server error' });
    }

}

const loginUser = (req, res) => {
    res.send('Login User');
}

const logoutUser = (req, res) => {
   res.send('Logout User')
}

module.exports = { registerUser, loginUser, logoutUser };