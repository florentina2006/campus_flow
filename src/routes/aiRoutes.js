// src/routes/aiRoutes.js

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { summarizeNotice, generateFlashcards } = require('../controllers/aiController');

// Protect AI routes too — only logged-in users can use them
router.use(authMiddleware);

// POST /api/ai/summarize    → Notice Summarizer
// POST /api/ai/flashcards   → AI Study Buddy
router.post('/summarize', summarizeNotice);
router.post('/flashcards', generateFlashcards);

module.exports = router;
