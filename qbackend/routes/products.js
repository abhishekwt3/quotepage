// routes/products.js
import express from 'express';
import path from 'path';
import fs from 'fs';
import { getDB, generateUUID } from '../database/database.js';
import { authRequired } from '../middleware/auth.js';
import { handleUploadErrors } from '../middleware/upload.js';

const router = express.Router();

// Get all products for the authenticated user
router.get('/', authRequired, async (req, res) => {
  try {
    const userId = req.user.id;
    const db = getDB();

    // Query products
    const products = await db.all(
      `SELECT id, name, description, image_url, price, min_quantity, 
       shipping_charges, gst_amount, delivery_time, created_at, updated_at 
       FROM products WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [userId]
    );

    // Add user_id to each product
    products.forEach(product => {
      product.user_id = userId;
    });

    res.status(200).json({ products });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Create a new product
router.post('/', authRequired, handleUploadErrors, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      description,
      price,
      min_quantity,
      shipping_charges,
      gst_amount,
      delivery_time
    } = req.body;

    // Validate required fields
    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    // Parse numeric values
    const parsedPrice = parseFloat(price);
    const parsedMinQuantity = min_quantity ? parseInt(min_quantity) : 1;
    const parsedShippingCharges = shipping_charges ? parseFloat(shipping_charges) : 0;
    const parsedGstAmount = gst_amount ? parseFloat(gst_amount) : 0;

    // Check if numeric values are valid
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ error: 'Invalid price' });
    }
    if (isNaN(parsedMinQuantity) || parsedMinQuantity < 1) {
      return res.status(400).json({ error: 'Invalid minimum quantity' });
    }
    if (isNaN(parsedShippingCharges) || parsedShippingCharges < 0) {
      return res.status(400).json({ error: 'Invalid shipping charges' });
    }
    if (isNaN(parsedGstAmount) || parsedGstAmount < 0) {
      return res.status(400).json({ error: 'Invalid GST amount' });
    }

    // Get image URL from uploaded file
    let imageURL = '';
    if (req.file) {
      imageURL = `/uploads/products/${req.file.filename}`;
    }

    const db = getDB();
    const productId = generateUUID();

    // Insert into database
    await db.run(
      `INSERT INTO products (
        id, user_id, name, description, image_url, price, 
        min_quantity, shipping_charges, gst_amount, delivery_time
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        productId,
        userId,
        name,
        description || '',
        imageURL,
        parsedPrice,
        parsedMinQuantity,
        parsedShippingCharges,
        parsedGstAmount,
        delivery_time || ''
      ]
    );

    // Get the created product
    const product = await db.get(
      `SELECT id, name, description, image_url, price, min_quantity, 
       shipping_charges, gst_amount, delivery_time, created_at, updated_at 
       FROM products WHERE id = ?`,
      [productId]
    );

    product.user_id = userId;

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Get a specific product
router.get('/:id', authRequired, async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = req.params.id;
    const db = getDB();

    // Query product
    const product = await db.get(
      `SELECT id, name, description, image_url, price, min_quantity, 
       shipping_charges, gst_amount, delivery_time, created_at, updated_at 
       FROM products WHERE id = ? AND user_id = ?`,
      [productId, userId]
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    product.user_id = userId;

    res.status(200).json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Update a product
router.put('/:id', authRequired, handleUploadErrors, async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = req.params.id;
    const {
      name,
      description,
      price,
      min_quantity,
      shipping_charges,
      gst_amount,
      delivery_time
    } = req.body;

    const db = getDB();

    // Check if product exists and belongs to user
    const existingProduct = await db.get(
      'SELECT id, image_url FROM products WHERE id = ? AND user_id = ?',
      [productId, userId]
    );

    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Validate required fields
    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    // Parse numeric values
    const parsedPrice = parseFloat(price);
    const parsedMinQuantity = min_quantity ? parseInt(min_quantity) : 1;
    const parsedShippingCharges = shipping_charges ? parseFloat(shipping_charges) : 0;
    const parsedGstAmount = gst_amount ? parseFloat(gst_amount) : 0;

    // Handle image upload
    let imageURL = existingProduct.image_url || '';

    if (req.file) {
      // Remove old image if exists
      if (existingProduct.image_url && existingProduct.image_url.startsWith('/uploads/')) {
        const oldImagePath = path.join(process.cwd(), existingProduct.image_url);
        
        try {
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        } catch (err) {
          console.error('Failed to delete old image:', err);
          // Continue even if deleting old image fails
        }
      }

      // Set new image URL
      imageURL = `/uploads/products/${req.file.filename}`;
    }

    // Update product in database
    await db.run(
      `UPDATE products SET 
        name = ?, description = ?, image_url = ?, price = ?, 
        min_quantity = ?, shipping_charges = ?, gst_amount = ?, 
        delivery_time = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ? AND user_id = ?`,
      [
        name,
        description || '',
        imageURL,
        parsedPrice,
        parsedMinQuantity,
        parsedShippingCharges,
        parsedGstAmount,
        delivery_time || '',
        productId,
        userId
      ]
    );

    // Get updated product
    const updatedProduct = await db.get(
      `SELECT id, name, description, image_url, price, min_quantity, 
       shipping_charges, gst_amount, delivery_time, created_at, updated_at 
       FROM products WHERE id = ?`,
      [productId]
    );

    updatedProduct.user_id = userId;

    res.status(200).json({
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete a product
router.delete('/:id', authRequired, async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = req.params.id;
    const db = getDB();

    // Get product to check image URL
    const product = await db.get(
      'SELECT id, image_url FROM products WHERE id = ? AND user_id = ?',
      [productId, userId]
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Delete the product
    await db.run(
      'DELETE FROM products WHERE id = ? AND user_id = ?',
      [productId, userId]
    );

    // Remove image if exists
    if (product.image_url && product.image_url.startsWith('/uploads/')) {
      const imagePath = path.join(process.cwd(), product.image_url);
      
      try {
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      } catch (err) {
        console.error('Failed to delete image:', err);
        // Continue even if deleting image fails
      }
    }

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;