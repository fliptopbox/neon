import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the request.json file
const requestPath = path.join(__dirname, 'src/www/add-model/request.json');
const requestData = JSON.parse(fs.readFileSync(requestPath, 'utf8'));

console.log('📋 Request Data Loaded:');
console.log('Fullname:', requestData.fullname);
console.log('Email:', requestData.email);
console.log('Handle:', requestData.handle);
console.log('');

async function testAddModel() {
    console.log('🚀 Testing Add Model API...');
    console.log('Endpoint: http://localhost:8788/api/register/model');
    console.log('');

    try {
        const response = await fetch('http://localhost:8788/api/register/model', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });

        const result = await response.json();

        if (response.ok) {
            console.log('✅ Model registered successfully!');
            console.log('User ID:', result.userId);
            console.log('Response:', JSON.stringify(result, null, 2));
            console.log('');
            return result;
        } else {
            console.error('❌ Error registering model:');
            console.error('Status:', response.status);
            console.error('Response:', JSON.stringify(result, null, 2));
            return null;
        }
    } catch (error) {
        console.error('❌ Network error:', error.message);
        return null;
    }
}

async function testDeleteUser(fullname) {
    console.log('🗑️  Testing Delete User API...');
    console.log('Endpoint: http://localhost:8788/api/users/delete-by');
    console.log('Deleting by fullname:', fullname);
    console.log('');

    try {
        const response = await fetch('http://localhost:8788/api/users/delete-by', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                // Note: This endpoint requires admin auth, you may need to add auth headers
                // 'Authorization': 'Bearer YOUR_TOKEN_HERE'
            },
            body: JSON.stringify({ fullname })
        });

        const result = await response.json();

        if (response.ok) {
            console.log('✅ User deleted successfully!');
            console.log('User ID:', result.userId);
            console.log('Deleted by:', result.deletedBy);
            console.log('Response:', JSON.stringify(result, null, 2));
        } else {
            console.error('❌ Error deleting user:');
            console.error('Status:', response.status);
            console.error('Response:', JSON.stringify(result, null, 2));
        }
    } catch (error) {
        console.error('❌ Network error:', error.message);
    }
}

// Run the tests
(async () => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  Testing Add Model → Delete User Flow');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');

    // Step 1: Add the model
    const addResult = await testAddModel();

    if (addResult) {
        console.log('⏳ Waiting 2 seconds before deletion...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('');

        // Step 2: Delete the user by fullname
        await testDeleteUser(requestData.fullname);
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('  Test Complete');
    console.log('═══════════════════════════════════════════════════════');
})();
