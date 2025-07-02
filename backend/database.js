const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 5432,
  max: 10
});

const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_seen_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add last_seen_activity column if it doesn't exist
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS last_seen_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);

    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE task_status AS ENUM ('Todo', 'In Progress', 'Done');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE task_priority AS ENUM ('Low', 'Medium', 'High');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status task_status DEFAULT 'Todo',
        priority task_priority DEFAULT 'Medium',
        assigned_user_id INT REFERENCES users(id),
        created_by INT REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        version INT DEFAULT 1
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id),
        action VARCHAR(50) NOT NULL,
        task_id INT REFERENCES tasks(id),
        details JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    console.log('Make sure PostgreSQL is running and credentials in .env are correct');
  }
};

module.exports = { pool, initDB };