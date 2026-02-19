/**
 * config/database.js
 * ──────────────────
 * Initialises the SQLite database and creates all tables on first run.
 * Uses better-sqlite3 (synchronous API) for simplicity and reliability.
 *
 * PHASE 2 NOTE:
 *   Replace this module with a connection pool (e.g. pg / mysql2) when
 *   migrating to PostgreSQL / MySQL for horizontal scaling.
 */

const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.cwd(), process.env.DB_PATH)
  : path.join(__dirname, '../../chatbot.db');

let db;

/**
 * Returns the singleton database connection.
 * Creates + seeds the database on first call.
 */
function getDb() {
  if (!db) {
    db = new Database(DB_PATH);

    // Enable WAL mode for better concurrent read performance
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    initSchema();
    seedAdmin();
  }
  return db;
}

/**
 * Creates all tables if they don't exist.
 *
 * Schema overview:
 *   users    — authentication records (admin + regular users)
 *   faqs     — question ↔ answer mappings (the core data)
 *   chat_logs — every conversation turn (for analytics in Phase 2)
 */
function initSchema() {
  db.exec(`
    -- ── Users ──────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      username    TEXT    NOT NULL UNIQUE,
      password    TEXT    NOT NULL,          -- bcrypt hash
      role        TEXT    NOT NULL DEFAULT 'user' CHECK(role IN ('admin','user')),
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    -- ── FAQ Entries ─────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS faqs (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      question    TEXT    NOT NULL,
      answer      TEXT    NOT NULL,
      category    TEXT    DEFAULT 'general',   -- extensible for Phase 2 categories
      is_active   INTEGER NOT NULL DEFAULT 1,  -- soft-delete support
      sort_order  INTEGER NOT NULL DEFAULT 0,
      created_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    -- ── Chat Logs ───────────────────────────────────────────────────────
    -- Tracks every message for future analytics / AI training data
    CREATE TABLE IF NOT EXISTS chat_logs (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id    TEXT    NOT NULL,           -- random UUID per chat session
      user_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
      message       TEXT    NOT NULL,           -- what the user typed
      response      TEXT,                       -- what the bot replied
      faq_id        INTEGER REFERENCES faqs(id) ON DELETE SET NULL,
      matched       INTEGER NOT NULL DEFAULT 0, -- 1 = found answer, 0 = no match
      source        TEXT    DEFAULT 'text'  CHECK(source IN ('text','faq_button')),
      created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    -- ── Indexes ─────────────────────────────────────────────────────────
    CREATE INDEX IF NOT EXISTS idx_faqs_active     ON faqs(is_active);
    CREATE INDEX IF NOT EXISTS idx_faqs_category   ON faqs(category);
    CREATE INDEX IF NOT EXISTS idx_logs_session    ON chat_logs(session_id);
    CREATE INDEX IF NOT EXISTS idx_logs_created    ON chat_logs(created_at);
  `);
}

/**
 * Seeds the default admin user from environment variables.
 * Only inserts if no admin exists (idempotent).
 */
function seedAdmin() {
  const existing = db.prepare("SELECT id FROM users WHERE role='admin' LIMIT 1").get();
  if (!existing) {
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'Admin@1234';
    const hash = bcrypt.hashSync(password, 12);

    db.prepare(
      "INSERT INTO users (username, password, role) VALUES (?, ?, 'admin')"
    ).run(username, hash);

    console.log(`✅ Default admin seeded — username: "${username}"`);
  }
}

module.exports = { getDb };
