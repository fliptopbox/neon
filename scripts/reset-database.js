/**
 * Reset database: Drop all tables except exchange_rates, then recreate from schema
 */
import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not found. Please set it in .env or .dev.vars');
    process.exit(1);
}

const sql = neon(DATABASE_URL);

async function resetDatabase() {
    console.log('🔄 Starting database reset...\n');

    // 1. Get list of all tables
    console.log('📋 Getting list of tables...');
    const tables = await sql`
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public'
  `;
    console.log('   Found:', tables.map(t => t.tablename).join(', '));

    // 2. Drop all tables except exchange_rates
    const tablesToDrop = tables
        .map(t => t.tablename)
        .filter(name => name !== 'exchange_rates');

    if (tablesToDrop.length > 0) {
        console.log('\n🗑️  Dropping tables (except exchange_rates)...');

        // Drop all tables at once with CASCADE
        const dropQuery = `DROP TABLE IF EXISTS ${tablesToDrop.map(t => `"${t}"`).join(', ')} CASCADE`;
        try {
            await sql(dropQuery);
            console.log(`   ✅ Dropped: ${tablesToDrop.join(', ')}`);
        } catch (err) {
            console.log(`   ⚠️  Failed: ${err.message}`);
        }
    }
    // 3. Create tables from schema
    console.log('\n📦 Creating tables...');

    // Create ENUM types
    await sql`
    DO $$ BEGIN
      CREATE TYPE status_enum AS ENUM ('cancelled', 'closed', 'confirmed', 'noshow', 'opencall', 'pending');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$
  `;

    await sql`
    DO $$ BEGIN
      CREATE TYPE frequency_enum AS ENUM ('adhoc', 'once', 'daily', 'weekly', 'biweekly', 'triweekly', 'monthly', 'quarterly', 'annually');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$
  `;

    await sql`
    DO $$ BEGIN
      CREATE TYPE week_day_enum AS ENUM ('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'unknown');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$
  `;
    console.log('   ✅ Created ENUM types');

    // Users table
    await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      is_global_active BOOLEAN DEFAULT true,
      is_admin BOOLEAN DEFAULT false,
      date_last_seen TIMESTAMP,
      date_created TIMESTAMP DEFAULT NOW()
    )
  `;
    console.log('   ✅ Created: users');

    // User profiles table
    await sql`
    CREATE TABLE IF NOT EXISTS user_profiles (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      handle VARCHAR(255) NOT NULL,
      fullname VARCHAR(255) NOT NULL,
      description TEXT DEFAULT '',
      interest_tags JSONB DEFAULT '[]',
      flag_emoji VARCHAR(10) DEFAULT '🏳️',
      affiliate_urls JSONB DEFAULT '[]',
      date_created TIMESTAMP DEFAULT NOW(),
      is_profile_active BOOLEAN DEFAULT true
    )
  `;
    console.log('   ✅ Created: user_profiles');

    // Venues table
    await sql`
    CREATE TABLE IF NOT EXISTS venues (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      address_line_1 VARCHAR(255) NOT NULL,
      address_line_2 VARCHAR(255) DEFAULT '',
      city VARCHAR(100) DEFAULT 'London',
      county VARCHAR(100) DEFAULT '',
      postcode VARCHAR(20) DEFAULT 'UNKNOWN',
      area VARCHAR(100) DEFAULT '',
      active BOOLEAN DEFAULT true,
      tz VARCHAR(50) DEFAULT 'europe/london',
      latitude DECIMAL(10,8),
      longitude DECIMAL(11,8),
      capacity INTEGER DEFAULT 0,
      created_on TIMESTAMP DEFAULT NOW(),
      modified_on TIMESTAMP DEFAULT NOW(),
      is_private BOOLEAN DEFAULT false,
      venue_tags JSONB DEFAULT '[]',
      comments TEXT DEFAULT ''
    )
  `;
    console.log('   ✅ Created: venues');

    // Hosts table
    await sql`
    CREATE TABLE IF NOT EXISTS hosts (
      id SERIAL PRIMARY KEY,
      user_profile_id INTEGER NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      phone_number VARCHAR(50),
      social_urls JSONB DEFAULT '[]',
      currency_code CHAR(3) DEFAULT 'GBP',
      rate_max_hour DECIMAL(10,2) DEFAULT 25.00,
      rate_max_day DECIMAL(10,2) DEFAULT 150.00,
      tz VARCHAR(50) DEFAULT 'europe/london',
      date_created TIMESTAMP DEFAULT NOW(),
      host_tags JSONB DEFAULT '[]'
    )
  `;
    console.log('   ✅ Created: hosts');

    // Models table
    await sql`
    CREATE TABLE IF NOT EXISTS models (
      id SERIAL PRIMARY KEY,
      user_profile_id INTEGER REFERENCES user_profiles(id) ON DELETE SET NULL,
      phone_number VARCHAR(50) DEFAULT '',
      display_name VARCHAR(255),
      description TEXT DEFAULT '',
      currency_code CHAR(3) DEFAULT 'GBP',
      rate_min_hour DECIMAL(10,2) DEFAULT 20.00,
      rate_min_day DECIMAL(10,2) DEFAULT 120.00,
      tz VARCHAR(50) DEFAULT 'europe/london',
      work_inperson BOOLEAN DEFAULT true,
      work_online BOOLEAN DEFAULT false,
      work_photography BOOLEAN DEFAULT false,
      work_seeks JSONB DEFAULT '["nude", "portrait", "clothed", "underwear", "costume"]',
      social_urls JSONB DEFAULT '[]',
      product_urls JSONB DEFAULT '[]',
      date_birthday TIMESTAMP,
      date_experience TIMESTAMP,
      sex SMALLINT DEFAULT 0,
      pronouns VARCHAR(50) DEFAULT ''
    )
  `;
    console.log('   ✅ Created: models');

    // Events table
    await sql`
    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      venue_id INTEGER REFERENCES venues(id) ON DELETE SET NULL,
      host_user_id INTEGER NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      images JSONB DEFAULT '[]',
      frequency frequency_enum DEFAULT 'weekly',
      week_day week_day_enum DEFAULT 'unknown',
      pricing_table JSONB DEFAULT '[]',
      pricing_text TEXT DEFAULT '',
      pricing_tags JSONB DEFAULT '[]',
      pose_format TEXT DEFAULT 'Mixed poses: gesture, short, medium, long'
    )
  `;
    console.log('   ✅ Created: events');

    // Calendar table
    await sql`
    CREATE TABLE IF NOT EXISTS calendar (
      id SERIAL PRIMARY KEY,
      event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
      model_id INTEGER REFERENCES models(id) ON DELETE SET NULL,
      status status_enum,
      attendance_inperson INTEGER DEFAULT 0,
      attendance_online INTEGER DEFAULT 0,
      date_time TIMESTAMP,
      duration DECIMAL(4,2) DEFAULT 2.0,
      pose_format TEXT
    )
  `;
    console.log('   ✅ Created: calendar');

    // Tracking table
    await sql`
    CREATE TABLE IF NOT EXISTS tracking (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      href VARCHAR(500) NOT NULL,
      timestamp TIMESTAMPTZ DEFAULT NOW()
    )
  `;
    console.log('   ✅ Created: tracking');

    // Verify exchange_rates still exists
    const exchangeRates = await sql`SELECT COUNT(*) as count FROM exchange_rates`;
    console.log(`\n✅ exchange_rates preserved: ${exchangeRates[0].count} rows`);

    console.log('\n✅ Database reset complete! All tables created (empty).\n');
}

resetDatabase().catch(err => {
    console.error('❌ Reset failed:', err);
    process.exit(1);
});
