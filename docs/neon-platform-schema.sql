
-- Neon Platform Schema (Latest from neon-api-schema.dbml)
-- Simplified for Node.js Driver execution (No DO blocks)

-- 1. Enums
CREATE TYPE status_enum AS ENUM ('confirmed', 'cancelled', 'noshow', 'pending', 'closed', 'opencall');
CREATE TYPE frequency_enum AS ENUM ('adhoc', 'once', 'daily', 'weekly', 'biweekly', 'triweekly', 'monthly', 'quarterly', 'annually');
CREATE TYPE week_day_enum AS ENUM ('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'unknown');

-- 2. Tables

-- Users
CREATE TABLE IF NOT EXISTS "users" (
    "id" SERIAL PRIMARY KEY,
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "is_global_active" BOOLEAN DEFAULT TRUE,
    "is_admin" BOOLEAN DEFAULT FALSE,
    "date_last_seen" TIMESTAMPTZ,
    "date_created" TIMESTAMPTZ DEFAULT NOW()
);

-- User Profiles
CREATE TABLE IF NOT EXISTS "user_profiles" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "handle" VARCHAR(100) NOT NULL,
    "fullname" VARCHAR(255) NOT NULL,
    "description" TEXT DEFAULT '',
    "flag_emoji" VARCHAR(10) NOT NULL DEFAULT '🏳️',
    "interest_tags" JSONB NOT NULL DEFAULT '[]',
    "affiliate_urls" JSONB DEFAULT '[]',
    "date_created" TIMESTAMPTZ DEFAULT NOW(),
    "is_profile_active" BOOLEAN DEFAULT TRUE
);

-- Venues
CREATE TABLE IF NOT EXISTS "venues" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "address_line_1" VARCHAR(255) NOT NULL,
    "address_line_2" VARCHAR(255) DEFAULT '',
    "city" VARCHAR(100) NOT NULL DEFAULT 'London',
    "county" VARCHAR(100) DEFAULT '',
    "postcode" VARCHAR(20) NOT NULL DEFAULT 'UNKNOWN',
    "area" VARCHAR(100) DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT TRUE,
    "tz" VARCHAR(50) NOT NULL DEFAULT 'europe/london',
    "latitude" DECIMAL(10, 8),
    "longitude" DECIMAL(11, 8),
    "capacity" INTEGER NOT NULL DEFAULT 0,
    "is_private" BOOLEAN DEFAULT FALSE,
    "venue_tags" JSONB NOT NULL DEFAULT '[]',
    "comments" TEXT DEFAULT '',
    "created_on" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "modified_on" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Exchange Rates
CREATE TABLE IF NOT EXISTS "exchange_rates" (
    "currency_code" CHAR(3) PRIMARY KEY,
    "rate_to_usd" DECIMAL(10, 6) NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Models
CREATE TABLE IF NOT EXISTS "models" (
    "id" SERIAL PRIMARY KEY,
    "user_profile_id" INTEGER REFERENCES "user_profiles"("id") ON DELETE CASCADE,
    "display_name" VARCHAR(255),
    "phone_number" VARCHAR(50) NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    
    "currency_code" CHAR(3) NOT NULL DEFAULT 'GBP' REFERENCES "exchange_rates"("currency_code"),
    "rate_min_hour" DECIMAL(10,2) DEFAULT 20.00,
    "rate_min_day" DECIMAL(10,2) DEFAULT 120.00,
    
    "tz" VARCHAR(50) NOT NULL DEFAULT 'europe/london',
    
    "work_inperson" BOOLEAN DEFAULT TRUE,
    "work_online" BOOLEAN DEFAULT FALSE,
    "work_photography" BOOLEAN DEFAULT FALSE,
    
    "work_seeks" JSONB NOT NULL DEFAULT '["nude", "portrait", "clothed", "underwear", "costume"]',
    "social_urls" JSONB DEFAULT '[]',
    "product_urls" JSONB DEFAULT '[]',
    
    "date_birthday" TIMESTAMPTZ,
    "date_experience" TIMESTAMPTZ,
    
    "sex" SMALLINT NOT NULL DEFAULT 0,
    "pronouns" VARCHAR(50) NOT NULL DEFAULT ''
);

-- Hosts
CREATE TABLE IF NOT EXISTS "hosts" (
    "id" SERIAL PRIMARY KEY,
    "user_profile_id" INTEGER NOT NULL REFERENCES "user_profiles"("id") ON DELETE CASCADE,
    "name" VARCHAR(255) NOT NULL DEFAULT 'Unknown',
    "phone_number" VARCHAR(50),
    "description" TEXT,
    "summary" VARCHAR(280), -- Tweet size
    
    "social_urls" JSONB DEFAULT '[]',
    
    "currency_code" CHAR(3) NOT NULL DEFAULT 'GBP' REFERENCES "exchange_rates"("currency_code"),
    "rate_max_hour" DECIMAL(10,2) NOT NULL DEFAULT 25.00,
    "rate_max_day" DECIMAL(10,2) NOT NULL DEFAULT 150.00,
    
    "tz" VARCHAR(50) NOT NULL DEFAULT 'europe/london',
    "date_created" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "host_tags" JSONB NOT NULL DEFAULT '[]'
);

-- Events
CREATE TABLE IF NOT EXISTS "events" (
    "id" SERIAL PRIMARY KEY,
    "venue_id" INTEGER REFERENCES "venues"("id") ON DELETE SET NULL,
    "host_user_id" INTEGER NOT NULL REFERENCES "user_profiles"("id") ON DELETE CASCADE,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "images" JSONB DEFAULT '[]',
    "frequency" frequency_enum NOT NULL DEFAULT 'weekly',
    "week_day" week_day_enum NOT NULL DEFAULT 'unknown',
    "pricing_table" JSONB NOT NULL DEFAULT '[]',
    "pricing_text" TEXT NOT NULL DEFAULT '',
    "pricing_tags" JSONB NOT NULL DEFAULT '[]',
    "pose_format" TEXT NOT NULL DEFAULT 'Mixed poses: gesture, short, medium, long'
);

-- Calendar
CREATE TABLE IF NOT EXISTS "calendar" (
    "id" SERIAL PRIMARY KEY,
    "event_id" INTEGER REFERENCES "events"("id") ON DELETE CASCADE,
    "model_id" INTEGER REFERENCES "models"("id") ON DELETE SET NULL,
    "status" status_enum DEFAULT 'pending',
    "attendance_inperson" INTEGER DEFAULT 0,
    "attendance_online" INTEGER DEFAULT 0,
    "date_time" TIMESTAMPTZ NOT NULL,
    "duration" DECIMAL(5,2) NOT NULL DEFAULT 2.0,
    "pose_format" TEXT
);

-- Tracking
CREATE TABLE IF NOT EXISTS "tracking" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
    "href" VARCHAR(255) NOT NULL,
    "timestamp" TIMESTAMPTZ DEFAULT NOW()
);
