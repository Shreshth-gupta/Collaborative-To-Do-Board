const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../database');
const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id',
      [username, email, hashedPassword]
    );
    
    const token = jwt.sign({ id: result.rows[0].id, username }, process.env.JWT_SECRET);
    res.json({ token, user: { id: result.rows[0].id, username, email } });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === '23505') {
      res.status(400).json({ error: 'Username or email already exists' });
    } else {
      res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const users = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (!users.rows.length || !await bcrypt.compare(password, users.rows[0].password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = users.rows[0];
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET);
    res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;