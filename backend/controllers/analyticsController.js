const prisma = require('../config/prisma');

const getAdminStats = async (req, res) => {
    try {
        const [totalOrders, totalUsers, totalProducts, aggregateRevenue] = await Promise.all([
            prisma.order.count(),
            prisma.user.count(),
            prisma.product.count(),
            prisma.order.aggregate({
                where: { status: 'delivered' },
                _sum: { totalPrice: true }
            })
        ]);

        const totalRevenue = aggregateRevenue._sum.totalPrice || 0;

        res.json({ totalOrders, totalUsers, totalProducts, totalRevenue });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getAdminStats };