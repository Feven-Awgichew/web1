import pkg from 'pg';
const { Pool } = pkg;

const conns = [
  'postgres://postgres:postgres@localhost:5432/asmis_db',
  'postgres://postgres@localhost:5432/asmis_db',
  'postgres://postgres:1234@localhost:5432/asmis_db',
  'postgres://postgres:123456@localhost:5432/asmis_db',
  'postgres://postgres:root@localhost:5432/asmis_db',
  'postgres://postgres:password@localhost:5432/asmis_db'
];

async function test() {
  for (const conn of conns) {
    console.log(`Testing: ${conn}`);
    const pool = new Pool({ connectionString: conn });
    try {
      const res = await pool.query('SELECT NOW()');
      console.log('Success!', res.rows[0]);
      process.exit(0);
    } catch (err) {
      console.log('Failed:', err.message);
    } finally {
      await pool.end();
    }
  }
}
test();
