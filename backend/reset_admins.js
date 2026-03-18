import { query } from './db.js';
import bcrypt from 'bcrypt';

async function resetAdmins() {
    try {
        console.log("Resetting admin accounts...");
        const adminPass = await bcrypt.hash('admin123', 10);
        const superPass = await bcrypt.hash('superadmin123', 10);

        await query("DELETE FROM admins WHERE username IN ('admin', 'superadmin')");
        await query("INSERT INTO admins (username, password_hash, role) VALUES ($1, $2, $3)", ['admin', adminPass, 'admin']);
        await query("INSERT INTO admins (username, password_hash, role) VALUES ($1, $2, $3)", ['superadmin', superPass, 'superadmin']);

        const res = await query("SELECT * FROM admins");
        console.log("Current Admin Users:", res.rows.map(r => ({ user: r.username, role: r.role })));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
resetAdmins();
