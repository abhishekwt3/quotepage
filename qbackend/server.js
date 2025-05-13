// server.js - Updated with fixed routing order
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import requestRoutes from './routes/requests.js';
import storeRoutes from './routes/stores.js';
import dashboardRoutes from './routes/dashboard.js';
import { initDB } from './database/database.js';

// Initialize environment variables
dotenv.config();

// Create uploads directories if they don't exist
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, 'uploads');
const productsUploadsDir = path.join(uploadsDir, 'products');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
if (!fs.existsSync(productsUploadsDir)) {
  fs.mkdirSync(productsUploadsDir);
}

// Initialize database
initDB();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev')); // Logging

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Set up routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/quote-requests', requestRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/stores', storeRoutes);

// API public routes for the frontend
app.get('/api/public/stores/:storeName', async (req, res) => {
  try {
    // Redirect to the proper store API endpoint
    const { storeName } = req.params;
    const response = await fetch(`http://localhost:${PORT}/api/stores/${storeName}`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Public store fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch store information' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Handle 404 errors with JSON instead of HTML
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Something went wrong on the server'
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});