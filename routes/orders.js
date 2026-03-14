
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
