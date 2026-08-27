const express = require('express');
const router = express.Router();

const protect = require('../middlewares/authMiddleware');
const admin = require('../middlewares/adminMiddleware');

const { createOrder, getAllOrders, getOrderById, updateOrderStatus } = require('../controllers/orderController');

router.post('/', protect, createOrder);
router.get('/', protect, admin, getAllOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/status', protect, admin, updateOrderStatus);

module.exports = router;