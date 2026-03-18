import { query, initDb } from './db.js';

const realData = async () => {
    try {
        await initDb();
        console.log('Seeding additional speakers for carousel testing...');

        const extraSpeakers = [
            { 
                full_name: 'Sarah Mensah', 
                email: 'sarah.m@example.com', 
                role: 'Speaker', 
                country: 'Ghana', 
                organization: 'AfroConnect',
                status: 'approved'
            },
            { 
                full_name: 'David Okafor', 
                email: 'david.o@example.com', 
                role: 'Speaker', 
                country: 'Nigeria', 
                organization: 'Lagos Tech Hub',
                status: 'approved'
            },
            { 
                full_name: 'Fatima Zahra', 
                email: 'fatima.z@example.com', 
                role: 'Speaker', 
                country: 'Morocco', 
                organization: 'Atlas Media',
                status: 'approved'
            },
            { 
                full_name: 'Kofi Annan Jr.', 
                email: 'kofi.jr@example.com', 
                role: 'Speaker', 
                country: 'Ghana', 
                organization: 'Peace Foundations',
                status: 'approved'
            }
        ];

        for (const s of extraSpeakers) {
            await query(
                'INSERT INTO applicants (full_name, email, role, country, organization, status) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (email) DO UPDATE SET status = $6',
                [s.full_name, s.email, s.role, s.country, s.organization, s.status]
            );
            console.log(`Ensured extra speaker: ${s.full_name}`);
        }

        console.log('Seeding complete.');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding data:', err);
        process.exit(1);
    }
};

realData();
