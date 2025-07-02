const express = require('express');
const { pool } = require('../database');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const logs = await pool.query(`
      SELECT a.*, u.username, t.title as task_title
      FROM activity_logs a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN tasks t ON a.task_id = t.id
      ORDER BY a.created_at DESC
      LIMIT 20
    `);
    res.json(logs.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/unseen-count', auth, async (req, res) => {
  try {
    const user = await pool.query('SELECT last_seen_activity FROM users WHERE id = $1', [req.user.id]);
    const lastSeen = user.rows[0]?.last_seen_activity || new Date(0);
    
    const unseenCount = await pool.query(`
      SELECT COUNT(*) as count
      FROM activity_logs a
      WHERE a.created_at > $1 AND a.user_id != $2
    `, [lastSeen, req.user.id]);
    
    res.json({ count: parseInt(unseenCount.rows[0].count) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/mark-seen', auth, async (req, res) => {
  try {
    await pool.query(
      'UPDATE users SET last_seen_activity = CURRENT_TIMESTAMP WHERE id = $1',
      [req.user.id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;