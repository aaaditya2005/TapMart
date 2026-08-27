const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../model/Order');

const getRazorpay = () => {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        throw new Error('Razorpay keys are missing');
    }
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
};

const createOrder = async (req, res) => {
    try {
        const { orderId } = req.body;
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        if (String(order.user) !== String(req.user._id)) {
            return res.status(403).json({ message: 'You cannot pay for this order' });
        }
        if (order.paymentMethod !== 'razorpay') {
            return res.status(400).json({ message: 'This order does not use Razorpay' });
        }
        if (order.paymentStatus === 'paid') {
            return res.status(400).json({ message: 'Order is already paid' });
        }

        const instance = getRazorpay();
        const options = {
            amount: Math.round(order.totalPrice * 100),
            currency: 'INR',
            receipt: `order_${order._id}`
        };

        const razorpayOrder = await instance.orders.create(options);
        order.razorpayOrderId = razorpayOrder.id;
        await order.save();

        res.status(201).json({
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            keyId: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error('Create Razorpay order error:', error);
        res.status(500).json({ message: 'Failed to create payment order' });
    }
};

const verifyPayment = async (req, res) => {
    try {
        const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        if (String(order.user) !== String(req.user._id)) {
            return res.status(403).json({ message: 'You cannot verify this order' });
        }
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ message: 'Payment verification details are required' });
        }
        if (order.razorpayOrderId !== razorpay_order_id) {
            return res.status(400).json({ message: 'Payment order does not match our order' });
        }

        const body = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');
        const receivedSignature = Buffer.from(razorpay_signature, 'utf8');
        const expectedSignatureBuffer = Buffer.from(expectedSignature, 'utf8');

        if (receivedSignature.length !== expectedSignatureBuffer.length ||
            !crypto.timingSafeEqual(receivedSignature, expectedSignatureBuffer)) {
            return res.status(400).json({ message: 'Invalid payment signature' });
        }

        order.paymentStatus = 'paid';
        order.razorpayPaymentId = razorpay_payment_id;
        order.paidAt = new Date();
        await order.save();

        res.json({ message: 'Payment verified successfully', order });
    } catch (error) {
        console.error('Verify Razorpay payment error:', error);
        res.status(500).json({ message: 'Payment verification failed' });
    }
};

module.exports = { createOrder, verifyPayment };