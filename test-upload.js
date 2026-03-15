const fs = require('fs');
const path = require('path');

async function testUpload() {
    try {
        console.log('Logging in...');
        const loginRes = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@company.com', password: 'password123' })
        });

        if (!loginRes.ok) throw new Error('Login failed: ' + await loginRes.text());

        const cookies = loginRes.headers.get('set-cookie');
        console.log('Login successful.');

        console.log('Uploading History.xlsx...');
        const formData = new FormData();
        const filePath = path.join(__dirname, 'History.xlsx');
        const fileBuffer = fs.readFileSync(filePath);

        // In Node 18+ fetch API, we can use Blob for file uploads in FormData
        const blob = new Blob([fileBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        formData.append('file', blob, 'History.xlsx');

        const uploadRes = await fetch('http://localhost:3000/api/import/excel', {
            method: 'POST',
            headers: {
                'Cookie': cookies
            },
            body: formData
        });

        const result = await uploadRes.json();
        console.log('Upload Status:', uploadRes.status);
        console.log('Upload Result:', JSON.stringify(result, null, 2));

    } catch (e) {
        console.error('Error:', e);
    }
}

testUpload();
