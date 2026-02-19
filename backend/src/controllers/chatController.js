/**
 * controllers/chatController.js
 * ──────────────────────────────
 * Core chatbot matching engine.
 *
 * Phase 1: Rule-based exact + fuzzy matching against the faqs table.
 * Phase 2: Replace matchAnswer() with an NLP/AI service call while
 *          keeping the same API contract and logging infrastructure.
 *
 * Matching strategy (in order of priority):
 *   1. Exact match (case-insensitive, trimmed)
 *   2. FAQ ID match (when user clicks a FAQ button — sent as faq_id)
 *   3. Substring match — question contains the user's input
 *   4. Input contains the question keywords
 */

const { getDb } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// ── Default / fallback messages ───────────────────────────────────────────────

const NO_MATCH_MESSAGE =
  'متأسفم، پاسخی برای این سوال پیدا نکردم. لطفاً از سوال‌های پرتکرار استفاده کنید یا با پشتیبانی تماس بگیرید.';

const WELCOME_MESSAGE =
  'سلام 👋 خوش آمدید. چطور می‌توانم کمکتان کنم؟';

/**
 * POST /api/chat/message
 * Body: { message: string, session_id?: string, faq_id?: number, source?: 'text'|'faq_button' }
 *
 * Returns the matched answer (or fallback) and logs the exchange.
 */
function sendMessage(req, res) {
  try {
    const { message, faq_id, source = 'text' } = req.body;
    const session_id = req.body.session_id || uuidv4();
    const user_id = req.user?.id || null;

    if (!message && !faq_id) {
      return res.status(400).json({ success: false, message: 'Message or faq_id is required.' });
    }

    const db = getDb();
    let matched = false;
    let response = NO_MATCH_MESSAGE;
    let matched_faq_id = null;

    // ── Strategy 1: Direct FAQ ID (button click) ──────────────────────
    if (faq_id) {
      const faq = db
        .prepare('SELECT * FROM faqs WHERE id = ? AND is_active = 1')
        .get(faq_id);

      if (faq) {
        response = faq.answer;
        matched_faq_id = faq.id;
        matched = true;
      }
    }

    // ── Strategy 2: Text-based matching ───────────────────────────────
    if (!matched && message) {
      const activeFaqs = db
        .prepare('SELECT * FROM faqs WHERE is_active = 1 ORDER BY sort_order ASC')
        .all();

      const userInput = message.trim().toLowerCase();

      // Pass 1 — exact match
      const exactMatch = activeFaqs.find(
        (f) => f.question.trim().toLowerCase() === userInput
      );
      if (exactMatch) {
        response = exactMatch.answer;
        matched_faq_id = exactMatch.id;
        matched = true;
      }

      // Pass 2 — FAQ question contains user input (substring)
      if (!matched) {
        const subMatch = activeFaqs.find((f) =>
          f.question.trim().toLowerCase().includes(userInput)
        );
        if (subMatch) {
          response = subMatch.answer;
          matched_faq_id = subMatch.id;
          matched = true;
        }
      }

      // Pass 3 — User input contains FAQ question keywords
      if (!matched) {
        const reverseMatch = activeFaqs.find((f) =>
          userInput.includes(f.question.trim().toLowerCase())
        );
        if (reverseMatch) {
          response = reverseMatch.answer;
          matched_faq_id = reverseMatch.id;
          matched = true;
        }
      }

      // Pass 4 — Word-level overlap scoring (simple tokenisation)
      if (!matched) {
        const userTokens = userInput.split(/\s+/).filter((t) => t.length > 2);
        let bestScore = 0;
        let bestFaq = null;

        for (const faq of activeFaqs) {
          const faqTokens = faq.question.trim().toLowerCase().split(/\s+/);
          const overlap = userTokens.filter((t) => faqTokens.includes(t)).length;
          const score = overlap / Math.max(faqTokens.length, userTokens.length);
          if (score > bestScore) {
            bestScore = score;
            bestFaq = faq;
          }
        }

        // Accept only if ≥ 40% token overlap
        if (bestScore >= 0.4 && bestFaq) {
          response = bestFaq.answer;
          matched_faq_id = bestFaq.id;
          matched = true;
        }
      }
    }

    // ── Log the exchange ──────────────────────────────────────────────
    db.prepare(`
      INSERT INTO chat_logs (session_id, user_id, message, response, faq_id, matched, source)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(session_id, user_id, message || `[FAQ #${faq_id}]`, response, matched_faq_id, matched ? 1 : 0, source);

    return res.json({
      success: true,
      session_id,
      response,
      matched,
      faq_id: matched_faq_id,
    });
  } catch (err) {
    console.error('Chat error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

/**
 * GET /api/chat/faqs
 * Returns all active FAQs for the FAQ modal.
 */
function getFaqs(req, res) {
  try {
    const db = getDb();
    const faqs = db
      .prepare('SELECT id, question, category FROM faqs WHERE is_active = 1 ORDER BY sort_order ASC, id ASC')
      .all();

    return res.json({ success: true, faqs });
  } catch (err) {
    console.error('Get FAQs error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

/**
 * GET /api/chat/welcome
 * Returns the welcome message (allows future i18n without frontend changes).
 */
function getWelcome(req, res) {
  return res.json({ success: true, message: WELCOME_MESSAGE });
}

module.exports = { sendMessage, getFaqs, getWelcome };
