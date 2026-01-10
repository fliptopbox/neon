import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE = 'http://localhost:8787';

// Admin credentials from database query
const ADMIN_EMAIL = 'response.write@gmail.com';
const ADMIN_PASSWORD = 'your-password-here'; // ← YOU NEED TO UPDATE THIS

console.log('═══════════════════════════════════════════════════════');
console.log('  Complete Add Model → Delete User Test');
console.log('═══════════════════════════════════════════════════════');
console.log('');
console.log('Admin User: Bruce Thomas (ID: 1)');
console.log('Email:', ADMIN_EMAIL);
console.log('');

async function loginAsAdmin() {
    console.log('🔐 Step 1: Logging in as admin...');
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
            console.log('   User ID:', result.user.id);
            console.log('   Is Admin:', result.user.isAdmin);
            console.log('   Token:', result.token.substring(0, 30) + '...');
            console.log('');
            return result.token;
        } else {
            console.error('❌ Login failed:');
            console.error('   Status:', response.status);
            console.error('   Error:', result.error);
            console.log('');
            console.log('💡 HINT: Update the ADMIN_PASSWORD in this script.');
            console.log('   The admin user is: response.write@gmail.com (Bruce Thomas)');
            return null;
        }
    } catch (error) {
        console.error('❌ Network error:', error.message);
        return null;
    }
}

async function registerModel(requestData) {
    console.log('🚀 Step 2: Registering model...');
    console.log('   Fullname:', requestData.fullname);
    console.log('   Email:', requestData.email);
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
            console.log('   User ID:', result.userId);
            console.log('');
            return result;
        } else {
            console.error('❌ Registration failed:');
            console.error('   Status:', response.status);
            console.error('   Error:', result.error || JSON.stringify(result));
            console.log('');
            return null;
        }
    } catch (error) {
        console.error('❌ Network error:', error.message);
        return null;
    }
}

async function deleteUserByFullname(fullname, token) {
    console.log('🗑️  Step 3: Deleting user by fullname...');
    console.log('   Fullname:', fullname);
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
            console.log('   User ID:', result.userId);
            console.log('   Deleted by:', result.deletedBy);
            console.log('   Message:', result.message);
            console.log('');
            return result;
        } else {
            console.error('❌ Deletion failed:');
            console.error('   Status:', response.status);
            console.error('   Error:', result.error);
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

    console.log('📋 Test Data:');
    console.log('   Fullname:', requestData.fullname);
    console.log('   Email:', requestData.email);
    console.log('   Handle:', requestData.handle);
    console.log('');
    console.log('───────────────────────────────────────────────────────');
    console.log('');

    // Step 1: Login as admin
    const token = await loginAsAdmin();

    if (!token) {
        console.log('═══════════════════════════════════════════════════════');
        console.log('  ❌ TEST FAILED - Authentication Required');
        console.log('═══════════════════════════════════════════════════════');
        console.log('');
        console.log('To fix this:');
        console.log('1. Update ADMIN_PASSWORD in this script');
        console.log('2. Or reset the password for response.write@gmail.com');
        console.log('');
        process.exit(1);
    }

    // Step 2: Register the model
    const registerResult = await registerModel(requestData);

    if (!registerResult) {
        console.log('═══════════════════════════════════════════════════════');
        console.log('  ❌ TEST FAILED - Model Registration Failed');
        console.log('═══════════════════════════════════════════════════════');
        process.exit(1);
    }

    // Wait a moment
    console.log('⏳ Waiting 1 second...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('');

    // Step 3: Delete the user by fullname
    const deleteResult = await deleteUserByFullname(requestData.fullname, token);

    // Final summary
    console.log('═══════════════════════════════════════════════════════');
    console.log('  TEST SUMMARY');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('✅ Login:        ', token ? 'SUCCESS' : 'FAILED');
    console.log('✅ Register:     ', registerResult ? 'SUCCESS' : 'FAILED');
    console.log('✅ Delete:       ', deleteResult ? 'SUCCESS' : 'FAILED');
    console.log('');

    if (token && registerResult && deleteResult) {
        console.log('🎉 ALL TESTS PASSED!');
        console.log('');
        console.log('The complete flow works:');
        console.log('1. ✅ Admin authentication');
        console.log('2. ✅ Model registration');
        console.log('3. ✅ User deletion by fullname');
        console.log('');
        process.exit(0);
    } else {
        console.log('⚠️  SOME TESTS FAILED');
        console.log('');
        process.exit(1);
    }
})();
