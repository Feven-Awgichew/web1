import { initDb, query } from './db.js';

const seedTestSponsor = async () => {
    try {
        await initDb();
        await query(
            "INSERT INTO applicants (role, full_name, email, country, organization, status, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7)",
            ['Sponsor', 'Acme Corporation', 'contact@acme.com', 'Ethiopia', 'Acme Global Inc.', 'approved', JSON.stringify({})]
        );
        console.log('Successfully seeded approved sponsor: Acme Global Inc.');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

seedTestSponsor();
