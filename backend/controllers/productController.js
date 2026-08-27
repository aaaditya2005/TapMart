const Product = require('../model/Product');
const cloudinary = require('../config/cloudinary');

const getProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createProduct = async (req, res) => {
    try {
        const { name, description, price, category, stock } = req.body;
        if (!name || !description || !price || !category || !stock) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        const imageFile = req.file; 
        if (!imageFile) {
            return res.status(400).json({ message: 'Image file is required' });
        }
        const result = await cloudinary.uploader.upload(imageFile.path);

        // Create new product
        const product = new Product({
            name,
            description,
            price,
            category,
            imageURL: result.secure_url,
            stock
        });

        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateProduct = async (req, res) => {
    try {
        const { name, description, price, category, stock } = req.body;
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Update product fields
        product.name = name || product.name;
        product.description = description || product.description;
        product.price = price || product.price;
        product.category = category || product.category;
        product.stock = stock || product.stock;
        if(req.file) {
            const result = await cloudinary.uploader.upload(req.file.path);
            product.imageURL = result.secure_url;
        }
        const updatedProduct = await product.save();
        res.json(updatedProduct);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        if (product.imageURL) {
            const publicId = product.imageURL.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);
        }
        await Product.deleteOne({ _id: req.params.id });
        res.json({ message: 'Product removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getProducts, createProduct, getProductById, updateProduct, deleteProduct };