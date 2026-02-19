/**
 * routes/admin.js
 * ───────────────
 * Protected admin-only endpoints.
 * All routes require: Bearer token with role=admin
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authenticate, requireAdmin } = require('../middleware/auth');
const {
  listFaqs, createFaq, updateFaq, deleteFaq, uploadFaqs, getAnalytics
} = require('../controllers/adminController');

// Multer config — temp storage for uploaded files
const upload = multer({
  dest: path.join(__dirname, '../../uploads/'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter(req, file, cb) {
    const allowed = ['.json', '.csv', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only JSON, CSV, and TXT files are allowed.'));
  },
});

// Apply auth + admin check to all routes in this router
router.use(authenticate, requireAdmin);

// Analytics
router.get('/analytics', getAnalytics);

// FAQ CRUD
router.get('/faqs', listFaqs);
router.post('/faqs', createFaq);
router.put('/faqs/:id', updateFaq);
router.delete('/faqs/:id', deleteFaq);

// Bulk upload
router.post('/faqs/upload', upload.single('file'), uploadFaqs);

module.exports = router;
