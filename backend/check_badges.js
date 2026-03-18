
import { query } from './db.js';

const checkBadgeData = async () => {
    try {
        const res = await query('SELECT full_name, role, status, qr_code, confirmation_code FROM applicants LIMIT 5');
        console.log('Sample Applicant Data:', JSON.stringify(res.rows.map(r => ({
            ...r,
            qr_code: r.qr_code ? (r.qr_code.substring(0, 30) + '...') : 'MISSING'
        })), null, 2));

        // Check if any confirmation_code contains non-numeric characters
        const nonNumeric = res.rows.filter(r => !/^\d+$/.test(r.confirmation_code));
        if (nonNumeric.length > 0) {
            console.log('WARNING: Found non-numeric confirmation codes:', nonNumeric.map(r => r.confirmation_code));
        } else {
            console.log('SUCCESS: All checked confirmation codes are numeric.');
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

checkBadgeData();
