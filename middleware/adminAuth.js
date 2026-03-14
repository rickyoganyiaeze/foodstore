
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
