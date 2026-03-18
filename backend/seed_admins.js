import bcrypt from 'bcrypt';
import { query, initDb } from './db.js';

const seedAdmins = async () => {
    try {
        await initDb();
        console.log('Seeding admin accounts...');

        const adminPassword = await bcrypt.hash('admin123', 10);
        const superadminPassword = await bcrypt.hash('superadmin123', 10);

        const checkAdmin
         = await query("SELECT * FROM admins WHERE username = $1", ['admin']);
        if (checkAdmin.rows.length === 0) {
            await query("INSERT INTO admins (username, password_hash, role) VALUES ($1, $2, $3)", ['admin', adminPassword, 'admin']);
            console.log('Created default admin user (username: admin, password: admin123)');
        }

        const checkSuperadmin = await query("SELECT * FROM admins WHERE username = $1", ['superadmin']);
        if (checkSuperadmin.rows.length === 0) {
            await query("INSERT INTO admins (username, password_hash, role) VALUES ($1, $2, $3)", ['superadmin', superadminPassword, 'superadmin']);
            console.log('Created default superadmin user (username: superadmin, password: superadmin123)');
        }

        console.log('Admins seeded successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding admins:', err);
        process.exit(1);
    }
};

seedAdmins();
