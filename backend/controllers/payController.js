const Razorpay = require('razorpay');
const crypto = require('crypto');
const prisma = require('../config/prisma');
const sendEmail = require('../utils/sendmail');
const uploadReceipt = require('../utils/receipt');

const getRazorpay = () => {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        throw new Error('Razorpay keys are missing');
    }
    if (!process.env.RAZORPAY_KEY_ID.startsWith('rzp_test_')) {
        throw new Error('Only Razorpay test keys are allowed');
    }
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
};

const formatOrder = (order) => {
    if (!order) return null;
    return {
        ...order,
        _id: order.id,
        user: order.user ? { ...order.user, _id: order.user.id } : order.userId,
        orderItems: Array.isArray(order.orderItems) ? order.orderItems.map((item) => ({
            ...item,
            _id: item.id,
            product: item.product ? { ...item.product, _id: item.product.id } : item.productId
        })) : []
    };
};

const createOrder = async (req, res) => {
    try {
        const { orderId } = req.body;
        const order = await prisma.order.findUnique({ where: { id: orderId } });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        if (String(order.userId) !== String(req.user.id)) {
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
            receipt: `order_${order.id}`
        };

        const razorpayOrder = await instance.orders.create(options);
        await prisma.order.update({
            where: { id: order.id },
            data: { razorpayOrderId: razorpayOrder.id }
        });

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
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                shippingAddress: true,
                orderItems: { include: { product: true } }
            }
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        if (String(order.userId) !== String(req.user.id)) {
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

        const receiptId = `TM-REC-${order.id}`;
        const formattedBeforeReceipt = formatOrder({
            ...order,
            paymentStatus: 'paid',
            razorpayPaymentId: razorpay_payment_id,
            receiptId,
            paidAt: new Date()
        });

        let receiptURL = null;
        try {
            receiptURL = await uploadReceipt(formattedBeforeReceipt, req.user);
        } catch (receiptError) {
            console.error('Receipt upload error:', receiptError.message);
        }

        const updatedOrder = await prisma.order.update({
            where: { id: order.id },
            data: {
                paymentStatus: 'paid',
                razorpayPaymentId: razorpay_payment_id,
                receiptId,
                receiptURL,
                paidAt: new Date()
            },
            include: {
                shippingAddress: true,
                orderItems: { include: { product: true } }
            }
        });

        const formatted = formatOrder(updatedOrder);

        const orderMessage = `Your payment was successful.\n\nOrder ID: ${formatted.id}\nTotal: ${formatted.totalPrice}\nReceipt: ${formatted.receiptURL || 'Available in your TapMart order details'}\nStatus: ${formatted.status}`;
        try {
            await sendEmail(req.user.email, 'Payment successful', orderMessage);
        } catch (emailError) {
            console.error('Payment email error:', emailError.message);
        }

        res.json({ message: 'Payment verified successfully', order: formatted });
    } catch (error) {
        console.error('Verify Razorpay payment error:', error);
        res.status(500).json({ message: 'Payment verification failed' });
    }
};

module.exports = { createOrder, verifyPayment };