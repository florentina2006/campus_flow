// src/routes/authRoutes.js
// Routes just map HTTP method + URL path → controller function.
// No logic lives here.

const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

module.exports = router;
