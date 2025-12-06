import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

const DATABASE_URL = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function reset() {
  try {
    console.log('🗑️  Resetting database...\n');

    const tables = [
      'images',
      'artists',
      'models',
      'venues',
      'user_bios',
      'users',
      'types',
    ];

    for (const table of tables) {
      try {
        await sql(`DROP TABLE IF EXISTS ${table} CASCADE`);
        console.log(`✅ Dropped table: ${table}`);
      } catch (error) {
        console.log(`⚠️  Could not drop ${table}: ${error.message}`);
      }
    }

    console.log('\n✅ Database reset complete!');
    console.log('💡 Run "npm run db:migrate" to recreate tables\n');

  } catch (error) {
    console.error('\n❌ Reset failed:', error);
    process.exit(1);
  }
}

reset();
