import { query, initDb } from './db.js';

const realData = async () => {
    try {
        await initDb();
        console.log('Seeding real data for demo...');

        const speakers = [
            { 
                full_name: 'Dr. Jane Smith', 
                email: 'jane.smith@example.com', 
                role: 'Speaker', 
                country: 'Kenya', 
                organization: 'Tech For Africa',
                status: 'approved'
            },
            { 
                full_name: 'Hassan Mahmoud', 
                email: 'hassan.m@example.com', 
                role: 'Speaker', 
                country: 'Egypt', 
                organization: 'Digital Oasis',
                status: 'approved'
            },
            { 
                full_name: 'Tsion Gebre', 
                email: 'tsion.g@example.com', 
                role: 'Speaker', 
                country: 'Ethiopia', 
                organization: 'Innovate Addis',
                status: 'approved'
            }
        ];

        for (const s of speakers) {
            await query(
                'INSERT INTO applicants (full_name, email, role, country, organization, status) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (email) DO UPDATE SET status = $6',
                [s.full_name, s.email, s.role, s.country, s.organization, s.status]
            );
            console.log(`Ensured speaker: ${s.full_name}`);
        }

        // Add some random applicants for stats
        const dummyApplicants = [
            { role: 'Influencer', country: 'Nigeria', status: 'approved' },
            { role: 'Influencer', country: 'South Africa', status: 'approved' },
            { role: 'Influencer', country: 'Ghana', status: 'approved' },
            { role: 'Media', country: 'Senegal', status: 'approved' },
            { role: 'Media', country: 'Uganda', status: 'approved' },
            { role: 'Partner', country: 'Rwanda', status: 'approved' }
        ];

        for (let i = 0; i < dummyApplicants.length; i++) {
            const a = dummyApplicants[i];
            await query(
                'INSERT INTO applicants (full_name, email, role, country, status) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO NOTHING',
                [`User ${i}`, `user${i}@demo.com`, a.role, a.country, a.status]
            );
        }

        console.log('Real data seeding complete.');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding real data:', err);
        process.exit(1);
    }
};

realData();
