const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/foodstore')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect', err));

const adminSchema = new mongoose.Schema({
    username: String,
    password: String,
    role: String
});

adminSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

const Admin = mongoose.model('Admin', adminSchema);

async function createAdmin() {
    try {
        const exists = await Admin.findOne({ username: 'admin' });
        if (exists) {
            console.log('Admin already exists!');
            process.exit(0);
        }
        const admin = new Admin({ username: 'admin', password: 'admin123', role: 'admin' });
        await admin.save();
        console.log('Admin created successfully! Username: admin, Password: admin123');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

createAdmin();