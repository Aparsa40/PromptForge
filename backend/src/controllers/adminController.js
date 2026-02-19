/**
 * controllers/adminController.js
 * ───────────────────────────────
 * Admin-only operations: CRUD for FAQ entries, bulk upload, analytics.
 *
 * File upload supports:
 *   JSON  — [{ "question": "...", "answer": "..." }, ...]
 *   CSV   — question,answer (with header row)
 *   TXT   — question|answer (pipe-separated, one per line)
 */

const { getDb } = require('../config/database');
const { parse } = require('csv-parse/sync');
const fs = require('fs');

// ── Helpers ────────────────────────────────────────────────────────────────

function validateQA(question, answer) {
  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    return 'Question is required.';
  }
  if (!answer || typeof answer !== 'string' || answer.trim().length === 0) {
    return 'Answer is required.';
  }
  if (question.trim().length > 1000) return 'Question must be under 1000 characters.';
  if (answer.trim().length > 5000) return 'Answer must be under 5000 characters.';
  return null;
}

// ── FAQ CRUD ────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/faqs
 * Returns all FAQs (including inactive) for admin management.
 */
function listFaqs(req, res) {
  try {
    const db = getDb();
    const { category, active } = req.query;

    let query = 'SELECT f.*, u.username as created_by_name FROM faqs f LEFT JOIN users u ON f.created_by = u.id WHERE 1=1';
    const params = [];

    if (category) { query += ' AND f.category = ?'; params.push(category); }
    if (active !== undefined) { query += ' AND f.is_active = ?'; params.push(active === 'true' ? 1 : 0); }

    query += ' ORDER BY f.sort_order ASC, f.id DESC';

    const faqs = db.prepare(query).all(...params);
    return res.json({ success: true, faqs, total: faqs.length });
  } catch (err) {
    console.error('List FAQs error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

/**
 * POST /api/admin/faqs
 * Body: { question, answer, category?, sort_order? }
 */
function createFaq(req, res) {
  try {
    const { question, answer, category = 'general', sort_order = 0 } = req.body;

    const validationError = validateQA(question, answer);
    if (validationError) return res.status(400).json({ success: false, message: validationError });

    const db = getDb();
    const result = db
      .prepare('INSERT INTO faqs (question, answer, category, sort_order, created_by) VALUES (?, ?, ?, ?, ?)')
      .run(question.trim(), answer.trim(), category, sort_order, req.user.id);

    const faq = db.prepare('SELECT * FROM faqs WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json({ success: true, faq });
  } catch (err) {
    console.error('Create FAQ error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

/**
 * PUT /api/admin/faqs/:id
 * Body: { question?, answer?, category?, sort_order?, is_active? }
 */
function updateFaq(req, res) {
  try {
    const { id } = req.params;
    const { question, answer, category, sort_order, is_active } = req.body;

    const db = getDb();
    const existing = db.prepare('SELECT * FROM faqs WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ success: false, message: 'FAQ not found.' });

    // Partial update — use existing values as defaults
    const newQuestion = question !== undefined ? question.trim() : existing.question;
    const newAnswer = answer !== undefined ? answer.trim() : existing.answer;
    const newCategory = category !== undefined ? category : existing.category;
    const newSortOrder = sort_order !== undefined ? sort_order : existing.sort_order;
    const newIsActive = is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active;

    const validationError = validateQA(newQuestion, newAnswer);
    if (validationError) return res.status(400).json({ success: false, message: validationError });

    db.prepare(`
      UPDATE faqs
      SET question = ?, answer = ?, category = ?, sort_order = ?, is_active = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(newQuestion, newAnswer, newCategory, newSortOrder, newIsActive, id);

    const updated = db.prepare('SELECT * FROM faqs WHERE id = ?').get(id);
    return res.json({ success: true, faq: updated });
  } catch (err) {
    console.error('Update FAQ error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

/**
 * DELETE /api/admin/faqs/:id
 * Soft-delete by default; hard-delete with ?permanent=true
 */
function deleteFaq(req, res) {
  try {
    const { id } = req.params;
    const permanent = req.query.permanent === 'true';

    const db = getDb();
    const existing = db.prepare('SELECT id FROM faqs WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ success: false, message: 'FAQ not found.' });

    if (permanent) {
      db.prepare('DELETE FROM faqs WHERE id = ?').run(id);
    } else {
      db.prepare("UPDATE faqs SET is_active = 0, updated_at = datetime('now') WHERE id = ?").run(id);
    }

    return res.json({ success: true, message: `FAQ ${permanent ? 'permanently deleted' : 'deactivated'}.` });
  } catch (err) {
    console.error('Delete FAQ error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ── Bulk Upload ────────────────────────────────────────────────────────────

/**
 * POST /api/admin/faqs/upload
 * Multipart form: file (json | csv | txt)
 *
 * Returns summary of imported, skipped, and errored rows.
 */
function uploadFaqs(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const filePath = req.file.path;
    const ext = req.file.originalname.split('.').pop().toLowerCase();
    let rows = [];

    const raw = fs.readFileSync(filePath, 'utf-8');

    // ── Parse by file type ──────────────────────────────────────────
    if (ext === 'json') {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error('JSON must be an array of { question, answer } objects.');
      rows = parsed;

    } else if (ext === 'csv') {
      const records = parse(raw, { columns: true, skip_empty_lines: true, trim: true });
      rows = records.map((r) => ({ question: r.question || r.Question, answer: r.answer || r.Answer }));

    } else if (ext === 'txt') {
      rows = raw
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#'))
        .map((line) => {
          const [question, ...rest] = line.split('|');
          return { question: question?.trim(), answer: rest.join('|').trim() };
        });

    } else {
      fs.unlinkSync(filePath);
      return res.status(400).json({ success: false, message: 'Unsupported file type. Use JSON, CSV, or TXT.' });
    }

    // ── Import rows ─────────────────────────────────────────────────
    const db = getDb();
    const insertStmt = db.prepare(
      'INSERT INTO faqs (question, answer, category, created_by) VALUES (?, ?, ?, ?)'
    );

    let imported = 0, skipped = 0;
    const errors = [];

    const importAll = db.transaction(() => {
      for (let i = 0; i < rows.length; i++) {
        const { question, answer, category = 'general' } = rows[i];
        const err = validateQA(question, answer);
        if (err) {
          errors.push({ row: i + 1, reason: err });
          skipped++;
          continue;
        }
        try {
          insertStmt.run(question.trim(), answer.trim(), category, req.user.id);
          imported++;
        } catch (dbErr) {
          errors.push({ row: i + 1, reason: dbErr.message });
          skipped++;
        }
      }
    });

    importAll();
    fs.unlinkSync(filePath); // Clean up temp file

    return res.json({
      success: true,
      summary: { total: rows.length, imported, skipped, errors },
    });
  } catch (err) {
    console.error('Upload error:', err);
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    return res.status(500).json({ success: false, message: err.message || 'Internal server error.' });
  }
}

// ── Analytics ──────────────────────────────────────────────────────────────

/**
 * GET /api/admin/analytics
 * Returns basic dashboard stats.
 */
function getAnalytics(req, res) {
  try {
    const db = getDb();

    const totalFaqs = db.prepare('SELECT COUNT(*) as count FROM faqs WHERE is_active = 1').get().count;
    const totalMessages = db.prepare('SELECT COUNT(*) as count FROM chat_logs').get().count;
    const matchedMessages = db.prepare('SELECT COUNT(*) as count FROM chat_logs WHERE matched = 1').get().count;
    const unmatchedMessages = db.prepare('SELECT COUNT(*) as count FROM chat_logs WHERE matched = 0').get().count;

    // Top 5 most-asked FAQs
    const topFaqs = db.prepare(`
      SELECT f.question, COUNT(cl.id) as hits
      FROM chat_logs cl
      JOIN faqs f ON cl.faq_id = f.id
      GROUP BY f.id
      ORDER BY hits DESC
      LIMIT 5
    `).all();

    // Last 7 days message volume
    const weeklyVolume = db.prepare(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM chat_logs
      WHERE created_at >= datetime('now', '-7 days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).all();

    return res.json({
      success: true,
      stats: {
        totalFaqs,
        totalMessages,
        matchedMessages,
        unmatchedMessages,
        matchRate: totalMessages > 0 ? Math.round((matchedMessages / totalMessages) * 100) : 0,
        topFaqs,
        weeklyVolume,
      },
    });
  } catch (err) {
    console.error('Analytics error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

module.exports = { listFaqs, createFaq, updateFaq, deleteFaq, uploadFaqs, getAnalytics };
