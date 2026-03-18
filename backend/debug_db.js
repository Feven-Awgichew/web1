import { query } from './db.js';
import bcrypt from 'bcrypt';

async function test() {
    try {
        const res = await query("SELECT * FROM admins");
        console.log("Admins in DB:");
        for (const row of res.rows) {
            console.log(`User: ${row.username}, Role: ${row.role}`);
            const passMatch = await bcrypt.compare('admin123', row.password_hash);
            const superPassMatch = await bcrypt.compare('superadmin123', row.password_hash);
            console.log(`- Password 'admin123' match: ${passMatch}`);
            console.log(`- Password 'superadmin123' match: ${superPassMatch}`);
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
test();
