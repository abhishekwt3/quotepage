// routes/stores.js - Fixed version
import express from 'express';
import { getDB } from '../database/database.js';
import { authRequired } from '../middleware/auth.js';

const router = express.Router();

// Get store by name (public endpoint)
router.get('/:storeName', async (req, res) => {
  try {
    const { storeName } = req.params;
    
    if (!storeName) {
      return res.status(400).json({ error: 'Store name is required' });
    }

    // Debug information
    console.log(`GET /api/stores/${storeName} - Fetching store`);

    const db = getDB();

    // Get user by store name
    const store = await db.get(
      'SELECT id, name, email, store_name FROM users WHERE store_name = ?',
      [storeName]
    );
    
    // Debug store result
    console.log(`Store lookup result:`, store ? 'Found' : 'Not found');
    
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Query products
    const products = await db.all(
      `SELECT id, name, description, image_url, price, min_quantity, 
       shipping_charges, gst_amount, delivery_time, created_at 
       FROM products WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [store.id]
    );

    // Debug products result
    console.log(`Found ${products.length} products for store`);

    // Add user_id to each product
    products.forEach(product => {
      product.user_id = store.id;
    });

    // Return JSON response
    return res.status(200).json({
      store,
      products
    });
  } catch (error) {
    console.error('Get store error:', error);
    return res.status(500).json({ error: 'Failed to fetch store information' });
  }
});

// Make sure check-availability endpoint is registered BEFORE the :storeName parameter route
// to avoid route conflicts
router.get('/check-availability', async (req, res) => {
  try {
    const storeName = req.query.name;
    
    if (!storeName) {
      return res.status(400).json({ error: 'Store name is required' });
    }

    // Normalize store name to lowercase
    const normalizedStoreName = storeName.toLowerCase();

    const db = getDB();

    // Check if store name is already taken
    const existingUser = await db.get(
      'SELECT id FROM users WHERE store_name = ?',
      [normalizedStoreName]
    );

    res.status(200).json({
      available: !existingUser
    });
  } catch (error) {
    console.error('Check store name availability error:', error);
    res.status(500).json({ error: 'Failed to check store name availability' });
  }
});

// Update store name
router.put('/update-name', authRequired, async (req, res) => {
  try {
    const userId = req.user.id;
    const { store_name } = req.body;
    
    if (!store_name) {
      return res.status(400).json({ error: 'Store name is required' });
    }

    // Validate store name (allowed: letters, numbers, dashes, underscores)
    const storeNameRegex = /^[a-zA-Z0-9\-_]+$/;
    if (!storeNameRegex.test(store_name)) {
      return res.status(400).json({
        error: 'Store name can only contain letters, numbers, dashes, and underscores'
      });
    }

    // Normalize store name to lowercase
    const normalizedStoreName = store_name.toLowerCase();

    const db = getDB();

    // Check if store name is already taken by another user
    const existingUser = await db.get(
      'SELECT id FROM users WHERE store_name = ? AND id != ?',
      [normalizedStoreName, userId]
    );
    
    if (existingUser) {
      return res.status(409).json({ error: 'Store name is already taken' });
    }

    // Update the store name
    await db.run(
      'UPDATE users SET store_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [normalizedStoreName, userId]
    );

    // Get updated user data
    const user = await db.get(
      'SELECT id, name, email, store_name FROM users WHERE id = ?',
      [userId]
    );

    res.status(200).json({
      message: 'Store name updated successfully',
      user
    });
  } catch (error) {
    console.error('Update store name error:', error);
    res.status(500).json({ error: 'Failed to update store name' });
  }
});

export default router;