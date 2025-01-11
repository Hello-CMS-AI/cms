// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    // 1. Get the Authorization header and ensure it starts with 'Bearer '
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // 2. Extract the token from 'Bearer <token>'
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // 3. Verify the token with your secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 4. Attach user info (id, etc.) to req.user
    req.user = decoded;

    // 5. Call next() to pass control to the next middleware/route
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = authMiddleware;
