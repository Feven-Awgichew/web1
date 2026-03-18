import { query } from './backend/db.js';

const sponsors = [
    { name: 'African Union', logo_url: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/51/Flag_of_the_African_Union.svg/1200px-Flag_of_the_African_Union.svg.png' },
    { name: 'Google', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/1200px-Google_2015_logo.svg.png' },
    { name: 'Meta', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Meta_Platforms_Inc._logo.svg/1200px-Meta_Platforms_Inc._logo.svg.png' },
    { name: 'UNECA', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Logo_of_the_United_Nations_Economic_Commission_for_Africa.svg/1200px-Logo_of_the_United_Nations_Economic_Commission_for_Africa.svg.png' },
    { name: 'UNICEF', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/UNICEF_logo.svg/1200px-UNICEF_logo.svg.png' },
    { name: 'Ethio Telecom', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Ethio_telecom_logo.png/1200px-Ethio_telecom_logo.png' },
    { name: 'Microsoft', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Microsoft_logo_%282012%29.svg/1200px-Microsoft_logo_%282012%29.svg.png' },
    { name: 'MasterCard Foundation', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png' }
];

async function seed() {
    console.log('Seeding sponsors...');
    for (const sponsor of sponsors) {
        try {
            await query(
                'INSERT INTO sponsors (name, logo_url) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [sponsor.name, sponsor.logo_url]
            );
            console.log(`Added sponsor: ${sponsor.name}`);
        } catch (err) {
            console.error(`Failed to add ${sponsor.name}: ${err.message}`);
        }
    }
    console.log('Seeding complete.');
    process.exit(0);
}

seed();
