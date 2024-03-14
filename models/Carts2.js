const mongoose = require('mongoose');

const cartsSchema = new mongoose.Schema({
    totalPrice: {
        type: Number,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    unique_id: {
        type: String,
        required: true,
        unique: true,
    },
    orderStatus:{
        type:String
    },
    shoeVariations: [
        {
            img: {
                type:String,
            },
            id: {
                type:String,
                unique:true
            },
            album:{
                type:String,
                required:true
            },
            genre:{
                type:String,
            },
            name: {
                type: String,
                required: true,
            },
            price: {
                type:Number,
                required: true,
            }
        },
        // You can add more variations as needed
    ],
    purchaseDate: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('carts', cartsSchema);
