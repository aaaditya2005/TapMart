const Order = require('../model/Order');
const Product = require('../model/Product');
const mongoose = require('mongoose');
const sendEmail = require('../utils/sendmail');

const sendOrderEmail = async (email, subject, message) => {
    try {
        await sendEmail(email, subject, message);
    } catch (error) {
        console.error('Order email error:', error.message);
    }
};

const makeOrderItemsText = (order) => {
    let text = '';
    for (const item of order.orderItems) {
        text += `${item.name} x ${item.qty} = ${item.price * item.qty}\n`;
    }
    return text;
};

const createOrder = async (req, res) => {
    try {
        const { items, orderItems, shippingAddress, paymentMethod } = req.body;
        const itemsToOrder = orderItems || items;

        if (!Array.isArray(itemsToOrder) || itemsToOrder.length === 0) {
            return res.status(400).json({ message: 'Please add at least one item' });
        }
        if (!shippingAddress || !paymentMethod) {
            return res.status(400).json({ message: 'Shipping address and payment method are required' });
        }
        if (!['cash_on_delivery', 'razorpay'].includes(paymentMethod)) {
            return res.status(400).json({ message: 'Invalid payment method' });
        }

        const requiredAddressFields = ['address', 'city', 'postalCode', 'country'];
        for (const field of requiredAddressFields) {
            if (!shippingAddress[field] || typeof shippingAddress[field] !== 'string') {
                return res.status(400).json({ message: `Shipping ${field} is required` });
            }
        }

        const productIds = [];
        for (const item of itemsToOrder) {
            if (!mongoose.isValidObjectId(item.product) || !Number.isInteger(item.qty) || item.qty < 1) {
                return res.status(400).json({ message: 'Each item needs a valid product and quantity' });
            }
            if (!productIds.includes(String(item.product))) {
                productIds.push(String(item.product));
            }
        }

        const products = await Product.find({ _id: { $in: productIds } });
        if (products.length !== productIds.length) {
            return res.status(404).json({ message: 'One or more products were not found' });
        }

        const finalItems = [];
        for (const item of itemsToOrder) {
            const product = products.find((productItem) => String(productItem._id) === String(item.product));
            if (product.stock < item.qty) {
                return res.status(400).json({ message: `${product.name} does not have enough stock` });
            }
            finalItems.push({
                product: product._id,
                name: product.name,
                qty: item.qty,
                price: product.price
            });
        }

        const order = await Order.create({
            user: req.user._id,
            orderItems: finalItems,
            shippingAddress: {
                address: shippingAddress.address.trim(),
                city: shippingAddress.city.trim(),
                postalCode: shippingAddress.postalCode.trim(),
                country: shippingAddress.country.trim()
            },
            paymentMethod
        });

        const orderMessage = `Your order was created successfully.\n\nOrder ID: ${order._id}\n${makeOrderItemsText(order)}\nTotal: ${order.totalPrice}\nStatus: ${order.status}`;
        await sendOrderEmail(req.user.email, 'Order created successfully', orderMessage);

        res.status(201).json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('user', 'name email')
            .populate('orderItems.product', 'name imageURL');
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getOrderById = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid order id' });
        }

        const order = await Order.findById(req.params.id)
            .populate('user', 'name email')
            .populate('orderItems.product', 'name imageURL');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const orderUserId = order.user._id || order.user;
        const isOwner = String(orderUserId) === String(req.user._id);
        if (!isOwner && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'You cannot view this order' });
        }

        res.json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const allowedStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
        const allowedPaymentStatuses = ['pending', 'paid', 'failed', 'refunded'];
        const { status, paymentStatus } = req.body;

        if (status && !allowedStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid order status' });
        }
        if (paymentStatus && !allowedPaymentStatuses.includes(paymentStatus)) {
            return res.status(400).json({ message: 'Invalid payment status' });
        }
        if (!status && !paymentStatus) {
            return res.status(400).json({ message: 'Please provide a status' });
        }

        const updateData = {};
        if (status) updateData.status = status;
        if (paymentStatus) updateData.paymentStatus = paymentStatus;
        if (status === 'delivered') updateData.deliveredAt = new Date();
        if (paymentStatus === 'paid') updateData.paidAt = new Date();

        const order = await Order.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const updatedOrder = await Order.findById(order._id).populate('user', 'name email');
        const statusMessage = `Your order status was updated.\n\nOrder ID: ${updatedOrder._id}\nOrder status: ${updatedOrder.status}\nPayment status: ${updatedOrder.paymentStatus}`;
        await sendOrderEmail(updatedOrder.user.email, 'Order status updated', statusMessage);

        res.json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { createOrder, getAllOrders, getOrderById, updateOrderStatus };
