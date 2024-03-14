const express = require('express');
const router = express.Router();
const Order = require('../models/Orders2'); // Import the Orders model


router.get('/get-all-orders', async (req, res) => {
    try {
        // Use the `find` method to retrieve all orders from the Orders schema
        const orders = await Order.find();

        // Return the orders as JSON in the response
        res.json({ orders });
    } catch (error) {
        console.error('Error retrieving orders:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


module.exports = router;
