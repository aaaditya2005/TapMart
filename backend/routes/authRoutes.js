const express = require('express');
const router = express.Router();
const { registerUser, loginUser, logoutUser, getAllUsers, verifyEmail, resendVerificationOtp } = require('../controllers/authController');
const protect = require('../middlewares/authMiddleware');
const admin = require('../middlewares/adminMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/users',protect, admin, getAllUsers);
router.post('/verify-email', verifyEmail);
router.post('/resend-otp', resendVerificationOtp);
router.post('/logout', logoutUser);

module.exports = router;