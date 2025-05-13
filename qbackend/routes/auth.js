// routes/auth.js
import express from 'express';
import bcrypt from 'bcrypt';
import { getDB, generateUUID } from '../database/database.js';
import { authRequired, generateToken } from '../middleware/auth.js';

const router = express.Router();

// Signup endpoint
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    const db = getDB();

    // Check if email already exists
    const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const userId = generateUUID();
    await db.run(
      'INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)',
      [userId, name, normalizedEmail, hashedPassword]
    );

    // Generate JWT token
    const token = generateToken(userId);

    // Fetch the created user (without password)
    const user = await db.get(
      'SELECT id, name, email, store_name, created_at FROM users WHERE id = ?',
      [userId]
    );

    // Return token and user info
    res.status(201).json({
      token,
      user
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    const db = getDB();

    // Get user by email
    const user = await db.get(
      'SELECT id, name, email, store_name, password_hash FROM users WHERE email = ?',
      [normalizedEmail]
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = generateToken(user.id);

    // Return token and user info (without password)
    delete user.password_hash;
    
    res.status(200).json({
      token,
      user
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to authenticate' });
  }
});

// Get current user endpoint
router.get('/me', authRequired, async (req, res) => {
  try {
    const userId = req.user.id;
    const db = getDB();

    // Get user info
    const user = await db.get(
      'SELECT id, name, email, store_name, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to get user information' });
  }
});

export default router;