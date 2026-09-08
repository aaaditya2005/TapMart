const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const optionalProtect = async (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) return next();

    if (!authorization.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Not authorized, invalid token format' });
    }

    try {
        const token = authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await prisma.user.findUnique({ where: { id: decoded.id } });
        if (!user) return res.status(401).json({ message: 'Not authorized, user not found' });

        const { password, ...userWithoutPassword } = user;
        req.user = { ...userWithoutPassword, _id: user.id };
        return next();
    } catch {
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

module.exports = optionalProtect;