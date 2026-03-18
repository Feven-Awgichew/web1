import pkg from 'pg';
const { Pool } = pkg;

const testConnection = async () => {
  const pool = new Pool({
    connectionString: 'postgres://postgres:postgres@localhost:5432/postgres',
  });
  try {
    await pool.query('SELECT 1');
    console.log('Connection successful on port 5432!');
  } catch (err) {
    console.error('Connection failed on port 5432:', err.message);
  } finally {
    await pool.end();
  }
};

testConnection();
