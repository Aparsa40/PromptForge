/**
 * routes/auth.js
 * ──────────────
 * Authentication endpoints.
 */

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { authenticate } = require('../middleware/auth');
const { login, register, me } = require('../controllers/authController');

// Limit login attempts: max 10 per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts. Please try again later.' },
});

router.post('/login', loginLimiter, login);
router.post('/register', register);
router.get('/me', authenticate, me);

module.exports = router;
