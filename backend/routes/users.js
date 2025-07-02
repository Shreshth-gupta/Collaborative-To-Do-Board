const express = require('express');
const { pool } = require('../database');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const users = await pool.query('SELECT id, username, email FROM users');
    res.json(users.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { username, email } = req.body;
    
    // Check if user already exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
    if (existing.rows.length) {
      return res.status(400).json({ error: 'User with this email or username already exists' });
    }
    
    // Create user with default password (they can change it later)
    const defaultPassword = 'password123';
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    const result = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, hashedPassword]
    );
    
    res.json({ 
      user: result.rows[0],
      message: 'User created successfully. Default password: password123'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;