
import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { createHash } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config();

const DATABASE_URL = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
const sql = neon(DATABASE_URL);

// --- HELPERS ---
function slugify(text) {
    if (!text) return 'unknown-' + Math.floor(Math.random() * 10000);
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '').replace(/-+$/, '');
}

function hashPassword(pwd) {
    return createHash('sha256').update(pwd).digest('hex');
}

function normalizePostcode(pc) {
    if (!pc) return '';
    return pc.toUpperCase().replace(/\s+/g, '');
}

function parseLegacyDate(dateStr) {
    try {
        const clean = dateStr.trim();
        const dt = new Date(clean);
        if (isNaN(dt.getTime())) return null;
        return dt;
    } catch { return null; }
}

function convertSocialsToArray(obj, legacyUrl) {
    const urls = [];
    if (obj?.instagram) {
        let handle = obj.instagram;
        if (handle.startsWith('http')) urls.push(handle);
        else urls.push(`https://instagram.com/${handle.replace('@', '')}`);
    }
    if (legacyUrl && legacyUrl.startsWith('http')) {
        urls.push(legacyUrl);
    }
    return JSON.stringify(urls);
}

async function runETL() {
    console.log('🚀 Starting Final Platform ETL (Schema 3.0 + Enriched Profiles)...');

    try {
        // 1. Reset Schema
        console.log('\n🗑️  Resetting Schema...');
        await sql`DROP TABLE IF EXISTS tracking CASCADE`;
        await sql`DROP TABLE IF EXISTS calendar CASCADE`;
        await sql`DROP TABLE IF EXISTS events CASCADE`;
        await sql`DROP TABLE IF EXISTS hosts CASCADE`;
        await sql`DROP TABLE IF EXISTS models CASCADE`;
        await sql`DROP TABLE IF EXISTS venues CASCADE`;
        await sql`DROP TABLE IF EXISTS user_profiles CASCADE`;
        await sql`DROP TABLE IF EXISTS users CASCADE`;
        await sql`DROP TABLE IF EXISTS exchange_rates CASCADE`;
        await sql`DROP TYPE IF EXISTS status_enum CASCADE`;
        await sql`DROP TYPE IF EXISTS frequency_enum CASCADE`;
        await sql`DROP TYPE IF EXISTS week_day_enum CASCADE`;

        const schemaPath = path.join(__dirname, '../docs/neon-platform-schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
        const statements = schemaSql.split(/;\s*$/m).filter(s => s.trim().length > 0);

        for (const stmt of statements) {
            try { await sql(stmt); }
            catch (e) { console.warn(`Warning on schema stmt: ${e.message.split('\n')[0]}`); }
        }
        console.log('✅ Schema Applied.');


        // 2. Exchange Rates
        await sql`INSERT INTO exchange_rates (currency_code, rate_to_usd) VALUES ('USD', 1.0), ('GBP', 1.25), ('EUR', 1.05) ON CONFLICT DO NOTHING`;


        // 3. Load Data Files
        const dbJsonPath = path.join(__dirname, '../docs/google-export/database.json');
        const venuesJsonPath = path.join(__dirname, '../docs/venues.json');
        const descPath = path.join(__dirname, '../docs/db-seed-host-description.json');
        const profilesPath = path.join(__dirname, '../docs/db-seed-user-profiles.json');

        const rawDb = JSON.parse(fs.readFileSync(dbJsonPath, 'utf-8'));
        const rawVenues = JSON.parse(fs.readFileSync(venuesJsonPath, 'utf-8'));

        // Load Enriched Data
        let hostDescriptions = new Map();
        let hostSummaries = new Map();
        try {
            const rawDesc = JSON.parse(fs.readFileSync(descPath, 'utf-8'));
            rawDesc.forEach(d => {
                const key = d.name.toLowerCase().trim();
                hostDescriptions.set(key, d.description);
                hostSummaries.set(key, d.summary);
            });
        } catch (e) {
            console.log('Info: No extra host descriptions found.');
        }

        let profileRealNames = new Map(); // handle -> fullname
        try {
            if (fs.existsSync(profilesPath)) {
                const rawProf = JSON.parse(fs.readFileSync(profilesPath, 'utf-8'));
                rawProf.forEach(p => {
                    if (p.handle && p.fullname) {
                        profileRealNames.set(p.handle.toLowerCase().trim(), p.fullname);
                    }
                });
            }
        } catch (e) {
            console.log('Info: No enriched user profiles found.');
        }

        const legacyEventRecords = rawDb.venues?.records || [];
        const modelRecords = rawDb.models?.records || [];
        const calendarRecords = rawDb.calendar?.records || [];


        // 4. Seed Venues
        console.log(`\n📍 Seeding ${rawVenues.length} curated Venues...`);
        const venuePostcodeMap = new Map();

        for (const v of rawVenues) {
            const [venue] = await sql`
                INSERT INTO venues (
                    name, address_line_1, address_line_2, city, county, postcode, area, 
                    active, tz, latitude, longitude, created_on, modified_on
                ) VALUES (
                    ${v.name}, ${v.address_line_1}, ${v.address_line_2}, 'London', ${v.county}, ${v.postcode}, ${v.address_area},
                    ${v.active}, ${v.timezone || 'europe/london'}, ${v.latitude}, ${v.longitude}, 
                    ${v.created_on ? new Date(v.created_on) : new Date()}, 
                    ${v.modified_on ? new Date(v.modified_on) : new Date()}
                ) RETURNING id
            `;
            if (v.postcode) {
                venuePostcodeMap.set(normalizePostcode(v.postcode), venue.id);
            }
        }


        // 5. Admin User & Host
        console.log('\n👑 Seeding Admin User (Bruce Thomas)...');
        const adminEmail = 'response.write@gmail.com';

        const [adminUser] = await sql`
            INSERT INTO users (email, password_hash, is_global_active, is_admin)
            VALUES (${adminEmail}, ${hashPassword('pa55word!')}, true, true)
            RETURNING id
        `;
        const [adminProfile] = await sql`
             INSERT INTO user_profiles (user_id, fullname, handle, flag_emoji)
             VALUES (${adminUser.id}, 'Bruce Thomas', 'bruce-thomas', '🇿🇦')
             RETURNING id
        `;

        // Admin Host Desc
        let adminDesc = hostDescriptions.get('life drawing art') || null;
        let adminSum = hostSummaries.get('life drawing art') || null;

        const [adminHost] = await sql`
             INSERT INTO hosts (user_profile_id, name, phone_number, description, summary, host_tags, social_urls)
             VALUES (
                ${adminProfile.id}, 
                'Life Drawing Art', 
                '07594616416', 
                ${adminDesc},
                ${adminSum},
                '["Life Drawing"]',
                '["https://instagram.com/lifedrawing.art","https://lifedrawing.art"]'
             )
             RETURNING id
        `;

        // Admin Event
        let adminEventId = null;
        {
            const hid = venuePostcodeMap.get(normalizePostcode('E9 6AS'));
            const [evt] = await sql`
                INSERT INTO events (venue_id, host_user_id, name, description, frequency, week_day, pricing_table)
                VALUES (
                    ${hid}, 
                    ${adminProfile.id}, 
                    'Life Drawing Art Weekly', 
                    'Weekly Life Drawing Sessions', 
                    'weekly', 
                    'thursday',
                    '["General Admission", 10.00]'
                )
                RETURNING id
             `;
            adminEventId = evt.id;
        }


        // 6. Process Legacy Hosts
        console.log(`\n🏢 Processing ${legacyEventRecords.length} legacy hosts...`);
        const hostNameMap = new Map();
        hostNameMap.set('Life Drawing Art', adminHost.id);

        for (const rec of legacyEventRecords) {
            const hostName = rec.name;
            if (!hostName || hostName.toLowerCase().includes('closed')) continue;
            if (hostName === 'Life Drawing Art') continue;

            // Create Host
            let hostId = hostNameMap.get(hostName);
            if (!hostId) {
                const handle = slugify(hostName);

                // Lookup Real Name
                let realName = hostName;
                if (profileRealNames.has(handle)) {
                    realName = profileRealNames.get(handle);
                }

                const email = `${handle}@placeholder.neon`;

                let [u] = await sql`INSERT INTO users (email, password_hash, is_global_active) VALUES (${email}, 'placeholder', true) ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email RETURNING id`;
                let [p] = await sql`INSERT INTO user_profiles (user_id, fullname, handle) VALUES (${u.id}, ${realName}, ${handle}) RETURNING id`;

                const socUrls = convertSocialsToArray({ instagram: rec.instagram }, rec.href);
                const tags = rec.tag ? JSON.stringify([rec.tag]) : '[]';

                let desc = rec.comments || '';
                let summary = null;
                const enrichedDesc = hostDescriptions.get(hostName.toLowerCase().trim());
                if (enrichedDesc) {
                    desc = enrichedDesc;
                    summary = hostSummaries.get(hostName.toLowerCase().trim()) || null;
                }

                let [h] = await sql`
                    INSERT INTO hosts (user_profile_id, name, description, summary, social_urls, host_tags)
                    VALUES (${p.id}, ${hostName}, ${desc}, ${summary}, ${socUrls}, ${tags})
                    RETURNING id
                `;
                hostId = h.id;
                hostNameMap.set(hostName, hostId);
            }

            // Venue
            let venueId = null;
            if (rec.postcode) {
                venueId = venuePostcodeMap.get(normalizePostcode(rec.postcode));
            }
            if (!venueId && rec.address) {
                const [newV] = await sql`
                    INSERT INTO venues (name, address_line_1, city, postcode, active, tz)
                    VALUES (${hostName + ' Venue'}, ${rec.address}, 'London', ${rec.postcode || 'UNKNOWN'}, true, 'europe/london')
                    RETURNING id
                `;
                venueId = newV.id;
            }

            // Event
            let freq = 'weekly';
            if (rec.frequency && rec.frequency.includes('month')) freq = 'monthly';
            let wday = 'unknown';
            if (rec.day) {
                const d = rec.day.toLowerCase().trim();
                const valid = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                if (valid.includes(d)) wday = d;
            }
            const pricing = rec.inperson ? JSON.stringify(["General Admission", parseInt(rec.inperson)]) : '[]';

            await sql`
                INSERT INTO events (
                    venue_id, host_user_id, name, description, frequency, week_day, pricing_table
                ) VALUES (
                    ${venueId}, ${hostId}, 
                    ${hostName}, 
                    ${rec.comments}, ${freq}, ${wday},
                    ${pricing}
                )
            `;
        }


        // 7. Migrate Models
        console.log(`\n👤 Migrating Models...`);
        const modelNameMap = new Map();

        for (const rec of modelRecords) {
            if (!rec.email || !rec.fullname) continue;
            const handle = slugify(rec.fullname);
            const ex = await sql`SELECT id FROM users WHERE email = ${rec.email}`;
            if (ex.length > 0) continue;

            const [u] = await sql`INSERT INTO users (email, password_hash) VALUES (${rec.email}, 'legacy') RETURNING id`;
            const [p] = await sql`INSERT INTO user_profiles (user_id, fullname, handle, date_created) VALUES (${u.id}, ${rec.fullname}, ${handle}, ${rec.dateAdded || new Date()}) RETURNING id`;

            const socUrls = convertSocialsToArray({ instagram: rec.instagram }, null);

            const [m] = await sql`
                INSERT INTO models (
                    user_profile_id, display_name, phone_number, description, currency_code, 
                    social_urls, sex, date_birthday, tz
                ) VALUES (
                    ${p.id}, ${rec.fullname}, ${rec.phone || ''}, ${rec.notes || ''}, 'GBP',
                    ${socUrls}, 
                    ${rec.sex === 'm' ? 1 : rec.sex === 'f' ? 2 : 0},
                    ${rec.dob ? new Date(rec.dob) : null},
                    'europe/london'
                ) RETURNING id
            `;
            modelNameMap.set(rec.fullname.trim(), m.id);
        }


        // 8. Migrate Calendar
        console.log(`\n🗓️ Migrating Calendar...`);
        let sessions = 0;

        for (const cal of calendarRecords) {
            if (!cal.fullname || (cal.pk && cal.pk.includes('available'))) continue;
            const rawName = cal.fullname.trim();
            if (!rawName) continue;

            let modelId = null;
            let status = 'confirmed';

            if (rawName.toLowerCase().includes('closed')) {
                status = 'closed';
                modelId = null;
            } else if (rawName.includes('(TBC)')) {
                status = 'opencall';
                modelId = modelNameMap.get(rawName.replace('(TBC)', '').trim()) || null;
            } else {
                modelId = modelNameMap.get(rawName);
            }
            if (!modelId && status !== 'closed' && status !== 'opencall') {
                status = 'closed';
            }
            if (status === 'closed') modelId = null;

            const dt = parseLegacyDate(cal.date);
            if (!dt) continue;
            let startHour = parseInt(cal.start) || 19;
            dt.setHours(startHour, 0, 0, 0);

            await sql`
                INSERT INTO calendar (
                    event_id, model_id, status, 
                    attendance_inperson, attendance_online, 
                    date_time, duration
                ) VALUES (
                    ${adminEventId}, ${modelId}, ${status},
                    ${parseInt(cal.inperson) || 0}, ${parseInt(cal.online) || 0}, 
                    ${dt}, ${parseFloat(cal.duration) || 2.5}
                )
            `;
            sessions++;
        }

        console.log(`✅ Created ${sessions} sessions.`);
        console.log('\n🎉 Final ETL Complete!');

    } catch (err) {
        console.error('❌ ETL Failed:', err);
        process.exit(1);
    }
}

runETL();
