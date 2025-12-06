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

async function migrate() {
  try {
    console.log('🚀 Starting database migration...\n');

    // Read the SQL file
    const sqlFile = path.join(__dirname, '../docs/drawSQL-pgsql-export-2025-11-30.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf-8');

    // Split by semicolons and filter out comments and empty statements
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && !s.startsWith('COMMENT'));

    console.log(`📝 Found ${statements.length} SQL statements\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        try {
          await sql(statement);
          console.log(`✅ Statement ${i + 1}/${statements.length} executed`);
        } catch (error) {
          // Ignore "already exists" and "duplicate" errors
          if (
            error.message.includes('already exists') || 
            error.message.includes('duplicate') ||
            error.code === '42P07' || // duplicate table
            error.code === '42P16' || // duplicate primary key
            error.code === '42710'    // duplicate object
          ) {
            console.log(`⚠️  Statement ${i + 1}: Skipped (already exists)`);
          } else {
            console.error(`❌ Statement ${i + 1} failed:`, error.message);
            throw error;
          }
        }
      }
    }

    // Add is_admin column to users table if it doesn't exist
    try {
      await sql`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false
      `;
      console.log('\n✅ Added is_admin column to users table');
    } catch (error) {
      console.log('\n⚠️  is_admin column might already exist');
    }

    console.log('\n✅ Migration completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
