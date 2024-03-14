const express = require('express');
const router = express.Router();
const Cart = require('../models/Carts2');
const Order = require('../models/Orders2'); // Import the Orders model

const { v4: uuidv4 } = require('uuid'); // Import the uuidv4 function


// Add an item to the user's cart
router.post('/add-to-cart', async (req, res) => {
    try {
        const { email, shoeVariation } = req.body;

        // Find the user's cart by email
        let cart = await Cart.findOne({ email });
        
        console.log(email,cart)
        if (!cart) {
            const unique_id = uuidv4(); // Generate a unique ID for the cart
            // If the user doesn't have a cart yet, create one
            cart = new Cart({
                email,
                totalPrice: 0, // Initialize the total price
                orderStatus: 'cart', // Assuming this is the initial status
                shoeVariations: [],
                unique_id: unique_id, // Generate a unique ID for the cart
            });
        }

        // Add the shoeVariation to the cart
        cart.shoeVariations.push(shoeVariation);

        // Update the total price
        cart.totalPrice += shoeVariation.price;

        // Save the updated cart
        await cart.save();

        res.json({cart: cart, message:"Successfully carted!"});
    } catch (err) {
        console.error('Error adding item to cart', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Retrieve the user's cart items
router.get('/cart/:email', async (req, res) => {
    try {
        const { email } = req.params;
        // Find the user's cart by email
        const cart = await Cart.findOne({ email });

        if (!cart) {
        return res.status(404).json({ error: 'Cart not found' });
        }

        res.json({cart:cart, message:"Cart has been found"});
    } catch (err) {
        console.error('Error retrieving user cart', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/cart/:email/remove-checked-items', async (req, res) => {
    try {
        const { email } = req.params;
        const { itemsToRemove } = req.body;

        // Find the user's cart by email
        const cart = await Cart.findOne({ email });
        console.log(itemsToRemove,cart)

        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        // Collect information for creating orders from the removed items
        const removedItems = cart.shoeVariations.filter((item) => itemsToRemove.includes(item.id));

        // Create an array of unique brand-model pairs from the removed items
        const uniqueBrandModelPairs = [...new Set(removedItems.map(item => `${item.album}-${item.name}-${item.genre}`))];

        // Update or create orders in the Orders schema
        for (const pair of uniqueBrandModelPairs) {
            const [album, name, genre] = pair.split('-');
            const sellerCount = removedItems.filter(item => item.album === album && item.name === name).length;

            // Find an existing order with the same album and name
            const existingOrder = await Order.findOne({ album, name, genre });

            if (existingOrder) {
                // If an order exists, update the sellerCount
                existingOrder.sellerCount += sellerCount;
                await existingOrder.save();
            } else {
                // If no order exists, create a new one
                await Order.create({
                    album,
                    name,
                    genre,
                    sellerCount,
                    // Add any other relevant order properties here
                });
            }
        }

        // Remove checked items from the cart
        cart.shoeVariations = cart.shoeVariations.filter((item) => !itemsToRemove.includes(item.id));

        // Recalculate the total price based on remaining items
        cart.totalPrice = cart.shoeVariations.reduce(
            (total, item) => total + item.price,
            0
        );

        // Save the updated cart
        await cart.save();

        res.json({ cart, message: 'Checked items removed from cart, orders updated/created' });
    } catch (err) {
        console.error('Error removing checked items from cart and updating/creating orders:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/cart/:email/remove-item/:itemId', async (req, res) => {
    try {
        const { email, itemId } = req.params;

        // Find the user's cart by email
        const cart = await Cart.findOne({ email });

        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        // Find the index of the item with matching itemId in the shoeVariations array
        const itemIndex = cart.shoeVariations.findIndex((item) => item.id === itemId);

        if (itemIndex === -1) {
            return res.status(404).json({ error: 'Item not found in cart' });
        }

        // Remove the item from the shoeVariations array
        const removedItem = cart.shoeVariations.splice(itemIndex, 1)[0];

        // Update the total price by subtracting the removed item's price
        cart.totalPrice -= removedItem.price;

        // Save the updated cart
        await cart.save();

        res.json(cart);
    } catch (error) {
        console.error('Error deleting item from cart:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


module.exports = router;
