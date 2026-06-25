// src/middleware/auth.js
// This runs BEFORE protected routes.
// It checks the token the frontend sends in the Authorization header.
// If token is valid → req.user gets set → next() lets the request through.
// If token is missing or wrong → we immediately return 401 Unauthorized.

const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // Frontend must send: Authorization: Bearer <token>
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  // Split "Bearer eyJhbGc..." into ["Bearer", "eyJhbGc..."]
  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token format invalid. Use: Bearer <token>' });
  }

  try {
    // jwt.verify throws an error if token is expired or tampered with
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Now any route can access req.user.id, req.user.email
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalid or expired' });
  }
};

module.exports = authMiddleware;
