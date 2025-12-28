import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import crypto from 'crypto';

const connStr = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
if (!connStr) {
    console.error("No DATABASE_URL found");
    process.exit(1);
}
const sql = neon(connStr);

// ============================================================================
// CONFIGURATION
// ============================================================================
const ADMIN_USER = {
    email: 'response.write@gmail.com',
    password: 'pa55word!',
    fullname: 'Bruce Thomas',
    handle: 'bruce-thomas',
    active: true,
    confirmed: true
};

const HOST_DESCRIPTIONS = {
    'Life Drawing Art': 'Community-focused life drawing sessions in East London.',
    'London Drawing': 'Established life drawing organization.',
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function hashPassword(email, password) {
    const tokenSalt = email.trim().toLowerCase() + ':' + password;
    return crypto.createHash('sha256').update(tokenSalt).digest('hex');
}

function mapSex(sexValue) {
    if (!sexValue) return 0;
    const s = sexValue.toString().toLowerCase();
    if (s === 'm' || s === 'male') return 1;
    if (s === 'f' || s === 'female') return 2;
    return 0;
}

function generateSpecialEmail(fullname) {
    const slug = fullname.toLowerCase().replace(/[⛔⚠️]/g, '').replace(/\(.*?\)/g, '').trim().replace(/\s+/g, '-');
    return `${slug}@lifedrawing.art`;
}

function isSpecialRecord(fullname) {
    const specialNames = ['closed', 'multiple models', 'unconfirmed'];
    const normalized = fullname.toLowerCase().replace(/[⛔⚠️()]/g, '').trim();
    return specialNames.some(name => normalized.includes(name));
}

function parseActive(hostedValue) {
    if (!hostedValue || hostedValue === '-' || hostedValue === 'x' || hostedValue.toLowerCase() === 'x') return false;
    return true;
}

function parseTime(timeStr) {
    if (!timeStr) return '19:00:00';
    const match = timeStr.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)?/i);
    if (!match) return '19:00:00';
    let hours = parseInt(match[1]);
    const minutes = match[2] || '00';
    const ampm = match[3];
    if (ampm && ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
    else if (ampm && ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
    if (hours < 11 && !ampm) hours += 12;
    return `${hours.toString().padStart(2, '0')}:${minutes}:00`;
}

function parsePrice(priceStr) {
    if (!priceStr) return 0;
    if (priceStr.toString().toLowerCase().includes('donation')) return 0;
    const match = priceStr.toString().match(/£?(\d+)\.?(\d{0,2})/);
    if (!match) return 0;
    const pounds = parseInt(match[1]);
    const pence = match[2] ? parseInt(match[2].padEnd(2, '0')) : 0;
    return pounds * 100 + pence;
}

function parseDuration(durationStr) {
    return parseFloat(durationStr || '2');
}

function cleanInstagram(instagram) {
    if (!instagram) return '';
    return instagram.replace(/^@/, '').trim();
}

function parseDate(dateStr) {
    if (!dateStr) return null;
    const parts = dateStr.trim().replace(/,/g, '').split(/\s+/);
    if (parts.length < 4) return null;
    const day = parts[1];
    const monthStr = parts[2];
    const yearShort = parts[3];
    const months = { 'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12' };
    const month = months[monthStr];
    const year = `20${yearShort}`;
    return `${year}-${month}-${day.padStart(2, '0')}`;
}

function parseStartTime(startStr) {
    if (!startStr) return '19:00:00';
    const hour = parseInt(startStr);
    return `${hour.toString().padStart(2, '0')}:00:00`;
}

// ============================================================================
// STEP 1: DROP AND RECREATE TABLES (STRICT DBML COMPLIANCE)
// ============================================================================

async function resetDatabase() {
    console.log('\n🗑️  Resetting database tables...\n');

    // Order matters for constraints
    const tables = [
        'tracking', 'calendar', 'events', 'models', 'hosts', 'venues',
        'user_profiles', 'users', 'exchange_rates',
        'user_bios', 'sessions', 'venue_tags', 'types', 'images' // Legacy/Extra tables purge
    ];

    for (const table of tables) {
        await sql(`DROP TABLE IF EXISTS ${table} CASCADE`);
        console.log(`  ✅ Dropped: ${table}`);
    }

    // 1. Users
    await sql`
        CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            is_global_active BOOLEAN DEFAULT TRUE,
            is_admin BOOLEAN DEFAULT FALSE,
            date_last_seen TIMESTAMP,
            date_created TIMESTAMP DEFAULT NOW()
        )
    `;
    console.log('  ✅ Created: users');

    // 2. User Profiles
    await sql`
        CREATE TABLE user_profiles (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            handle VARCHAR(100) NOT NULL,
            fullname VARCHAR(255) NOT NULL,
            description TEXT DEFAULT '',
            interest_tags JSON NOT NULL DEFAULT '[]',
            flag_emoji VARCHAR(10) NOT NULL DEFAULT '🏳️',
            affiliate_urls JSON DEFAULT '[]',
            date_created TIMESTAMP DEFAULT NOW(),
            is_profile_active BOOLEAN DEFAULT TRUE
        )
    `;
    console.log('  ✅ Created: user_profiles');

    // 3. Exchange Rates
    await sql`
        CREATE TABLE exchange_rates (
            currency_code CHAR(3) PRIMARY KEY,
            rate_to_usd DECIMAL(10, 6) NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `;
    await sql`INSERT INTO exchange_rates (currency_code, rate_to_usd) VALUES ('GBP', 1.25)`;
    console.log('  ✅ Created: exchange_rates');

    // 4. Venues
    await sql`
        CREATE TABLE venues (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            address_line_1 VARCHAR(255) NOT NULL,
            address_line_2 VARCHAR(255) DEFAULT '',
            city VARCHAR(100) NOT NULL DEFAULT 'London',
            county VARCHAR(100) DEFAULT '',
            postcode VARCHAR(20) NOT NULL DEFAULT 'UNKNOWN',
            area VARCHAR(100) DEFAULT '',
            active BOOLEAN NOT NULL DEFAULT TRUE,
            tz VARCHAR(50) NOT NULL DEFAULT 'europe/london',
            latitude DECIMAL(10, 8),
            longitude DECIMAL(11, 8),
            capacity INTEGER NOT NULL DEFAULT 0,
            created_on TIMESTAMP NOT NULL DEFAULT NOW(),
            modified_on TIMESTAMP NOT NULL DEFAULT NOW(),
            is_private BOOLEAN DEFAULT FALSE,
            venue_tags JSON NOT NULL DEFAULT '[]',
            comments TEXT DEFAULT ''
        )
    `;
    console.log('  ✅ Created: venues');

    // 5. Hosts
    await sql`
        CREATE TABLE hosts (
            id SERIAL PRIMARY KEY,
            user_profile_id INTEGER NOT NULL REFERENCES user_profiles(id),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            phone_number VARCHAR(255),
            social_urls JSON DEFAULT '[]',
            currency_code CHAR(3) NOT NULL DEFAULT 'GBP' REFERENCES exchange_rates(currency_code),
            rate_max_hour DECIMAL(10,2) NOT NULL DEFAULT 25.00,
            rate_max_day DECIMAL(10,2) NOT NULL DEFAULT 150.00,
            tz VARCHAR(50) NOT NULL DEFAULT 'europe/london',
            date_created TIMESTAMP NOT NULL DEFAULT NOW(),
            host_tags JSON NOT NULL DEFAULT '[]'
        )
    `;
    console.log('  ✅ Created: hosts');

    // 6. Models
    await sql`
        CREATE TABLE models (
            id SERIAL PRIMARY KEY,
            user_profile_id INTEGER REFERENCES user_profiles(id),
            phone_number VARCHAR(255) NOT NULL DEFAULT '',
            display_name VARCHAR(255),
            description TEXT NOT NULL DEFAULT '',
            currency_code CHAR(3) NOT NULL DEFAULT 'GBP' REFERENCES exchange_rates(currency_code),
            rate_min_hour DECIMAL(10,2) DEFAULT 20.00,
            rate_min_day DECIMAL(10,2) DEFAULT 120.00,
            tz VARCHAR(50) NOT NULL DEFAULT 'europe/london',
            work_inperson BOOLEAN DEFAULT TRUE,
            work_online BOOLEAN DEFAULT FALSE,
            work_photography BOOLEAN DEFAULT FALSE,
            work_seeks JSON NOT NULL DEFAULT '["nude", "portrait", "clothed", "underwear", "costume"]',
            social_urls JSON DEFAULT '[]',
            product_urls JSON DEFAULT '[]',
            date_birthday TIMESTAMP,
            date_experience TIMESTAMP,
            sex SMALLINT NOT NULL DEFAULT 0,
            pronouns VARCHAR(50) NOT NULL DEFAULT ''
        )
    `;
    console.log('  ✅ Created: models');

    // 7. Events (Enums handled as strings/checks for simplicity in Node usually, but creating types here)
    await sql`DO $$ BEGIN
        CREATE TYPE frequency_enum AS ENUM ('adhoc', 'once', 'daily', 'weekly', 'biweekly', 'triweekly', 'monthly', 'quarterly', 'annually');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;`;

    await sql`DO $$ BEGIN
        CREATE TYPE week_day_enum AS ENUM ('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'unknown');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;`;

    await sql`
        CREATE TABLE events (
            id SERIAL PRIMARY KEY,
            venue_id INTEGER REFERENCES venues(id),
            host_user_id INTEGER NOT NULL REFERENCES user_profiles(id), -- Note: DBML relates strictly to user_profiles, but logical link is via hosts usually. DBML Says Ref: "events"."host_user_id" < "hosts"."user_profile_id"
            name VARCHAR(255) NOT NULL,
            description VARCHAR(255),
            images JSON NOT NULL DEFAULT '[]',
            frequency frequency_enum NOT NULL DEFAULT 'weekly',
            week_day week_day_enum NOT NULL DEFAULT 'unknown',
            pricing_table JSON NOT NULL DEFAULT '[]',
            pricing_text TEXT NOT NULL DEFAULT '',
            pricing_tags JSON NOT NULL DEFAULT '[]',
            pose_format TEXT NOT NULL DEFAULT 'Mixed poses: gesture, short, medium, long'
        )
    `;
    console.log('  ✅ Created: events');

    // 8. Calendar
    await sql`DO $$ BEGIN
        CREATE TYPE status_enum AS ENUM ('cancelled', 'closed', 'confirmed', 'noshow', 'opencall', 'pending');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;`;

    await sql`
        CREATE TABLE calendar (
            id SERIAL PRIMARY KEY,
            event_id INTEGER REFERENCES events(id),
            model_id INTEGER REFERENCES models(id),
            status status_enum,
            attendance_inperson INTEGER DEFAULT 0,
            attendance_online INTEGER DEFAULT 0,
            date_time TIMESTAMP,
            duration DECIMAL NOT NULL DEFAULT 2.0,
            pose_format TEXT
        )
    `;
    console.log('  ✅ Created: calendar');

    // 9. Tracking
    await sql`
        CREATE TABLE tracking (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            href VARCHAR(255) NOT NULL,
            timestamp TIMESTAMPTZ
        )
    `;
    console.log('  ✅ Created: tracking');

    console.log('\n✅ Database tables aligned with DBML!');
}

// ============================================================================
// STEP 2: SEED DATA
// ============================================================================

async function seedAdminUser() {
    console.log('\n👤 Creating admin user...');

    // 1. Create User
    const hash = hashPassword(ADMIN_USER.email, ADMIN_USER.password);
    const [user] = await sql`
        INSERT INTO users (email, password_hash, is_global_active, is_admin, date_created)
        VALUES (${ADMIN_USER.email}, ${hash}, ${ADMIN_USER.active}, TRUE, NOW())
        RETURNING id
    `;

    // 2. Create User Profile
    const [profile] = await sql`
        INSERT INTO user_profiles (user_id, fullname, handle, description, is_profile_active)
        VALUES (${user.id}, ${ADMIN_USER.fullname}, ${ADMIN_USER.handle}, 'Admin User', TRUE)
        RETURNING id
    `;

    console.log(`  ✅ Admin created: ${ADMIN_USER.email} (UID: ${user.id}, PID: ${profile.id})`);
    return { userId: user.id, profileId: profile.id };
}

async function importModels(records) {
    console.log('\n👤 Importing Models...');
    let imported = 0;
    const processedEmails = new Set();
    const BATCH_SIZE = 25;

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);
        if (i % 50 === 0) process.stdout.write('.');

        await Promise.all(batch.map(async (record) => {
            const isSpecial = isSpecialRecord(record.fullname);
            let email = record.email?.trim();
            if (!email) {
                if (isSpecial) email = generateSpecialEmail(record.fullname);
                else if (record.instagram) {
                    const handle = cleanInstagram(record.instagram);
                    email = `${handle.toLowerCase().replace(/[^a-z0-9]/g, '-')}@lifedrawing.art`;
                } else {
                    const slug = record.fullname.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '-');
                    email = `${slug}@lifedrawing.art`;
                }
            }
            if (!isSpecial && processedEmails.has(email)) return;
            processedEmails.add(email);

            // 1. Create User
            let userId;
            const existingUsers = await sql`SELECT id FROM users WHERE email = ${email}`;
            if (existingUsers.length > 0) {
                userId = existingUsers[0].id;
            } else {
                const tempPass = Math.random().toString(36).slice(-10);
                const hash = hashPassword(email, tempPass);
                const [newUser] = await sql`
                    INSERT INTO users (email, password_hash, is_global_active, is_admin, date_created)
                    VALUES (${email}, ${hash}, ${parseActive(record.hosted)}, FALSE, NOW())
                    RETURNING id
                `;
                userId = newUser.id;
            }

            // 2. User Profile
            let profileId;
            const existingProfile = await sql`SELECT id FROM user_profiles WHERE user_id = ${userId}`;
            if (existingProfile.length > 0) {
                profileId = existingProfile[0].id;
            } else {
                const handle = (record.instagram ? cleanInstagram(record.instagram) : record.fullname.replace(/\s+/g, '-')).toLowerCase();
                const [newProfile] = await sql`
                    INSERT INTO user_profiles (user_id, fullname, handle, description, is_profile_active)
                    VALUES (${userId}, ${record.fullname || 'Unknown'}, ${handle}, '', ${parseActive(record.hosted)})
                    RETURNING id
                `;
                profileId = newProfile.id;
            }

            // 3. Model
            const existingModel = await sql`SELECT id FROM models WHERE user_profile_id = ${profileId}`;
            if (existingModel.length === 0) {
                await sql`
                    INSERT INTO models (
                        user_profile_id, sex, work_seeks, social_urls, phone_number
                    ) VALUES (
                        ${profileId}, 
                        ${mapSex(record.sex)}, 
                        '["nude", "portrait"]',
                        ${record.instagram ? JSON.stringify([`https://instagram.com/${cleanInstagram(record.instagram)}`]) : '[]'},
                        ${record.phone || ''}
                    )
                `;
            }
            imported++;
        }));
    }
    console.log(`\n  ✅ Imported: ${imported} models`);
}

async function importVenuesAndEvents(records, adminProfileId) {
    console.log('\n🏛️  Importing Venues & Events...');
    const hostMap = new Map();
    let hostsCreated = 0, venuesCreated = 0, eventsCreated = 0;

    // 1. Hosts
    for (const record of records) {
        if (!hostMap.has(record.name)) {
            const existing = await sql`SELECT id FROM hosts WHERE name = ${record.name}`;
            if (existing.length > 0) {
                hostMap.set(record.name, existing[0].id);
            } else {
                const [newHost] = await sql`
                    INSERT INTO hosts (user_profile_id, name, description, currency_code, host_tags)
                    VALUES (${adminProfileId}, ${record.name}, ${HOST_DESCRIPTIONS[record.name] || ''}, 'GBP', '[]')
                    RETURNING id
                `;
                hostMap.set(record.name, newHost.id);
                hostsCreated++;
            }
        }
    }

    // 2. Venues & Events
    for (let i = 0; i < records.length; i++) {
        const record = records[i];
        const hostId = hostMap.get(record.name);

        // Check/Create Venue
        let venueId;
        const existingVenue = await sql`
            SELECT id FROM venues 
            WHERE name = ${record.name} -- Simple match for now, ideally better logic
            AND postcode = ${record.postcode || 'UNKNOWN'}
        `;

        if (existingVenue.length > 0) {
            venueId = existingVenue[0].id;
        } else {
            const [newVenue] = await sql`
                INSERT INTO venues (name, address_line_1, postcode, city, created_on, modified_on)
                VALUES (${record.name}, ${record.address || 'Unknown'}, ${record.postcode || 'UNKNOWN'}, 'London', NOW(), NOW())
                RETURNING id
            `;
            venueId = newVenue.id;
            venuesCreated++;
        }

        // Map frequency to enum
        let frequency = (record.frequency || 'weekly').toLowerCase();
        if (frequency === 'fortnightly') frequency = 'biweekly';
        // Add other mappings if necessary, or strict validation

        // Create Event
        await sql`
            INSERT INTO events (venue_id, host_user_id, name, frequency, week_day, pricing_text)
            VALUES (
                ${venueId}, 
                ${adminProfileId}, 
                ${record.name + ' Session'}, 
                ${frequency}, 
                'unknown', -- legacy data needs mapping to week_day_enum
                ${'In-person: ' + record.inperson + ', Online: ' + record.online} 
            )
        `;
        eventsCreated++;
    }

    console.log(`  ✅ Stats: ${hostsCreated} hosts, ${venuesCreated} venues, ${eventsCreated} events`);
}

async function importCalendar(records, adminProfileId) {
    console.log('\n📅 Importing Calendar (Simple)...');
    let imported = 0;

    // We need an event to link to. creating a Dummy "All Calendar Event" for the admin
    const [venue] = await sql`INSERT INTO venues (name, address_line_1) VALUES ('Virtual Calendar Venue', 'Online') RETURNING id`;
    const [event] = await sql`INSERT INTO events (venue_id, host_user_id, name) VALUES (${venue.id}, ${adminProfileId}, 'Legacy Calendar Import') RETURNING id`;

    const BATCH_SIZE = 50;
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);
        if (i % 100 === 0) process.stdout.write('.');

        await Promise.all(batch.map(async (record) => {
            const cleanedName = record.fullname.replace(/\(TBC\)/gi, '').trim();
            if (!cleanedName) return;

            // Find model by profile fullname (rough match)
            const [profile] = await sql`SELECT id FROM user_profiles WHERE LOWER(fullname) = LOWER(${cleanedName}) LIMIT 1`;
            if (!profile) return;

            const [model] = await sql`SELECT id FROM models WHERE user_profile_id = ${profile.id} LIMIT 1`;
            if (!model) return;

            const date = parseDate(record.date);
            if (!date) return;

            await sql`
                INSERT INTO calendar (
                    event_id, model_id, date_time, attendance_inperson, attendance_online, duration, status
                ) VALUES (
                    ${event.id}, ${model.id}, ${date}::timestamp, 
                    ${parseInt(record.inperson || '0')}, ${parseInt(record.online || '0')}, 
                    ${parseDuration(record.duration)}, 
                    'pending'
                )
            `;
            imported++;
        }));
    }
    console.log(`\n  ✅ Imported: ${imported} calendar entries`);
}

// ============================================================================
// MAIN
// ============================================================================

async function run() {
    try {
        await resetDatabase();
        const { userId, profileId } = await seedAdminUser();

        const rawData = fs.readFileSync('./docs/google-export/database.json', 'utf8');
        const data = JSON.parse(rawData);

        await importModels(data.models.records);
        await importVenuesAndEvents(data.venues.records, profileId);
        await importCalendar(data.calendar.records, profileId);

        console.log('\n✅ Full reset and import aligned with DBML successful!');
        process.exit(0);
    } catch (e) {
        console.error('\n❌ Error:', e);
        process.exit(1);
    }
}

run();
