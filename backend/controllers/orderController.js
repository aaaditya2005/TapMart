const prisma = require('../config/prisma');
const sendEmail = require('../utils/sendmail');
const uploadReceipt = require('../utils/receipt');

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
            if (!item.product || typeof item.qty !== 'number' || item.qty < 1) {
                return res.status(400).json({ message: 'Each item needs a valid product and quantity' });
            }
            if (!productIds.includes(String(item.product))) {
                productIds.push(String(item.product));
            }
        }

        const products = await prisma.product.findMany({
            where: { id: { in: productIds } }
        });
        if (products.length !== productIds.length) {
            return res.status(404).json({ message: 'One or more products were not found' });
        }

        const finalItems = [];
        let subtotal = 0;

        for (const item of itemsToOrder) {
            const product = products.find((p) => p.id === String(item.product));
            if (product.stock < item.qty) {
                return res.status(400).json({ message: `${product.name} does not have enough stock` });
            }
            const lineTotal = product.price * item.qty;
            subtotal += lineTotal;

            finalItems.push({
                productId: product.id,
                name: product.name,
                qty: item.qty,
                price: product.price
            });
        }

        // Execute stock decrement & order creation inside a Prisma transaction
        const createdOrder = await prisma.$transaction(async (tx) => {
            // Decrement product stock
            for (const item of finalItems) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: item.qty } }
                });
            }

            // Create Order with ShippingAddress and OrderItems
            return tx.order.create({
                data: {
                    userId: req.user.id,
                    paymentMethod,
                    paymentStatus: 'pending',
                    status: 'confirmed',
                    subtotal,
                    taxPrice: 0,
                    shippingPrice: 0,
                    totalPrice: subtotal,
                    shippingAddress: {
                        create: {
                            address: shippingAddress.address.trim(),
                            city: shippingAddress.city.trim(),
                            postalCode: shippingAddress.postalCode.trim(),
                            country: shippingAddress.country.trim()
                        }
                    },
                    orderItems: {
                        create: finalItems.map((fi) => ({
                            name: fi.name,
                            qty: fi.qty,
                            price: fi.price,
                            productId: fi.productId
                        }))
                    }
                },
                include: {
                    user: { select: { id: true, name: true, email: true } },
                    shippingAddress: true,
                    orderItems: { include: { product: true } }
                }
            });
        });

        const formatted = formatOrder(createdOrder);

        const userEmail = formatted.user?.email || req.user.email;
        if (paymentMethod === 'cash_on_delivery') {
            const orderMessage = `Thank you for your order on TapMart!\n\nOrder ID: ${formatted.id}\nItems:\n${makeOrderItemsText(formatted)}\nTotal Amount: ₹${formatted.totalPrice}\nPayment Method: Cash on Delivery\nStatus: ${formatted.status}`;
            sendOrderEmail(userEmail, 'Order Confirmed - TapMart', orderMessage);
        }

        res.status(201).json(formatted);
    } catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).json({ message: error.statusCode ? error.message : 'Server error' });
    }
};

const getAllOrders = async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            include: {
                user: { select: { id: true, name: true, email: true } },
                shippingAddress: true,
                orderItems: { include: { product: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(orders.map(formatOrder));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getMyOrders = async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            where: { userId: req.user.id },
            include: {
                shippingAddress: true,
                orderItems: { include: { product: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(orders.map(formatOrder));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getOrderById = async (req, res) => {
    try {
        const order = await prisma.order.findUnique({
            where: { id: req.params.id },
            include: {
                user: { select: { id: true, name: true, email: true } },
                shippingAddress: true,
                orderItems: { include: { product: true } }
            }
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const isOwner = String(order.userId) === String(req.user.id);
        if (!isOwner && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'You cannot view this order' });
        }

        res.json(formatOrder(order));
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

        let order = await prisma.order.findUnique({ where: { id: req.params.id } });
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (status === 'delivered' && order.paymentMethod === 'cash_on_delivery') {
            updateData.paymentStatus = 'paid';
            updateData.paidAt = new Date();
        }

        let updatedOrder = await prisma.order.update({
            where: { id: req.params.id },
            data: updateData,
            include: {
                user: { select: { id: true, name: true, email: true } },
                shippingAddress: true,
                orderItems: { include: { product: true } }
            }
        });

        if (updatedOrder.paymentStatus === 'paid' && !updatedOrder.receiptURL) {
            try {
                const receiptId = updatedOrder.receiptId || `TM-REC-${updatedOrder.id}`;
                const receiptURL = await uploadReceipt(formatOrder(updatedOrder), updatedOrder.user);

                updatedOrder = await prisma.order.update({
                    where: { id: updatedOrder.id },
                    data: { receiptId, receiptURL },
                    include: {
                        user: { select: { id: true, name: true, email: true } },
                        shippingAddress: true,
                        orderItems: { include: { product: true } }
                    }
                });
            } catch (receiptError) {
                console.error('Receipt upload error:', receiptError.message);
            }
        }

        const formatted = formatOrder(updatedOrder);
        const recipientEmail = formatted.user?.email;
        if (recipientEmail) {
            const receiptInfo = formatted.receiptURL ? `\nInvoice Receipt: ${formatted.receiptURL}` : '';
            const statusMessage = `Hello ${formatted.user?.name || 'Valued Customer'},\n\nYour TapMart order status has been updated!\n\nOrder ID: ${formatted.id}\nNew Status: ${formatted.status.toUpperCase()}\nPayment Status: ${formatted.paymentStatus.toUpperCase()}${receiptInfo}\n\nThank you for shopping with TapMart!`;
            sendOrderEmail(recipientEmail, `Order #${formatted.id.slice(-8)} Status Update: ${formatted.status.toUpperCase()}`, statusMessage);
        }

        res.json(formatted);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const cancelPendingPaymentOrder = async (req, res) => {
    try {
        const order = await prisma.order.findFirst({
            where: {
                id: req.params.id,
                userId: req.user.id,
                paymentMethod: 'razorpay',
                paymentStatus: 'pending'
            },
            include: { orderItems: true }
        });
        if (!order) return res.status(404).json({ message: 'Pending payment order not found' });

        await prisma.$transaction(async (tx) => {
            for (const item of order.orderItems) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { increment: item.qty } }
                });
            }
            await tx.order.delete({ where: { id: order.id } });
        });

        res.json({ message: 'Unpaid order cancelled' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Unable to cancel unpaid order' });
    }
};

module.exports = { createOrder, getAllOrders, getMyOrders, getOrderById, updateOrderStatus, cancelPendingPaymentOrder };
