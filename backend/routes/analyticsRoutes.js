const express = require('express');
const router = express.Router();

const protect = require('../middlewares/authMiddleware');
const admin = require('../middlewares/adminMiddleware');
const { getAdminStats } = require('../controllers/analyticsController');

router.get('/',protect, admin, getAdminStats);

module.exports = router;