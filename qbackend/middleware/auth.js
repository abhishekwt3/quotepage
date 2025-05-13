// middleware/auth.js
import jwt from 'jsonwebtoken';

// JWT secret key - in production, this should be stored securely
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key'; // Change this in production

// Authentication middleware
export const authRequired = (req, res, next) => {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header is required' });
    }

    // Check if the format is "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ error: 'Authorization header format must be Bearer <token>' });
    }

    // Get the token string
    const tokenString = parts[1];

    // Verify the token
    jwt.verify(tokenString, JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error('Token verification error:', err);
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      // Check if user_id is in the decoded token
      if (!decoded.user_id) {
        return res.status(401).json({ error: 'Invalid token claims' });
      }

      // Set the user ID in request for use in protected routes
      req.user = { id: decoded.user_id };
      next();
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
};

// Generate JWT token
export const generateToken = (userId) => {
  return jwt.sign(
    { user_id: userId },
    JWT_SECRET,
    { expiresIn: '7d' } // Token expires in 7 days
  );
};