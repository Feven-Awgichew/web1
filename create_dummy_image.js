const fs = require('fs');

// Create a small 1x1 transparent PNG for testing uploads
const dummyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
fs.writeFileSync('test_upload_image.png', dummyPng);
console.log('Created test_upload_image.png');
