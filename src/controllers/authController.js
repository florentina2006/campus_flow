// src/controllers/authController.js
// Controllers hold the actual LOGIC for each endpoint.
// Routes just map URL → controller function.

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

// ─── POST /api/auth/register ─────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email and password are required' });
    }

    // 2. Check if email already exists in our "users" table
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // 3. Hash the password — NEVER store plain text passwords
    //    bcrypt salt rounds = 10 means it runs the hashing algorithm 2^10 = 1024 times
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Insert new user into Supabase
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({ name, email, password: hashedPassword })
      .select('id, name, email') // only return safe fields, NOT password
      .single();

    if (error) throw error;

    // 5. Create JWT token — expires in 7 days
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'Registration successful',
      user: newUser,
      token,
    });
  } catch (err) {
    console.error('Register error:', err.message);
    return res.status(500).json({ error: 'Server error during registration' });
  }
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    // 1. Find user by email — include password this time to compare
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, password')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // 2. Compare the submitted password with the stored hash
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // 3. Create JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 4. Send back token + user info (minus password)
    return res.status(200).json({
      message: 'Login successful',
      user: { id: user.id, name: user.name, email: user.email },
      token,
    });
  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ error: 'Server error during login' });
  }
};

module.exports = { register, login };
