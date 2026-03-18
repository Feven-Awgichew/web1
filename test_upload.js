const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

async function testUpload() {
    const form = new FormData();
    form.append('title', 'Test News Title');
    form.append('description', 'This is a test news description');
    form.append('date', '2026-03-10');
    form.append('link', 'https://example.com');
    form.append('image', fs.createReadStream(path.join(__dirname, 'test_upload_image.png')));

    try {
        const response = await axios.post('http://localhost:5000/api/admin/news', form, {
            headers: form.getHeaders(),
        });
        console.log('Upload Result Status:', response.status);
        console.log('Upload Data:', response.data);
    } catch (err) {
        console.error('Upload Error:', err.response ? err.response.data : err.message);
    }
}

testUpload();
