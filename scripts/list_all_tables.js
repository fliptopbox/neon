
import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config();

const DATABASE_URL = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
const sql = neon(DATABASE_URL);

async function listTables() {
    try {
        const tables = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `;

        console.log("Found Tables:", tables.map(t => t.table_name).join(', '));

        for (const t of tables) {
            const columns = await sql`
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_name = ${t.table_name}
                ORDER BY ordinal_position;
            `;
            // Simplified output for parsing
            console.log(`\nTABLE: ${t.table_name}`);
            columns.forEach(c => {
                console.log(`  ${c.column_name} | ${c.data_type} | ${c.is_nullable} | ${c.column_default}`);
            });
        }
    } catch (e) {
        console.error(e);
    }
}

listTables();
