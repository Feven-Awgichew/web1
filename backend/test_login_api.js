import https from 'https';

const data = JSON.stringify({
    username: 'admin',
    password: 'admin123'
});

const options = {
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/admin/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    },
    rejectUnauthorized: false
};

const req = https.request(options, res => {
    console.log(`Status: ${res.statusCode}`);
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
        console.log('Body:', body);
    });
});

req.on('error', e => {
    console.error('Request Error:', e);
});

req.write(data);
req.end();
