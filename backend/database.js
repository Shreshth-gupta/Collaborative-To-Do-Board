const { Pool } = require('pg');
require('dotenv').config();

// db setup for neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1, // keep it simple
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 5000,
  allowExitOnIdle: true
});

const initDB = async () => {
  try {
    console.log('connecting to db...');
    console.log('env:', process.env.NODE_ENV);
    
    // test if db works
    const client = await pool.connect();
    console.log('db connected!');
    client.release();
    
    // Create tables with PostgreSQL syntax
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
    console.error('Full error:', error);
    
    // app can run without db but will be broken
    console.log('starting without db - expect errors');
  }
};

module.exports = { pool, initDB };