const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../database');
const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id',
      [username, email, hashedPassword]
    );
    
    const token = jwt.sign({ id: result.rows[0].id, username }, process.env.JWT_SECRET);
    res.json({ token, user: { id: result.rows[0].id, username, email } });
  } catch (error) {
    res.status(400).json({ error: error.message });
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