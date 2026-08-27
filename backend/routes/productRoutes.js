const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); 

const { getProducts, createProduct, getProductById, updateProduct, deleteProduct } = require('../controllers/productController');

const protect = require('../middlewares/authMiddleware');
const admin = require('../middlewares/adminMiddleware');

router.get('/',getProducts);
router.post('/',protect,admin,upload.single('image'),createProduct);

router.get('/:id',getProductById);
router.put('/:id',protect,admin,upload.single('image'),updateProduct);
router.delete('/:id/',protect,admin,upload.single('image'),deleteProduct);

module.exports = router;