// routes/requests.js
import express from 'express';
import { getDB, generateUUID } from '../database/database.js';
import { authRequired } from '../middleware/auth.js';

const router = express.Router();

// Get all quote requests for the authenticated user
router.get('/', authRequired, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const db = getDB();

    // Build query based on status filter
    let query = `
      SELECT id, customer_name, customer_email, customer_phone, 
      message, status, created_at, updated_at 
      FROM quote_requests WHERE user_id = ?
    `;
    let params = [userId];

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    // Execute query
    const requests = await db.all(query, params);

    res.status(200).json({ requests });
  } catch (error) {
    console.error('Get quote requests error:', error);
    res.status(500).json({ error: 'Failed to fetch quote requests' });
  }
});

// Get specific quote request with items
router.get('/:id', authRequired, async (req, res) => {
  try {
    const userId = req.user.id;
    const requestId = req.params.id;

    const db = getDB();

    // Get quote request
    const quoteRequest = await db.get(
      `SELECT id, customer_name, customer_email, customer_phone, 
       message, status, created_at, updated_at 
       FROM quote_requests WHERE id = ? AND user_id = ?`,
      [requestId, userId]
    );

    if (!quoteRequest) {
      return res.status(404).json({ error: 'Quote request not found' });
    }

    // Set user_id
    quoteRequest.user_id = userId;

    // Get quote request items with product details
    const items = await db.all(`
      SELECT qri.id, qri.product_id, qri.quantity, qri.created_at,
             p.name, p.description, p.image_url, p.price, 
             p.min_quantity, p.shipping_charges, p.gst_amount, p.delivery_time
      FROM quote_request_items qri
      JOIN products p ON qri.product_id = p.id
      WHERE qri.quote_request_id = ?
    `, [requestId]);

    // Format items to include product details
    const formattedItems = items.map(item => {
      const product = {
        id: item.product_id,
        name: item.name,
        description: item.description,
        image_url: item.image_url,
        price: item.price,
        min_quantity: item.min_quantity,
        shipping_charges: item.shipping_charges,
        gst_amount: item.gst_amount,
        delivery_time: item.delivery_time,
        user_id: userId
      };

      return {
        id: item.id,
        quote_request_id: requestId,
        product_id: item.product_id,
        quantity: item.quantity,
        created_at: item.created_at,
        product
      };
    });

    // Add items to the request
    quoteRequest.items = formattedItems;

    res.status(200).json({ request: quoteRequest });
  } catch (error) {
    console.error('Get quote request error:', error);
    res.status(500).json({ error: 'Failed to fetch quote request details' });
  }
});

// Update quote request status
router.put('/:id', authRequired, async (req, res) => {
  try {
    const userId = req.user.id;
    const requestId = req.params.id;
    const { status } = req.body;

    // Validate status
    if (!status || !['pending', 'processed', 'rejected'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status. Must be one of: pending, processed, rejected'
      });
    }

    const db = getDB();

    // Check if quote request exists and belongs to the user
    const existingRequest = await db.get(
      'SELECT id FROM quote_requests WHERE id = ? AND user_id = ?',
      [requestId, userId]
    );

    if (!existingRequest) {
      return res.status(404).json({ error: 'Quote request not found' });
    }

    // Update status
    await db.run(
      'UPDATE quote_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, requestId]
    );

    res.status(200).json({ message: 'Quote request updated successfully' });
  } catch (error) {
    console.error('Update quote request error:', error);
    res.status(500).json({ error: 'Failed to update quote request' });
  }
});

// Create a new quote request (public endpoint)
router.post('/', async (req, res) => {
  try {
    const {
      userId,
      customerName,
      customerEmail,
      customerPhone,
      message,
      products
    } = req.body;

    // Validate required fields
    if (!userId || !customerName || !customerEmail) {
      return res.status(400).json({
        error: 'User ID, customer name, and customer email are required'
      });
    }

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'At least one product is required' });
    }

    const db = getDB();

    // Verify user exists
    const user = await db.get('SELECT id FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Start transaction
    await db.run('BEGIN TRANSACTION');

    try {
      // Create quote request
      const quoteRequestId = generateUUID();
      
      await db.run(
        `INSERT INTO quote_requests (
          id, user_id, customer_name, customer_email, customer_phone, message, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          quoteRequestId,
          userId,
          customerName,
          customerEmail,
          customerPhone || '',
          message || '',
          'pending'
        ]
      );

      // Insert quote request items
      for (const product of products) {
        if (!product.productId || product.quantity <= 0) {
          continue; // Skip invalid items
        }

        // Verify product exists and belongs to the user
        const existingProduct = await db.get(
          'SELECT id FROM products WHERE id = ? AND user_id = ?',
          [product.productId, userId]
        );
        
        if (!existingProduct) {
          throw new Error(`Invalid product ID: ${product.productId}`);
        }

        // Insert quote request item
        const itemId = generateUUID();
        await db.run(
          'INSERT INTO quote_request_items (id, quote_request_id, product_id, quantity) VALUES (?, ?, ?, ?)',
          [itemId, quoteRequestId, product.productId, product.quantity]
        );
      }

      // Commit transaction
      await db.run('COMMIT');

      res.status(201).json({
        message: 'Quote request created successfully',
        request_id: quoteRequestId
      });
    } catch (error) {
      // Rollback transaction on error
      await db.run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Create quote request error:', error);
    res.status(500).json({ error: 'Failed to create quote request' });
  }
});

export default router;