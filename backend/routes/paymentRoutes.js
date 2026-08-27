const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment } = require('../controllers/payController');
const protect = require('../middlewares/authMiddleware');


router.post('/order', protect, createOrder);
router.post('/verify-payment', protect, verifyPayment);

module.exports = router;