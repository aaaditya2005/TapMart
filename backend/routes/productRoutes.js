const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); 

const { getProducts, createProduct, getProductById, createProductReview, updateProduct, deleteProduct } = require('../controllers/productController');

const protect = require('../middlewares/authMiddleware');
const admin = require('../middlewares/adminMiddleware');
const optionalProtect = require('../middlewares/optionalAuthMiddleware');
const customer = require('../middlewares/customerMiddleware');

router.get('/', optionalProtect, customer, getProducts);
router.get('/admin', protect, admin, getProducts);
router.post('/',protect,admin,upload.single('image'),createProduct);

router.get('/:id', optionalProtect, customer, getProductById);
router.post('/:id/reviews', protect, createProductReview);
router.put('/:id',protect,admin,upload.single('image'),updateProduct);
router.delete('/:id',protect,admin,upload.single('image'),deleteProduct);

module.exports = router;