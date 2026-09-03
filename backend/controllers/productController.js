const prisma = require('../config/prisma');
const cloudinary = require('../config/cloudinary');

const normalizeTags = (tags) => {
    if (Array.isArray(tags)) return tags.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean);
    if (typeof tags === 'string') {
        try {
            return normalizeTags(JSON.parse(tags));
        } catch {
            return tags.split(',').map((tag) => tag.trim().toLowerCase()).filter(Boolean);
        }
    }
    return [];
};

const formatProduct = (p) => {
    if (!p) return null;
    return {
        ...p,
        _id: p.id,
        reviews: Array.isArray(p.reviews) ? p.reviews.map((r) => ({ ...r, _id: r.id, user: r.userId })) : []
    };
};

const getProducts = async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            include: { reviews: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(products.map(formatProduct));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getProductById = async (req, res) => {
    try {
        const product = await prisma.product.findUnique({
            where: { id: req.params.id },
            include: { reviews: true }
        });
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(formatProduct(product));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createProduct = async (req, res) => {
    try {
        const { name, description, price, category, stock, tags } = req.body;
        if (!name || !description || price === undefined || !category || stock === undefined) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        const imageFile = req.file;
        if (!imageFile) {
            return res.status(400).json({ message: 'Image file is required' });
        }
        const result = await cloudinary.uploader.upload(imageFile.path);

        const createdProduct = await prisma.product.create({
            data: {
                name,
                description,
                price: Number(price),
                category,
                tags: normalizeTags(tags),
                imageURL: result.secure_url,
                stock: Number(stock)
            },
            include: { reviews: true }
        });

        res.status(201).json(formatProduct(createdProduct));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateProduct = async (req, res) => {
    try {
        const { name, description, price, category, stock, tags } = req.body;
        const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
        if (!existing) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (price !== undefined) updateData.price = Number(price);
        if (category !== undefined) updateData.category = category;
        if (stock !== undefined) updateData.stock = Number(stock);
        if (tags !== undefined) updateData.tags = normalizeTags(tags);
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path);
            updateData.imageURL = result.secure_url;
        }

        const updatedProduct = await prisma.product.update({
            where: { id: req.params.id },
            data: updateData,
            include: { reviews: true }
        });

        res.json(formatProduct(updatedProduct));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const product = await prisma.product.findUnique({ where: { id: req.params.id } });
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        if (product.imageURL) {
            try {
                const publicId = product.imageURL.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(publicId);
            } catch {
                // Ignore Cloudinary deletion error
            }
        }
        await prisma.product.delete({ where: { id: req.params.id } });
        res.json({ message: 'Product removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createProductReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const product = await prisma.product.findUnique({
            where: { id: req.params.id },
            include: { reviews: true }
        });
        if (!product) return res.status(404).json({ message: 'Product not found' });

        const ratingValue = Number(rating);
        if (!Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5) {
            return res.status(400).json({ message: 'Rating must be a whole number from 1 to 5' });
        }
        if (typeof comment !== 'string' || !comment.trim()) {
            return res.status(400).json({ message: 'A review comment is required' });
        }

        // Check if customer has a delivered order containing this product
        const deliveredOrder = await prisma.order.findFirst({
            where: {
                userId: req.user.id,
                status: 'delivered',
                orderItems: {
                    some: { productId: product.id }
                }
            }
        });
        if (!deliveredOrder) {
            return res.status(403).json({ message: 'Only customers with a delivered order can review this product' });
        }

        const alreadyReviewed = product.reviews.some((review) => review.userId === req.user.id);
        if (alreadyReviewed) {
            return res.status(409).json({ message: 'You have already reviewed this product' });
        }

        await prisma.review.create({
            data: {
                rating: ratingValue,
                comment: comment.trim(),
                name: req.user.name,
                userId: req.user.id,
                productId: product.id
            }
        });

        // Recalculate average rating & numReviews
        const updatedReviews = await prisma.review.findMany({ where: { productId: product.id } });
        const numReviews = updatedReviews.length;
        const avgRating = updatedReviews.reduce((sum, r) => sum + r.rating, 0) / numReviews;

        const updatedProduct = await prisma.product.update({
            where: { id: product.id },
            data: {
                numReviews,
                rating: avgRating
            },
            include: { reviews: true }
        });

        res.status(201).json(formatProduct(updatedProduct));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getProducts, createProduct, getProductById, updateProduct, deleteProduct, createProductReview };