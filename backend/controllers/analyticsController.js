const Order = require('../model/Order');
const Product = require('../model/Product');
const User = require('../model/User');

const getAdminStats = async (req, res) => {
    try {
        const totalOrders = await Order.countDocuments({ role: 'user' });
        const totalUsers = await User.countDocuments();
        const totalProducts = await Product.countDocuments();

        const orders = await Order.find({});

        const totalRevenue = orders.reduce((acc, order) => acc + order.totalPrice, 0);

        res.json({ totalOrders, totalUsers, totalProducts, totalRevenue });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getAdminStats };