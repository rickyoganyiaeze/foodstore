const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Product = require('../models/Product');
const { protectAdmin } = require('../middleware/adminAuth');

// Setup Multer for Image Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, 'product-' + Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

// Public Routes
router.get('/', async (req, res) => {
    try {
        const products = await Product.find();
        res.json({ success: true, data: products });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

router.get('/featured', async (req, res) => {
    try {
        const products = await Product.find({ featured: true }).limit(8);
        res.json({ success: true, data: products });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, data: product });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// Admin Routes - Create Product (with image upload)
router.post('/', protectAdmin, upload.single('image'), async (req, res) => {
    try {
        const productData = { ...req.body };
        
        // If an image was uploaded, save the path
        if (req.file) {
            productData.image = `/uploads/${req.file.filename}`;
        } else {
            // --- ADD THIS: Default image if none uploaded ---
            productData.image = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop';
        }

        // Convert types
        if (productData.price) productData.price = Number(productData.price);
        if (productData.stock) productData.stock = Number(productData.stock);
        if (productData.originalPrice) productData.originalPrice = Number(productData.originalPrice);
        // Convert featured string to boolean
        productData.featured = (productData.featured === 'true' || productData.featured === true);

        const product = new Product(productData);
        await product.save();
        res.status(201).json({ success: true, data: product });
    } catch (e) {
        res.status(400).json({ success: false, message: e.message });
    }
});

// Admin Routes - Update Product
router.put('/:id', protectAdmin, upload.single('image'), async (req, res) => {
    try {
        const productData = { ...req.body };
        if (req.file) {
            productData.image = `/uploads/${req.file.filename}`;
        }
        
        if (productData.price) productData.price = Number(productData.price);
        if (productData.stock) productData.stock = Number(productData.stock);

        const product = await Product.findByIdAndUpdate(req.params.id, productData, { new: true });
        res.json({ success: true, data: product });
    } catch (e) {
        res.status(400).json({ success: false, message: e.message });
    }
});

// Admin Routes - Delete Product
router.delete('/:id', protectAdmin, async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Deleted' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

module.exports = router;