#!/usr/bin/env node

/**
 * Query the database to find admin users
 * This script connects directly to the Neon PostgreSQL database
 */

import { neon } from '@neondatabase/serverless';

const DATABASE_URL = 'postgresql://neondb_owner:npg_GaIcU6p7VOBi@ep-summer-night-a4muyhl7-pooler.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require';

async function findAdminUsers() {
    const sql = neon(DATABASE_URL);

    try {
        console.log('✅ Connecting to database...');
        console.log('');

        // Query for admin users
        const result = await sql`
            SELECT 
                u.id,
                u.email,
                u.is_admin,
                u.is_global_active,
                u.date_created,
                up.fullname,
                up.handle
            FROM users u
            LEFT JOIN user_profiles up ON u.id = up.user_id
            WHERE u.is_admin = true
            ORDER BY u.id
        `;

        console.log('═══════════════════════════════════════════════════════');
        console.log('  ADMIN USERS IN DATABASE');
        console.log('═══════════════════════════════════════════════════════');
        console.log('');

        if (result.length === 0) {
            console.log('❌ No admin users found');
            console.log('');
            console.log('💡 The first user to register becomes admin automatically.');
            console.log('   Use POST /api/auth/register to create the first admin user.');
        } else {
            console.log(`✅ Found ${result.length} admin user(s):`);
            console.log('');

            result.forEach((admin, i) => {
                console.log(`Admin ${i + 1}:`);
                console.log('  ID:', admin.id);
                console.log('  Email:', admin.email);
                console.log('  Fullname:', admin.fullname || 'N/A');
                console.log('  Handle:', admin.handle || 'N/A');
                console.log('  Active:', admin.is_global_active);
                console.log('  Created:', admin.date_created);
                console.log('');
            });
        }

        // Also show total user count
        const countResult = await sql`SELECT COUNT(*) as total FROM users`;
        console.log('═══════════════════════════════════════════════════════');
        console.log(`Total users in database: ${countResult[0].total}`);
        console.log('═══════════════════════════════════════════════════════');

    } catch (error) {
        console.error('❌ Database error:', error.message);
        process.exit(1);
    }
}

findAdminUsers();
