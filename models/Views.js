const mongoose = require('mongoose');

const itemViewSchema = new mongoose.Schema({
    brand: {
        type: String,
        required: true,
    },
    model: {
        type: String,
        required: true,
    },
    viewCount: {
        type: Number,
        default: 0, // Initial view count is 0
    },
});

module.exports = mongoose.model('ItemView', itemViewSchema);
