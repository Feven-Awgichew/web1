import pkg from 'pg';
const { Pool } = pkg;

const testConnection = async () => {
  const pool = new Pool({
    connectionString: 'postgresql://event_db_0oma_user:p2I1fs3LU8KEcb9N4hTv4nicvY9YS0Qx@dpg-d6t5j90gjchc73c7ih30-a/event_db_0oma',
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
