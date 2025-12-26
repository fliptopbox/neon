import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
config();

const DATABASE_URL = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
}

const sql = neon(DATABASE_URL);

async function importVenues() {
    try {
        console.log('🚀 Starting venues seed...\n');

        // 1. Recreate Venues Table (Drop & Create)
        // IMPORTANT: This handles foreign key constraints if necessary, or we assume clean state.
        // Given the task, we want to replace the table with the new schema.
        console.log('🗑️  Dropping existing venues table...');
        await sql`DROP TABLE IF EXISTS venues CASCADE`;

        console.log('🏗️  Creating new venues table...');
        // Using the schema we just defined
        await sql`
      CREATE TABLE IF NOT EXISTS "venues"(
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL,
        "address_line_1" VARCHAR(255) NOT NULL,
        "address_line_2" VARCHAR(255) DEFAULT '',
        "city" VARCHAR(100) NOT NULL DEFAULT 'London',
        "county" VARCHAR(100) DEFAULT '',
        "postcode" VARCHAR(20) NOT NULL,
        "area" VARCHAR(100) DEFAULT '',
        "active" BOOLEAN NOT NULL DEFAULT TRUE,
        "timezone" VARCHAR(50) NOT NULL DEFAULT 'GMT',
        "latitude" DECIMAL(10, 8),
        "longitude" DECIMAL(11, 8),
        "created_on" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
        "modified_on" TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
      );
    `;

        // 2. Read JSON
        const jsonPath = path.join(__dirname, '../venues_wip.json');
        const rawData = fs.readFileSync(jsonPath, 'utf-8');
        const venues = JSON.parse(rawData);

        console.log(`📝 Found ${venues.length} venues to insert...\n`);

        // 3. Insert Data
        let insertedCount = 0;
        for (const venue of venues) {
            try {
                await sql`
          INSERT INTO venues (
            name, 
            address_line_1, 
            address_line_2, 
            city, 
            county, 
            postcode, 
            area, 
            active, 
            timezone, 
            latitude, 
            longitude, 
            created_on, 
            modified_on
          ) VALUES (
            ${venue.name},
            ${venue.address_line_1},
            ${venue.address_line_2 || ''},
            ${venue.city || 'London'},
            ${venue.county || ''},
            ${venue.postcode},
            ${venue.area || ''},
            ${venue.active},
            ${venue.timezone || 'GMT'},
            ${venue.latitude ? parseFloat(venue.latitude) : null},
            ${venue.longitude ? parseFloat(venue.longitude) : null},
            ${venue.created_on || new Date().toISOString()},
            ${venue.modified_on || new Date().toISOString()}
          )
        `;
                insertedCount++;
                if (insertedCount % 10 === 0) process.stdout.write('.');
            } catch (err) {
                console.error(`\n❌ Failed to insert venue: ${venue.name}`, err.message);
            }
        }

        console.log(`\n\n✅ Successfully seeded ${insertedCount} venues!`);

    } catch (error) {
        console.error('\n❌ Seed failed:', error);
        process.exit(1);
    }
}

importVenues();
