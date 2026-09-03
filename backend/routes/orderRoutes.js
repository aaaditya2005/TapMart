const express = require('express');
const router = express.Router();

const protect = require('../middlewares/authMiddleware');
const admin = require('../middlewares/adminMiddleware');

const { createOrder, getAllOrders, getMyOrders, getOrderById, updateOrderStatus, cancelPendingPaymentOrder } = require('../controllers/orderController');

router.post('/', protect, createOrder);
router.get('/', protect, admin, getAllOrders);
router.get('/mine', protect, getMyOrders);
router.get('/:id', protect, getOrderById);
router.delete('/:id/payment-cancel', protect, cancelPendingPaymentOrder);
router.put('/:id/status', protect, admin, updateOrderStatus);

module.exports = router;