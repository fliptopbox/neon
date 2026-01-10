import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE = 'http://localhost:8787';

// Admin credentials - you'll need to update these
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'your-admin-password';

console.log('═══════════════════════════════════════════════════════');
console.log('  Testing Add Model → Delete User Flow (with Auth)');
console.log('═══════════════════════════════════════════════════════');
console.log('');

async function loginAsAdmin() {
    console.log('🔐 Logging in as admin...');
    console.log('Email:', ADMIN_EMAIL);
    console.log('');

    try {
        const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: ADMIN_EMAIL,
                password: ADMIN_PASSWORD
            })
        });

        const result = await response.json();

        if (response.ok) {
            console.log('✅ Login successful!');
            console.log('User ID:', result.user.id);
            console.log('Is Admin:', result.user.isAdmin);
            console.log('Token:', result.token.substring(0, 20) + '...');
            console.log('');
            return result.token;
        } else {
            console.error('❌ Login failed:');
            console.error('Status:', response.status);
            console.error('Response:', JSON.stringify(result, null, 2));
            console.log('');
            console.log('💡 HINT: You need to update ADMIN_EMAIL and ADMIN_PASSWORD in this script.');
            console.log('   Or create an admin user first using the /api/auth/register endpoint.');
            console.log('   The first registered user automatically becomes an admin.');
            return null;
        }
    } catch (error) {
        console.error('❌ Network error:', error.message);
        return null;
    }
}

async function registerModel(requestData) {
    console.log('🚀 Registering model...');
    console.log('Fullname:', requestData.fullname);
    console.log('Email:', requestData.email);
    console.log('');

    try {
        const response = await fetch(`${API_BASE}/api/register/model`, {
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
            console.log('');
            return null;
        }
    } catch (error) {
        console.error('❌ Network error:', error.message);
        return null;
    }
}

async function deleteUserByFullname(fullname, token) {
    console.log('🗑️  Deleting user...');
    console.log('Fullname:', fullname);
    console.log('Using admin token:', token.substring(0, 20) + '...');
    console.log('');

    try {
        const response = await fetch(`${API_BASE}/api/users/delete-by`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ fullname })
        });

        const result = await response.json();

        if (response.ok) {
            console.log('✅ User deleted successfully!');
            console.log('User ID:', result.userId);
            console.log('Deleted by:', result.deletedBy);
            console.log('Response:', JSON.stringify(result, null, 2));
            console.log('');
            return result;
        } else {
            console.error('❌ Error deleting user:');
            console.error('Status:', response.status);
            console.error('Response:', JSON.stringify(result, null, 2));
            console.log('');
            return null;
        }
    } catch (error) {
        console.error('❌ Network error:', error.message);
        return null;
    }
}

// Main test flow
(async () => {
    // Read the request.json file
    const requestPath = path.join(__dirname, 'src/www/add-model/request.json');
    const requestData = JSON.parse(fs.readFileSync(requestPath, 'utf8'));

    // Make email unique to avoid duplicate key errors
    const uniqueId = Date.now();
    requestData.email = `test-${uniqueId}@example.com`;

    console.log('📋 Request Data:');
    console.log('Fullname:', requestData.fullname);
    console.log('Email:', requestData.email);
    console.log('Handle:', requestData.handle);
    console.log('');

    // Step 1: Login as admin
    const token = await loginAsAdmin();

    if (!token) {
        console.log('');
        console.log('═══════════════════════════════════════════════════════');
        console.log('  Test Failed - Could not authenticate as admin');
        console.log('═══════════════════════════════════════════════════════');
        process.exit(1);
    }

    // Step 2: Register the model
    const registerResult = await registerModel(requestData);

    if (!registerResult) {
        console.log('');
        console.log('═══════════════════════════════════════════════════════');
        console.log('  Test Failed - Could not register model');
        console.log('═══════════════════════════════════════════════════════');
        process.exit(1);
    }

    // Wait a moment
    console.log('⏳ Waiting 1 second before deletion...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('');

    // Step 3: Delete the user by fullname
    const deleteResult = await deleteUserByFullname(requestData.fullname, token);

    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('  Test Complete');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('Summary:');
    console.log('- Login:', token ? '✅ Success' : '❌ Failed');
    console.log('- Register Model:', registerResult ? '✅ Success' : '❌ Failed');
    console.log('- Delete User:', deleteResult ? '✅ Success' : '❌ Failed');
    console.log('');

    if (token && registerResult && deleteResult) {
        console.log('🎉 All tests passed!');
        process.exit(0);
    } else {
        console.log('⚠️  Some tests failed. See details above.');
        process.exit(1);
    }
})();
