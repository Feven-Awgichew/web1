const { initDb, query } = require('./backend/db.js');
(async () => {
    try {
        await initDb();
        const res = await query("SELECT COUNT(*) FROM applicants WHERE role = 'Sponsor' AND status = 'approved'");
        console.log('Approved sponsors count:', res.rows[0].count);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
