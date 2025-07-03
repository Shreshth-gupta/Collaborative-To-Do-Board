const { Pool } = require('pg');
require('dotenv').config();

// Parse DATABASE_URL for direct connection
const parseConnectionString = (url) => {
  if (!url) return {};
  const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) return {};
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: parseInt(match[4]),
    database: match[5]
  };
};

const dbConfig = process.env.DATABASE_URL 
  ? parseConnectionString(process.env.DATABASE_URL)
  : {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'postgres',
      port: parseInt(process.env.DB_PORT) || 5432
    };

const pool = new Pool({
  ...dbConfig,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  max: 3,
  connectionTimeoutMillis: 15000,
  idleTimeoutMillis: 15000
});

const initDB = async () => {
  try {
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    
    // Test connection first
    const client = await pool.connect();
    console.log('Database connection successful');
    client.release();
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
    console.error('Database initialization error:', error.message);
    console.log('DATABASE_URL format check:', process.env.DATABASE_URL?.substring(0, 20) + '...');
    
    // Continue without database for now - app will still start
    console.log('App starting without database initialization - will retry on first request');
  }
};

module.exports = { pool, initDB };