// src/controllers/aiController.js
// Two AI features: Notice Summarizer + AI Study Buddy (flashcards)
// Both call Groq's API which is OpenAI-compatible and very fast.

require('dotenv').config();
const axios = require('axios');

// Helper: makes one call to Groq
const callGroq = async (systemPrompt, userMessage) => {
  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: "llama-3.1-8b-instant", // free and fast — don't change this
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );
  // Groq returns the text here:
  return response.data.choices[0].message.content;
};

// ─── POST /api/ai/summarize ───────────────────────────────────────────────────
// Body: { notice: "Full text of college notice..." }
// Returns: { summary: "• Point 1\n• Point 2\n• Point 3" }
const summarizeNotice = async (req, res) => {
  try {
    const { notice } = req.body;

    if (!notice) {
      return res.status(400).json({ error: 'notice text is required' });
    }

    const systemPrompt = `You are a helpful assistant for college students. 
When given a college notice or announcement, summarize it into exactly 3 bullet points.
Each bullet point should be one short, clear sentence.
Format: 
• Point 1
• Point 2  
• Point 3
Do not add any extra text before or after the bullet points.`;

    const summary = await callGroq(systemPrompt, notice);

    // Trigger n8n Workflow 2 — broadcasts summary via WhatsApp + Calendar
    try {
      await axios.post(process.env.N8N_SUMMARIZE_WEBHOOK_URL, {
        summary: summary,
        userEmail: req.user.email,
      });
    } catch (err) {
      console.warn('n8n summarize webhook failed:', err.message);
    }

    return res.status(200).json({ summary });
  } catch (err) {
    console.error('Summarize error:', err.message);
    return res.status(500).json({ error: 'AI summarization failed' });
  }
};

// ─── POST /api/ai/flashcards ──────────────────────────────────────────────────
// Body: { notes: "Lecture notes text..." }
// Returns: { flashcards: [{ question: "...", answer: "..." }, ...] }
const generateFlashcards = async (req, res) => {
  try {
    const { notes } = req.body;

    if (!notes) {
      return res.status(400).json({ error: 'notes text is required' });
    }

    const systemPrompt = `You are a study assistant. Given lecture notes, generate exactly 5 flashcards.
Return ONLY a valid JSON array. No markdown, no explanation, just the JSON.
Format:
[
  { "question": "What is X?", "answer": "X is..." },
  { "question": "...", "answer": "..." }
]`;

    const raw = await callGroq(systemPrompt, notes);

    // Parse the JSON response from Groq
    let flashcards;
    try {
      // Sometimes Groq wraps in ```json ... ``` — strip it
      const cleaned = raw.replace(/```json|```/g, '').trim();
      flashcards = JSON.parse(cleaned);
    } catch {
      // If JSON parse fails, return raw text so frontend can still show something
      return res.status(200).json({ flashcards: [], raw });
    }

    return res.status(200).json({ flashcards });
  } catch (err) {
    console.error('Flashcards error:', err.message);
    return res.status(500).json({ error: 'AI flashcard generation failed' });
  }
};

module.exports = { summarizeNotice, generateFlashcards };