
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
