const fs = require('fs');
const path = require('path');

const save = (filePath, content) => {
    fs.writeFileSync(path.join(__dirname, filePath), content);
    console.log('Created: ' + filePath);
};

if (!fs.existsSync('models')) fs.mkdirSync('models');
if (!fs.existsSync('routes')) fs.mkdirSync('routes');
if (!fs.existsSync('middleware')) fs.mkdirSync('middleware');

save('models/Product.js', `
const mongoose = require('mongoose');
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number, default: null },
    category: { type: String, required: true, enum: ['snacks', 'drinks', 'groceries', 'fast-food', 'fruits', 'dairy', 'bakery', 'other'] },
    image: { type: String, default: '' },
    stock: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    rating: { type: Number, default: 4.5 }
}, { timestamps: true });
module.exports = mongoose.model('Product', productSchema);
`);

save('models/Order.js', `
const mongoose = require('mongoose');
const orderSchema = new mongoose.Schema({
    orderNumber: { type: String, default: function() { return 'FS' + Date.now().toString(36).toUpperCase(); } },
    customer: { name: String, email: String, phone: String },
    deliveryAddress: { street: String, city: String, state: String },
    items: [{ product: mongoose.Schema.Types.ObjectId, name: String, image: String, price: Number, quantity: Number }],
    subtotal: Number, deliveryFee: Number, total: Number,
    paymentStatus: { type: String, default: 'pending' },
    orderStatus: { type: String, default: 'pending' }
}, { timestamps: true });
module.exports = mongoose.model('Order', orderSchema);
`);

save('models/Admin.js', `
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const adminSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    role: { type: String, default: 'admin' }
}, { timestamps: true });
adminSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});
adminSchema.methods.comparePassword = async function(p) { return bcrypt.compare(p, this.password); };
module.exports = mongoose.model('Admin', adminSchema);
`);

save('middleware/adminAuth.js', `
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
exports.protectAdmin = async (req, res, next) => {
    let token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.admin = await Admin.findById(decoded.id);
        next();
    } catch (e) {
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
};
`);

save('routes/products.js', `
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protectAdmin } = require('../middleware/adminAuth');

router.get('/', async (req, res) => { 
    try { res.json({ success: true, data: await Product.find() }); } 
    catch (e) { res.status(500).json({ success: false, message: e.message }); } 
});

router.get('/featured', async (req, res) => { 
    try { res.json({ success: true, data: await Product.find({ featured: true }).limit(8) }); } 
    catch (e) { res.status(500).json({ success: false, message: e.message }); } 
});

router.get('/:id', async (req, res) => { 
    try { const p = await Product.findById(req.params.id); if(!p) return res.status(404).json({message:'Not found'}); res.json({ success: true, data: p }); } 
    catch (e) { res.status(500).json({ success: false, message: e.message }); } 
});

router.post('/', protectAdmin, async (req, res) => { 
    try { const p = new Product(req.body); await p.save(); res.status(201).json({ success: true, data: p }); } 
    catch (e) { res.status(400).json({ success: false, message: e.message }); } 
});

router.put('/:id', protectAdmin, async (req, res) => { 
    try { const p = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json({ success: true, data: p }); } 
    catch (e) { res.status(400).json({ success: false, message: e.message }); } 
});

router.delete('/:id', protectAdmin, async (req, res) => { 
    try { await Product.findByIdAndDelete(req.params.id); res.json({ success: true }); } 
    catch (e) { res.status(500).json({ success: false, message: e.message }); } 
});

module.exports = router;
`);

save('routes/orders.js', `
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protectAdmin } = require('../middleware/adminAuth');

router.get('/', protectAdmin, async (req, res) => { 
    try { res.json({ success: true, data: await Order.find().sort({ createdAt: -1 }) }); } 
    catch (e) { res.status(500).json({ success: false, message: e.message }); } 
});

router.get('/:id', async (req, res) => { 
    try { res.json({ success: true, data: await Order.findById(req.params.id) }); } 
    catch (e) { res.status(404).json({ success: false, message: 'Not found' }); } 
});

router.post('/', async (req, res) => {
    try {
        const { customer, deliveryAddress, items } = req.body;
        let subtotal = 0;
        const orderItems = [];
        for (let item of items) {
            const product = await Product.findById(item.product);
            if (product) {
                orderItems.push({ product: product._id, name: product.name, image: product.image, price: product.price, quantity: item.quantity });
                subtotal += product.price * item.quantity;
            }
        }
        const deliveryFee = subtotal > 10000 ? 0 : 500;
        const order = new Order({ customer, deliveryAddress, items: orderItems, subtotal, deliveryFee, total: subtotal + deliveryFee });
        await order.save();
        res.status(201).json({ success: true, data: order });
    } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

router.put('/:id/status', protectAdmin, async (req, res) => { 
    try { res.json({ success: true, data: await Order.findByIdAndUpdate(req.params.id, req.body, { new: true }) }); } 
    catch (e) { res.status(400).json({ success: false, message: e.message }); } 
});

module.exports = router;
`);

save('routes/auth.js', `
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

router.post('/setup', async (req, res) => {
    try {
        if (await Admin.findOne()) return res.status(400).json({ message: 'Admin exists' });
        const admin = new Admin({ username: req.body.username || 'admin', password: req.body.password || 'admin123' });
        await admin.save();
        res.status(201).json({ success: true });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/login', async (req, res) => {
    try {
        const admin = await Admin.findOne({ username: req.body.username }).select('+password');
        if (!admin || !(await admin.comparePassword(req.body.password))) return res.status(401).json({ message: 'Invalid credentials' });
        const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ success: true, data: { token, admin: { id: admin._id, username: admin.username } } });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
`);

save('routes/payment.js', `
const express = require('express');
const router = express.Router();
const axios = require('axios');
const Order = require('../models/Order');

router.post('/initialize', async (req, res) => {
    try {
        const r = await axios.post('https://api.paystack.co/transaction/initialize', 
            { email: req.body.email, amount: Math.round(req.body.amount * 100), metadata: { orderId: req.body.orderId } }, 
            { headers: { Authorization: 'Bearer ' + process.env.PAYSTACK_SECRET_KEY, 'Content-Type': 'application/json' } }
        );
        res.json({ success: true, data: r.data.data });
    } catch (e) { res.status(500).json({ success: false, message: e.response?.data?.message || e.message }); }
});

router.get('/verify/:reference', async (req, res) => {
    try {
        const r = await axios.get('https://api.paystack.co/transaction/verify/' + req.params.reference, 
            { headers: { Authorization: 'Bearer ' + process.env.PAYSTACK_SECRET_KEY } }
        );
        if (r.data.data.status === 'success') await Order.findByIdAndUpdate(r.data.data.metadata.orderId, { paymentStatus: 'paid' });
        res.json({ success: true, data: r.data.data });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
`);

console.log('\n✅ All files created successfully! Now run: npm start');