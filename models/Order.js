
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
