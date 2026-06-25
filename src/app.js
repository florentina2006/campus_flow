// src/app.js
// This file sets up Express middleware and mounts all routes.
// It does NOT start the server — that's server.js's job.
// Keeping them separate makes testing easier.

const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Load .env variables at the very top

const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────

// CORS: allow the frontend (running on a different port/domain) to call this server
// During dev this is wide open. In production, restrict origins.
app.use(cors());

// Parse incoming JSON bodies — without this req.body is undefined
app.use(express.json());

// ── Health check route ────────────────────────────────────────────────────────
// Hit GET /health to confirm the server is running — useful for debugging
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ── Mount routes ──────────────────────────────────────────────────────────────
// All auth routes are prefixed with /api/auth
// All task routes are prefixed with /api/tasks
// All AI routes are prefixed with /api/ai
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/ai', aiRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
// If no route matched, return 404
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ── Global error handler ──────────────────────────────────────────────────────
// Catches any errors thrown with next(err) from controllers
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ error: 'Something went wrong on the server' });
});

module.exports = app;
