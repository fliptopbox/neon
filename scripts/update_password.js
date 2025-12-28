
import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import crypto from 'crypto';

config();

const DATABASE_URL = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
}

const sql = neon(DATABASE_URL);

function hashPassword(email, password) {
    const tokenSalt = email.trim().toLowerCase() + ':' + password;
    return crypto.createHash('sha256').update(tokenSalt).digest('hex');
}

async function updatePassword() {
    const email = 'dyslexic@gmx.com';
    const password = 'password';
    const hash = hashPassword(email, password);

    console.log(`Updating password for ${email}...`);

    try {
        const columns = await sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users'
        `;
        console.log('Columns in users table:', columns.map(c => c.column_name));

        // Check if user exists first using correct column
        const users = await sql`SELECT * FROM users WHERE email = ${email}`;

        if (users.length === 0) {
            console.error('User not found!');
            // Create the user if it doesn't exist?
            // Maybe the previous import failed or hasn't run.
            // Let's create it.
            console.log('Creating user...');
            const [newUser] = await sql`
                INSERT INTO users (email, password_hash, is_global_active, is_admin, date_created) 
                VALUES (${email}, ${hash}, true, false, NOW()) 
                RETURNING id
            `;
            console.log('Created user with ID:', newUser.id);

            // Also need to create user_profiles
            await sql`
                INSERT INTO user_profiles (user_id, fullname, handle, date_created) 
                VALUES (${newUser.id}, 'Bruce Dyslexic', 'bruce-dyslexic', NOW())
             `;
            console.log('Created user profile');

            return;
        }

        const user = users[0];
        console.log('Found user:', user);

        await sql`
            UPDATE users 
            SET password_hash = ${hash}
            WHERE email = ${email}
        `;

        console.log('Password updated successfully for', email);

    } catch (e) {
        console.error(e);
    }
}

updatePassword();
