/**
 * controllers/authController.js
 * ─────────────────────────────
 * Handles user authentication: login for both admin and regular users.
 *
 * PHASE 2 NOTE:
 *   Add OAuth / SSO support here. The JWT payload structure is already
 *   designed to be extended with provider info.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../config/database');

/**
 * POST /api/auth/login
 * Body: { username, password }
 *
 * Returns JWT token + user info on success.
 */
async function login(req, res) {
  try {
    const { username, password } = req.body;

    // Input validation
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim());

    if (!user) {
      // Use generic message to avoid username enumeration
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Generate JWT
    const payload = { id: user.id, username: user.username, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    });

    return res.json({
      success: true,
      token,
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

/**
 * POST /api/auth/register
 * Body: { username, password }
 *
 * Registers a regular user (not admin).
 * Admin accounts are created via seeding or directly in DB.
 */
async function register(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const db = getDb();
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username.trim());
    if (existing) {
      return res.status(409).json({ success: false, message: 'Username already taken.' });
    }

    const hash = await bcrypt.hash(password, 12);
    const result = db
      .prepare("INSERT INTO users (username, password, role) VALUES (?, ?, 'user')")
      .run(username.trim(), hash);

    const payload = { id: result.lastInsertRowid, username: username.trim(), role: 'user' };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    });

    return res.status(201).json({
      success: true,
      token,
      user: { id: result.lastInsertRowid, username: username.trim(), role: 'user' },
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

/**
 * GET /api/auth/me
 * Returns current user info from token.
 */
function me(req, res) {
  return res.json({ success: true, user: req.user });
}

module.exports = { login, register, me };
