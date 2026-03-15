const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const Product = require('../models/Product');
const { protectAdmin } = require('../middleware/adminAuth');

// --- CONFIGURE CLOUDINARY ---
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// --- CONFIGURE STORAGE (CLOUDINARY) ---
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'foodstore_products',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
        public_id: (req, file) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            return 'product-' + uniqueSuffix;
        }
    }
});

const upload = multer({ storage: storage });

// --- PUBLIC ROUTES ---

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

// --- ADMIN ROUTES ---

router.post('/', protectAdmin, upload.single('image'), async (req, res) => {
    try {
        const productData = { ...req.body };
        
        // Cloudinary returns the URL in req.file.path
        if (req.file) {
            productData.image = req.file.path;
        }

        if (productData.price) productData.price = Number(productData.price);
        if (productData.stock) productData.stock = Number(productData.stock);
        if (productData.originalPrice) productData.originalPrice = Number(productData.originalPrice);
        productData.featured = (productData.featured === 'true' || productData.featured === true);

        const product = new Product(productData);
        await product.save();
        res.status(201).json({ success: true, data: product });
    } catch (e) {
        res.status(400).json({ success: false, message: e.message });
    }
});

router.put('/:id', protectAdmin, upload.single('image'), async (req, res) => {
    try {
        const productData = { ...req.body };
        
        if (req.file) {
            productData.image = req.file.path;
        }
        
        if (productData.price) productData.price = Number(productData.price);
        if (productData.stock) productData.stock = Number(productData.stock);
        productData.featured = (productData.featured === 'true' || productData.featured === true);

        const product = await Product.findByIdAndUpdate(req.params.id, productData, { new: true });
        res.json({ success: true, data: product });
    } catch (e) {
        res.status(400).json({ success: false, message: e.message });
    }
});

router.delete('/:id', protectAdmin, async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Deleted' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

module.exports = router;