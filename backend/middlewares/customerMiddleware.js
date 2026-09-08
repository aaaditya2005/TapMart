const customer = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') return next();
    return res.status(403).json({ message: 'Admin accounts cannot access customer shopping routes' });
};

module.exports = customer;