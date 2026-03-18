import pkg from 'pg';
const { Pool } = pkg;

const testConnection = async () => {
  const pool = new Pool({
    connectionString: 'postgres://postgres:@localhost:5432/postgres',
  });
  try {
    const res = await pool.query('SELECT current_database()');
    console.log('Connection successful on port 5432! Database:', res.rows[0].current_database);
  } catch (err) {
    console.error('Connection failed on port 5432:', err.message);
  } finally {
    await pool.end();
  }
};

testConnection();
