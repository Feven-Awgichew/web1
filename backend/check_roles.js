
import { query } from './db.js';

const checkRoles = async () => {
    try {
        const res = await query('SELECT role, COUNT(*) as count FROM applicants GROUP BY role');
        console.log('Role Distribution:', JSON.stringify(res.rows, null, 2));
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

checkRoles();
