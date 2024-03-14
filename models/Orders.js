const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    brand: {
        type: String,
        required: true,
    },
    model: {
        type: String,
        required: true,
    },
    sellerCount: {
        type: Number,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    // Add any other properties you need for orders here
    // For example, you can include order date, user information, etc.
});

module.exports = mongoose.model('Order', orderSchema);
