
import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config();

const DATABASE_URL = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
}

const sql = neon(DATABASE_URL);

async function checkModelSchema() {
    try {
        console.log('Checking models table schema...');
        const columns = await sql`
            SELECT column_name, data_type, column_default
            FROM information_schema.columns 
            WHERE table_name = 'models'
        `;
        console.log('Columns in models table:');
        columns.forEach(c => console.log(` - ${c.column_name} (${c.data_type}) [default: ${c.column_default}]`));

    } catch (e) {
        console.error(e);
    }
}

checkModelSchema();
