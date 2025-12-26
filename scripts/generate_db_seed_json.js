
import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config();

const DATABASE_URL = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
const sql = neon(DATABASE_URL);

async function exportSeedData() {
    console.log('🚀 Exporting clean DB state to db-seed.json...');

    try {
        const users = await sql`SELECT * FROM users ORDER BY id`;
        const user_profiles = await sql`SELECT * FROM user_profiles ORDER BY id`;
        const venues = await sql`SELECT * FROM venues ORDER BY id`;
        const hosts = await sql`SELECT * FROM hosts ORDER BY id`;
        const models = await sql`SELECT * FROM models ORDER BY id`;
        const events = await sql`SELECT * FROM events ORDER BY id`;
        const calendar = await sql`SELECT * FROM calendar ORDER BY date_time`;
        const exchange_rates = await sql`SELECT * FROM exchange_rates ORDER BY currency_code`;

        const seedData = {
            metadata: {
                exported_at: new Date().toISOString(),
                version: "2.1-cal-update",
                description: "Seed data with fixed Calendar sessions"
            },
            exchange_rates,
            users,
            user_profiles,
            venues,
            hosts,
            models,
            events,
            calendar
        };

        const outputPath = path.join(__dirname, '../db-seed.json');

        const jsonContent = JSON.stringify(seedData, (key, value) => {
            return typeof value === 'bigint' ? value.toString() : value;
        }, 2);

        fs.writeFileSync(outputPath, jsonContent);
        console.log(`✅ Exported to ${outputPath} (${jsonContent.length} bytes)`);

    } catch (err) {
        console.error('❌ Export Failed:', err);
    }
}

exportSeedData();
