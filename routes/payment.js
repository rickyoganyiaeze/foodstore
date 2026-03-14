
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
