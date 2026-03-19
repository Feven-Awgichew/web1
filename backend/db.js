import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost') ? false : {
    rejectUnauthorized: false
  }
});

export const query = (text, params) => pool.query(text, params);

export const initDb = async () => {
  const createTablesQuery = `
    CREATE TABLE IF NOT EXISTS applicants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      role VARCHAR(50) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      country VARCHAR(100) NOT NULL,
      organization VARCHAR(255),
      social_handle VARCHAR(255),
      phone VARCHAR(20),
      metadata JSONB,
      status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
      remark TEXT,
      qr_code TEXT,
      confirmation_code VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      admin_id VARCHAR(50) NOT NULL,
      action TEXT NOT NULL,
      target_id TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS news (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      date DATE,
      image_url TEXT,
      link TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS gallery (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      type VARCHAR(50), -- image, video
      media_url TEXT NOT NULL,
      event_name VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(255),
      email VARCHAR(255),
      role VARCHAR(50) DEFAULT 'admin', -- admin, superadmin
      last_password_change TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS password_history (
      id SERIAL PRIMARY KEY,
      admin_id INTEGER REFERENCES admins(id) ON DELETE CASCADE,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sponsors (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      logo_url TEXT NOT NULL,
      website_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Ensure metadata and confirmation_code columns exist for existing tables
    DO $$ 
    BEGIN 
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applicants' AND column_name='metadata') THEN
        ALTER TABLE applicants ADD COLUMN metadata JSONB;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applicants' AND column_name='confirmation_code') THEN
        ALTER TABLE applicants ADD COLUMN confirmation_code VARCHAR(50);
      END IF;
      
      -- Migrate audit_logs target_id to TEXT if it's still UUID
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='target_id' AND data_type='uuid') THEN
        ALTER TABLE audit_logs ALTER COLUMN target_id TYPE TEXT;
      END IF;

      -- Add full_name and email to admins
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admins' AND column_name='full_name') THEN
        ALTER TABLE admins ADD COLUMN full_name VARCHAR(255);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admins' AND column_name='email') THEN
        ALTER TABLE admins ADD COLUMN email VARCHAR(255);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admins' AND column_name='last_password_change') THEN
        ALTER TABLE admins ADD COLUMN last_password_change TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      END IF;
    END $$;

  `;


  try {
    await pool.query(createTablesQuery);
    console.log('Database tables initialized');

    // Verify critical columns exist
    const colCheck = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name='applicants' AND column_name='confirmation_code'"
    );
    if (colCheck.rows.length > 0) {
      console.log('✅ confirmation_code column exists');
    } else {
      console.warn('⚠️ confirmation_code column MISSING - attempting manual add...');
      await pool.query('ALTER TABLE applicants ADD COLUMN IF NOT EXISTS confirmation_code VARCHAR(50)');
      console.log('✅ confirmation_code column added manually');
    }
  } catch (err) {
    console.error('Error initializing database:', err);
  }
};
