// routes/dashboard.js
import express from 'express';
import { getDB } from '../database/database.js';
import { authRequired } from '../middleware/auth.js';

const router = express.Router();

// Get dashboard statistics
router.get('/stats', authRequired, async (req, res) => {
  try {
    const userId = req.user.id;
    const db = getDB();

    // Get total products count
    const productCountResult = await db.get(
      'SELECT COUNT(*) as count FROM products WHERE user_id = ?',
      [userId]
    );
    const totalProducts = productCountResult ? productCountResult.count : 0;

    // Get total requests count
    const requestCountResult = await db.get(
      'SELECT COUNT(*) as count FROM quote_requests WHERE user_id = ?',
      [userId]
    );
    const totalRequests = requestCountResult ? requestCountResult.count : 0;

    // Get pending requests count
    const pendingRequestsResult = await db.get(
      "SELECT COUNT(*) as count FROM quote_requests WHERE user_id = ? AND status = 'pending'",
      [userId]
    );
    const pendingRequests = pendingRequestsResult ? pendingRequestsResult.count : 0;

    // Get processed requests count
    const processedRequestsResult = await db.get(
      "SELECT COUNT(*) as count FROM quote_requests WHERE user_id = ? AND status = 'processed'",
      [userId]
    );
    const processedRequests = processedRequestsResult ? processedRequestsResult.count : 0;

    // Get rejected requests count
    const rejectedRequestsResult = await db.get(
      "SELECT COUNT(*) as count FROM quote_requests WHERE user_id = ? AND status = 'rejected'",
      [userId]
    );
    const rejectedRequests = rejectedRequestsResult ? rejectedRequestsResult.count : 0;

    res.status(200).json({
      totalProducts,
      totalRequests,
      pendingRequests,
      processedRequests,
      rejectedRequests
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

export default router;