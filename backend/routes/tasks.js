const express = require('express');
const { pool } = require('../database');
const auth = require('../middleware/auth');
const router = express.Router();

// helper to log what users do
const logActivity = async (userId, action, taskId, details) => {
  await pool.query(
    'INSERT INTO activity_logs (user_id, action, task_id, details) VALUES ($1, $2, $3, $4)',
    [userId, action, taskId, JSON.stringify(details)]
  );
};

router.get('/', auth, async (req, res) => {
  try {
    const tasks = await pool.query(`
      SELECT t.*, u.username as assigned_username, c.username as created_by_username
      FROM tasks t
      LEFT JOIN users u ON t.assigned_user_id = u.id
      LEFT JOIN users c ON t.created_by = c.id
      ORDER BY t.created_at DESC
    `);
    res.json(tasks.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, description, priority, assigned_user_id } = req.body;
    
    // check if title already exists
    const existingTask = await pool.query('SELECT id FROM tasks WHERE title = $1', [title]);
    if (existingTask.rows.length) {
      return res.status(400).json({ error: 'Task title must be unique' });
    }
    
    // can't use column names as titles (learned this the hard way)
    if (['Todo', 'In Progress', 'Done'].includes(title)) {
      return res.status(400).json({ error: 'Task title cannot match column names' });
    }
    
    const result = await pool.query(
      'INSERT INTO tasks (title, description, priority, assigned_user_id, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [title, description, priority, assigned_user_id, req.user.id]
    );
    
    await logActivity(req.user.id, 'create', result.rows[0].id, { title, description });
    
    const newTask = await pool.query(`
      SELECT t.*, u.username as assigned_username, c.username as created_by_username
      FROM tasks t
      LEFT JOIN users u ON t.assigned_user_id = u.id
      LEFT JOIN users c ON t.created_by = c.id
      WHERE t.id = $1
    `, [result.rows[0].id]);
    
    res.json(newTask.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, status, priority, assigned_user_id, version } = req.body;
    const taskId = req.params.id;
    
    // grab current task first
    const current = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    if (!current.rows.length) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const currentTask = current.rows[0];
    
    // version check to prevent conflicts
    if (currentTask.version !== version) {
      return res.status(409).json({ 
        error: 'Conflict detected', 
        currentVersion: currentTask.version,
        currentTask: currentTask
      });
    }
    
    // Validate unique title if title is being changed
    if (title !== currentTask.title) {
      const existing = await pool.query('SELECT id FROM tasks WHERE title = $1 AND id != $2', [title, taskId]);
      if (existing.rows.length) {
        return res.status(400).json({ error: 'Task title must be unique' });
      }
      
      // Validate title not matching column names
      if (['Todo', 'In Progress', 'Done'].includes(title)) {
        return res.status(400).json({ error: 'Task title cannot match column names' });
      }
    }
    
    await pool.query(
      'UPDATE tasks SET title = $1, description = $2, status = $3, priority = $4, assigned_user_id = $5, version = version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $6',
      [title, description, status, priority, assigned_user_id, taskId]
    );
    // figure out what kind of change this is
    let actionType = 'update';
    const details = { title, status };
    
    if (currentTask.status !== status) {
      actionType = 'drag_drop';
      details.from_status = currentTask.status;
      details.to_status = status;
    } else if (currentTask.assigned_user_id !== assigned_user_id) {
      actionType = assigned_user_id ? 'assign' : 'unassign';
      details.assigned_user_id = assigned_user_id;
    }
    
    await logActivity(req.user.id, actionType, taskId, details);
    
    const updated = await pool.query(`
      SELECT t.*, u.username as assigned_username, c.username as created_by_username
      FROM tasks t
      LEFT JOIN users u ON t.assigned_user_id = u.id
      LEFT JOIN users c ON t.created_by = c.id
      WHERE t.id = $1
    `, [taskId]);
    
    res.json(updated.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const taskId = req.params.id;
    
    // Get task details before deletion for logging
    const task = await pool.query('SELECT title FROM tasks WHERE id = $1', [taskId]);
    if (!task.rows.length) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Log deletion before deleting (to avoid foreign key issues)
    await logActivity(req.user.id, 'delete', taskId, { title: task.rows[0].title });
    
    // Delete related activity logs first to avoid foreign key constraint
    await pool.query('DELETE FROM activity_logs WHERE task_id = $1', [taskId]);
    
    // Then delete the task
    await pool.query('DELETE FROM tasks WHERE id = $1', [taskId]);
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Validation endpoint for unique titles
router.post('/validate-title', auth, async (req, res) => {
  try {
    const { title, excludeId } = req.body;
    
    // Check if title matches column names
    if (['Todo', 'In Progress', 'Done'].includes(title)) {
      return res.json({ valid: false, error: 'Task title cannot match column names' });
    }
    
    // Check for unique title
    let query = 'SELECT id FROM tasks WHERE title = $1';
    let params = [title];
    
    if (excludeId) {
      query += ' AND id != $2';
      params.push(excludeId);
    }
    
    const existing = await pool.query(query, params);
    
    if (existing.rows.length) {
      return res.json({ valid: false, error: 'Task title must be unique' });
    }
    
    res.json({ valid: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/smart-assign/:id', auth, async (req, res) => {
  try {
    const taskId = req.params.id;
    
    // Find user with fewest active tasks
    const users = await pool.query(`
      SELECT u.id, u.username, COUNT(t.id) as task_count
      FROM users u
      LEFT JOIN tasks t ON u.id = t.assigned_user_id AND t.status != 'Done'
      GROUP BY u.id, u.username
      ORDER BY task_count ASC
      LIMIT 1
    `);
    
    if (!users.rows.length) {
      return res.status(400).json({ error: 'No users available' });
    }
    
    await pool.query(
      'UPDATE tasks SET assigned_user_id = $1, version = version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [users.rows[0].id, taskId]
    );
    
    await logActivity(req.user.id, 'smart_assign', taskId, { assigned_to: users.rows[0].username });
    
    const updated = await pool.query(`
      SELECT t.*, u.username as assigned_username, c.username as created_by_username
      FROM tasks t
      LEFT JOIN users u ON t.assigned_user_id = u.id
      LEFT JOIN users c ON t.created_by = c.id
      WHERE t.id = $1
    `, [taskId]);
    
    res.json(updated.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;