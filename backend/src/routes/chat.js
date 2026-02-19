/**
 * routes/chat.js
 * ──────────────
 * Public chat endpoints (no auth required for the chat itself).
 * Optional token is parsed if present (for logging user ID).
 */

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { sendMessage, getFaqs, getWelcome } = require('../controllers/chatController');

// Optional auth: attach user if token is present but don't require it
const jwt = require('jsonwebtoken');
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    } catch (_) { /* ignore invalid token */ }
  }
  next();
}

// Rate limit chat messages: 60 per minute per IP
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, message: 'Too many messages. Please slow down.' },
});

router.get('/welcome', getWelcome);
router.get('/faqs', getFaqs);
router.post('/message', chatLimiter, optionalAuth, sendMessage);

module.exports = router;
