
import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config();

const DATABASE_URL = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
}

const sql = neon(DATABASE_URL);

async function checkSchema() {
    try {
        console.log('Checking hosts table schema...');
        const columns = await sql`
            SELECT column_name, data_type
            FROM information_schema.columns 
            WHERE table_name = 'hosts'
        `;
        console.log('Columns in hosts table:');
        columns.forEach(c => console.log(` - ${c.column_name} (${c.data_type})`));

        console.log('\nChecking users table schema (just in case)...');
        const userColumns = await sql`
            SELECT column_name, data_type
            FROM information_schema.columns 
            WHERE table_name = 'users'
        `;
        userColumns.forEach(c => console.log(` - ${c.column_name} (${c.data_type})`));

    } catch (e) {
        console.error(e);
    }
}

checkSchema();
