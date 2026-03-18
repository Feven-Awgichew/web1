import { initDb, query } from './db.js';

(async () => {
    try {
        await initDb();
        const res = await query("SELECT id, full_name, organization, status, metadata FROM applicants WHERE role = 'Sponsor'");
        console.log('--- DB SPONSORS ---');
        console.log(JSON.stringify(res.rows, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
