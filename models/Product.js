
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
