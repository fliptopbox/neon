import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import crypto from 'crypto';

const sql = neon(process.env.DATABASE_URL);

// ============================================================================
// CONFIGURATION - Admin user details
// ============================================================================
const ADMIN_USER = {
    email: 'response.write@gmail.com',
    password: 'pa55word!',
    fullname: 'Bruce Thomas',
    active: 1,
    confirmed: true
};

// Host descriptions based on research
const HOST_DESCRIPTIONS = {
    'Life Drawing Art': 'Community-focused life drawing sessions in East London, offering weekly classes with professional models in a relaxed, supportive atmosphere.',
    'London Drawing': 'Established life drawing organization running multiple sessions across central London venues.',
    'Adrian Dutton Life Drawing': 'Professional life drawing sessions led by experienced artist Adrian Dutton across multiple East London locations.',
    'Covent Garden Life Drawing': 'Central London life drawing sessions in the heart of the West End.',
    'North London Life Drawing': 'Community life drawing group serving North London areas.',
    'Soho Life Drawing': 'Life drawing sessions in central Soho.',
    'Art of Isolation': 'Online and in-person life drawing sessions offering flexible drawing opportunities.',
    'Heskith Hubbard Art Society': 'Historic London art society founded in 1920, offering regular life drawing sessions near Trafalgar Square.',
    'Life Drawing at the Estorick': 'Life drawing sessions at the Estorick Collection of Modern Italian Art in Islington.',
    'London Bridge Life Drawing': 'Life drawing sessions in the London Bridge area.',
    'Camberwell Life Drawing': 'Community life drawing group in South London\'s Camberwell area.',
    'Hampstead Life Drawing': 'Life drawing sessions in the artistic Hampstead area of North London.',
    'Leytonstone Life Drawing': 'East London life drawing group offering regular sessions in Leytonstone.',
    'Kilburn Life Drawing': 'Community-focused life drawing sessions in Kilburn, North West London.',
    'Thamesmead Life Drawing': 'Life drawing sessions serving the Thamesmead and Abbey Wood areas.',
    'Bare Life Drawing': 'Life drawing sessions in South London.',
    'Croydon Life Drawing Group': 'Community art group in Croydon offering regular life drawing sessions.',
    'Love2Sketch': 'Life drawing and sketching sessions in West London.',
    'Scottish Borders Life Drawing': 'Online life drawing sessions accessible to artists across the UK.',
    'Beehive Pub Tottenham': 'Pub-based life drawing sessions in Tottenham.',
    'Ciro\'s Life Drawing': 'Life drawing sessions in Islington, North London.',
    'East London Sbtripper Collective (ELSC)': 'Alternative art collective in Shoreditch offering life drawing sessions.',
    'London Art Drawing': 'Life drawing sessions in North London.',
    'Sevenoaks Drawing Group': 'Community art group in Sevenoaks, Kent.',
    'Stone Life Drawing': 'Life drawing sessions in East London.',
    '2b Or not 2b': 'Creative drawing sessions in Soho.',
    'Drink & Draw at The Grosvenor W7': 'Social life drawing sessions at The Grosvenor pub in Ealing.',
    'Life Drawing at Jazzbourne': 'Unique life drawing sessions combining figure drawing with live jazz music.',
    'Life Drawing with Anna at Artinc': 'Life drawing classes led by Anna at Artinc studio in Isleworth.',
    'Mandie Wilde': 'Life drawing sessions organized by artist Mandie Wilde in West London.',
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Password hashing using SHA-256 (matching auth route)
function hashPassword(email, password) {
    const tokenSalt = email.trim().toLowerCase() + ':' + password;
    return crypto.createHash('sha256').update(tokenSalt).digest('hex');
}

function mapSex(sexValue) {
    if (!sexValue || sexValue === '') return 0;
    if (sexValue.toLowerCase() === 'm') return 1;
    if (sexValue.toLowerCase() === 'f') return 2;
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
    if (!hostedValue || hostedValue === '-' || hostedValue === 'x' || hostedValue.toLowerCase() === 'x') return 0;
    const asNumber = parseFloat(hostedValue);
    // If it's a valid number (including 0), set active to 1
    return !isNaN(asNumber) ? 1 : 0;
}

function parseWebsites(websiteValue) {
    if (!websiteValue || websiteValue.trim() === '') return null;
    return JSON.stringify([websiteValue.trim()]);
}

const dayMap = { 'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5, 'saturday': 6 };

function parseTime(timeStr) {
    if (!timeStr) return '19:00:00';
    const match = timeStr.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)?/i);
    if (!match) return '19:00:00';
    let hours = parseInt(match[1]);
    const minutes = match[2] || '00';
    const ampm = match[3];
    if (ampm && ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
    else if (ampm && ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
    // Convert AM times (before 11:00) to PM
    if (hours < 11) hours += 12;
    return `${hours.toString().padStart(2, '0')}:${minutes}:00`;
}

function parsePrice(priceStr) {
    if (!priceStr || priceStr.trim() === '') return 0;
    if (priceStr.toLowerCase().includes('eventrite') || priceStr.toLowerCase().includes('donation') || priceStr.toLowerCase() === 'false') return 0;
    const match = priceStr.match(/£?(\d+)\.?(\d{0,2})/);
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
    return instagram.replace(/^@/, '');
}

function parseTags(tagStr) {
    if (!tagStr || tagStr === 'FALSE') return null;
    const tags = tagStr.split(';').map(t => t.trim()).filter(t => t.length > 0);
    return tags.length > 0 ? tags.join(',') : null;
}

function isVenueActive(comments, attended) {
    const lowerComments = (comments || '').toLowerCase();
    const lowerAttended = (attended || '').toLowerCase();
    return !(lowerComments === 'closed' || lowerAttended === 'closed');
}

function parseDate(dateStr) {
    if (!dateStr) return null;
    const parts = dateStr.trim().replace(/,/g, '').split(/\s+/);
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

function parseAttendance(countStr) {
    if (!countStr || countStr === '') return 0;
    const num = parseInt(countStr);
    return isNaN(num) ? 0 : num;
}

function cleanFullname(fullname) {
    if (!fullname) return '';
    return fullname.replace(/\(TBC\)/gi, '').replace(/\(OPEN CALL\)/gi, '').trim();
}

// ============================================================================
// STEP 1: DROP AND RECREATE TABLES
// ============================================================================

async function resetDatabase() {
    console.log('\n🗑️  Resetting database...\n');

    // Drop venue-related tables
    await sql`DROP TABLE IF EXISTS sessions CASCADE`;
    console.log('  ✅ Dropped: sessions');
    await sql`DROP TABLE IF EXISTS venues CASCADE`;
    console.log('  ✅ Dropped: venues');
    await sql`DROP TABLE IF EXISTS hosts CASCADE`;
    console.log('  ✅ Dropped: hosts');

    // Truncate other tables
    await sql`TRUNCATE TABLE calendar CASCADE`;
    console.log('  ✅ Truncated: calendar');
    await sql`TRUNCATE TABLE models CASCADE`;
    console.log('  ✅ Truncated: models');
    await sql`TRUNCATE TABLE user_bios CASCADE`;
    console.log('  ✅ Truncated: user_bios');
    await sql`TRUNCATE TABLE users CASCADE`;
    console.log('  ✅ Truncated: users');

    // Create hosts table
    await sql`
        CREATE TABLE hosts (
            id BIGSERIAL PRIMARY KEY,
            user_id BIGINT NOT NULL REFERENCES users(id),
            name VARCHAR(255) NOT NULL UNIQUE,
            description TEXT,
            instagram VARCHAR(255),
            website VARCHAR(500),
            active SMALLINT DEFAULT 1,
            created_on TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
            modified_on TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
        )
    `;
    console.log('  ✅ Created: hosts');

    // Create venues table
    await sql`
        CREATE TABLE venues (
            id BIGSERIAL PRIMARY KEY,
            host_id BIGINT NOT NULL REFERENCES hosts(id),
            address TEXT,
            postcode VARCHAR(20),
            area VARCHAR(100),
            timezone VARCHAR(50) DEFAULT 'GMT',
            active SMALLINT DEFAULT 1,
            created_on TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
            modified_on TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
        )
    `;
    await sql`CREATE UNIQUE INDEX venues_unique_location ON venues(host_id, COALESCE(address, ''), COALESCE(postcode, ''))`;
    console.log('  ✅ Created: venues');

    // Create sessions table
    await sql`
        CREATE TABLE sessions (
            id BIGSERIAL PRIMARY KEY,
            venue_id BIGINT NOT NULL REFERENCES venues(id),
            week_day SMALLINT,
            start_time TIME NOT NULL,
            duration NUMERIC NOT NULL,
            frequency VARCHAR(50) DEFAULT 'weekly',
            price_inperson INTEGER DEFAULT 0,
            price_online INTEGER DEFAULT 0,
            tags TEXT,
            active SMALLINT DEFAULT 1,
            created_on TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
            modified_on TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
        )
    `;
    console.log('  ✅ Created: sessions');

    // Add venue_id to calendar if it doesn't exist
    const columnCheck = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'calendar' AND column_name = 'venue_id'
    `;

    if (columnCheck.length === 0) {
        await sql`ALTER TABLE calendar ADD COLUMN venue_id BIGINT REFERENCES venues(id)`;
        console.log('  ✅ Added: calendar.venue_id');
    } else {
        console.log('  ⏭️  calendar.venue_id already exists');
    }

    console.log('\n✅ Database reset complete!\n');
}

// ============================================================================
// STEP 2: SEED ADMIN USER
// ============================================================================

async function seedAdminUser() {
    console.log('👤 Creating admin user...\n');
    const passwordHash = hashPassword(ADMIN_USER.email, ADMIN_USER.password);
    const userResult = await sql`
        INSERT INTO users (emailaddress, password, active, confirmed_on, is_admin)
        VALUES (${ADMIN_USER.email}, ${passwordHash}, ${ADMIN_USER.active}, ${ADMIN_USER.confirmed ? new Date() : null}, TRUE)
        RETURNING id
    `;
    const userId = userResult[0].id;
    await sql`INSERT INTO user_bios (user_id, fullname) VALUES (${userId}, ${ADMIN_USER.fullname})`;
    console.log(`  ✅ Admin: ${ADMIN_USER.email} (ID: ${userId})\n`);
    return userId;
}

// ============================================================================
// STEP 3: IMPORT MODELS
// ============================================================================

async function importModels(records) {
    console.log('👤 Importing Models...\n');
    let imported = 0, skipped = 0;
    const processedEmails = new Set();

    for (const record of records) {
        const isSpecial = isSpecialRecord(record.fullname);
        let email = record.email?.trim();

        if (!email) {
            if (isSpecial) {
                email = generateSpecialEmail(record.fullname);
            } else if (record.instagram && record.instagram.trim()) {
                const instagramHandle = cleanInstagram(record.instagram.trim());
                email = `${instagramHandle.toLowerCase().replace(/[^a-z0-9]/g, '-')}@lifedrawing.art`;
            } else {
                const slug = record.fullname.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '-');
                email = `${slug}@lifedrawing.art`;
            }
        }

        if (!isSpecial && processedEmails.has(email)) { skipped++; continue; }

        const existingUser = await sql`SELECT id FROM users WHERE emailaddress = ${email}`;
        let userId;

        if (existingUser.length > 0) {
            userId = existingUser[0].id;
        } else {
            const randomPassword = Math.random().toString(36).slice(-12);
            const passwordHash = hashPassword(email, randomPassword);
            const userResult = await sql`
                INSERT INTO users (emailaddress, password, active, confirmed_on)
                VALUES (${email}, ${passwordHash}, ${parseActive(record.hosted)}, ${record.confirmed === '2' ? new Date() : null})
                RETURNING id
            `;
            userId = userResult[0].id;
        }

        const existingBio = await sql`SELECT id FROM user_bios WHERE user_id = ${userId}`;
        if (existingBio.length === 0) {
            await sql`INSERT INTO user_bios (user_id, fullname, instagram, websites, phone) VALUES (${userId}, ${record.fullname || ''}, ${record.instagram || null}, ${parseWebsites(record.website)}, ${record.phone || null})`;
        }

        await sql`
            INSERT INTO models (user_id, sex, instagram, portrait, account_holder, account_number, account_sortcode, active)
            VALUES (${userId}, ${mapSex(record.sex)}, ${record.instagram || ''}, ${record.portrait || ''}, ${record.account_holder || null}, ${record.account || null}, ${record.sortcode || null}, ${parseActive(record.hosted)})
        `;

        processedEmails.add(email);
        imported++;
    }

    console.log(`  ✅ Imported: ${imported} models\n`);
    return { imported, skipped };
}

// ============================================================================
// STEP 4: IMPORT VENUES (as hosts, venues, sessions)
// ============================================================================

async function importVenues(records, adminUserId) {
    console.log('🏛️  Importing Venues (hosts, venues, sessions)...\n');
    const hostMap = new Map();
    const venueMap = new Map();
    let hostsCreated = 0, venuesCreated = 0, sessionsCreated = 0;

    // Create hosts
    for (const record of records) {
        if (!hostMap.has(record.name)) {
            const existing = await sql`SELECT id FROM hosts WHERE name = ${record.name}`;
            if (existing.length > 0) {
                hostMap.set(record.name, existing[0].id);
            } else {
                const description = HOST_DESCRIPTIONS[record.name] || 'Life drawing sessions in London.';
                const result = await sql`
                    INSERT INTO hosts (user_id, name, description, instagram, website, active)
                    VALUES (${adminUserId}, ${record.name}, ${description}, ${record.instagram || null}, ${record.website || null}, 1)
                    RETURNING id
                `;
                hostMap.set(record.name, result[0].id);
                hostsCreated++;
            }
        }
    }

    // Create venues
    for (let i = 0; i < records.length; i++) {
        const record = records[i];
        const hostId = hostMap.get(record.name);
        const existing = await sql`
            SELECT id FROM venues 
            WHERE host_id = ${hostId} 
            AND COALESCE(address, '') = COALESCE(${record.address || null}, '')
            AND COALESCE(postcode, '') = COALESCE(${record.postcode || null}, '')
        `;

        if (existing.length > 0) {
            venueMap.set(i, existing[0].id);
        } else {
            const result = await sql`
                INSERT INTO venues (host_id, address, postcode, area, timezone, active)
                VALUES (${hostId}, ${record.address || null}, ${record.postcode || null}, ${record.area || null}, ${record.timezone || 'GMT'}, 1)
                RETURNING id
            `;
            venueMap.set(i, result[0].id);
            venuesCreated++;
        }
    }

    // Create sessions
    for (let i = 0; i < records.length; i++) {
        const record = records[i];
        const venueId = venueMap.get(i);
        await sql`
            INSERT INTO sessions (venue_id, week_day, start_time, duration, frequency, price_inperson, price_online, tags, active)
            VALUES (${venueId}, ${parseInt(record.dayno) % 7}, ${parseTime(record.time)}, ${parseDuration(record.duration)}, ${record.frequency || 'weekly'}, ${parsePrice(record.inperson)}, ${parsePrice(record.online)}, ${parseTags(record.tag)}, ${isVenueActive(record.comments, record.attended) ? 1 : 0})
        `;
        sessionsCreated++;
    }

    console.log(`  ✅ Hosts: ${hostsCreated}, Venues: ${venuesCreated}, Sessions: ${sessionsCreated}\n`);
    return { hosts: hostsCreated, venues: venuesCreated, sessions: sessionsCreated };
}

// ============================================================================
// STEP 5: IMPORT CALENDAR
// ============================================================================

async function importCalendar(records) {
    console.log('📅 Importing Calendar...\n');
    let imported = 0, skipped = 0;

    // Get the Life Drawing Art venue
    const venueResult = await sql`
        SELECT v.id 
        FROM venues v 
        JOIN hosts h ON v.host_id = h.id 
        WHERE h.name = 'Life Drawing Art' 
        LIMIT 1
    `;

    if (venueResult.length === 0) {
        console.log('  ⚠️  Life Drawing Art venue not found, skipping calendar import\n');
        return { imported: 0, skipped: records.length };
    }
    const lifeDrawingArtVenueId = venueResult[0].id;
    console.log(`  ℹ️  Using Life Drawing Art venue (ID: ${lifeDrawingArtVenueId})\n`);

    for (const record of records) {
        const isTBC = record.fullname && record.fullname.includes('(TBC)');
        const cleanedName = cleanFullname(record.fullname);

        if (!cleanedName || cleanedName === '' || cleanedName.includes('Available')) {
            skipped++;
            continue;
        }

        const userBio = await sql`SELECT user_id FROM user_bios WHERE LOWER(fullname) = LOWER(${cleanedName}) LIMIT 1`;
        if (userBio.length === 0) { skipped++; continue; }

        const userId = userBio[0].user_id;
        const eventDate = parseDate(record.date);
        if (!eventDate) { skipped++; continue; }

        await sql`
            INSERT INTO calendar (user_id, venue_id, date, attendance_inperson, attendance_online, start, duration, notes, tbc)
            VALUES (${userId}, ${lifeDrawingArtVenueId}, ${eventDate}, ${parseAttendance(record.inperson)}, ${parseAttendance(record.online)}, ${parseStartTime(record.start)}, ${parseDuration(record.duration)}, ${record.notes || null}, ${isTBC ? 1 : 0})
        `;
        imported++;
    }

    console.log(`  ✅ Imported: ${imported} calendar entries\n`);
    return { imported, skipped };
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

async function fullResetAndImport() {
    try {
        console.log('╔═══════════════════════════════════════════════════╗');
        console.log('║     FULL DATABASE RESET AND IMPORT FROM JSON      ║');
        console.log('╚═══════════════════════════════════════════════════╝');

        await resetDatabase();
        const adminUserId = await seedAdminUser();

        const data = JSON.parse(fs.readFileSync('./docs/google-export/database.json', 'utf8'));

        const modelStats = await importModels(data.models.records);
        const venueStats = await importVenues(data.venues.records, adminUserId);
        const calendarStats = await importCalendar(data.calendar.records);

        console.log('╔═══════════════════════════════════════════════════╗');
        console.log('║                 IMPORT COMPLETE                   ║');
        console.log('╚═══════════════════════════════════════════════════╝\n');
        console.log(`✅ Models: ${modelStats.imported}`);
        console.log(`✅ Hosts: ${venueStats.hosts}`);
        console.log(`✅ Venues: ${venueStats.venues}`);
        console.log(`✅ Sessions: ${venueStats.sessions}`);
        console.log(`✅ Calendar: ${calendarStats.imported}\n`);

    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    }
}

fullResetAndImport();
