const express = require('express');
const router = express.Router();
const ItemView = require('../models/Views');

// Get all views
router.get('/get-all-views', async (req, res) => {
    try {
        // Find all item view documents in the database
        const views = await ItemView.find();
        res.json({ views });
    } catch (err) {
        console.error('Error fetching item views', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Increase view count for a specific item
router.post('/update-view-count', async (req, res) => {
    try {
        const { brand, model } = req.body;

        // Find the item view document by brand and model
        let itemView = await ItemView.findOne({ brand, model });

        if (!itemView) {
            // If the item view document doesn't exist, create a new one
            itemView = new ItemView({
                brand,
                model,
            });
        }

        // Increase the view count
        itemView.viewCount++;

        // Save or update the item view document
        await itemView.save();

        res.json({ message: 'Item view count updated' });
    } catch (err) {
        console.error('Error updating item view count', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
