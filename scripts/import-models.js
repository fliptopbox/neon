import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import crypto from 'crypto';

const sql = neon(process.env.DATABASE_URL);

// Generate random password hash
function generatePasswordHash() {
  const randomPassword = crypto.randomBytes(16).toString('hex');
  // For now, just return a bcrypt-like hash placeholder
  // In production, you'd use bcrypt.hashSync(randomPassword, 10)
  return `$2b$10$${crypto.randomBytes(32).toString('hex').substring(0, 53)}`;
}

// Map sex values
function mapSex(sexValue) {
  if (!sexValue || sexValue === '') return 0;
  if (sexValue.toLowerCase() === 'm') return 1;
  if (sexValue.toLowerCase() === 'f') return 2;
  return 0;
}

// Generate email for special records
function generateSpecialEmail(fullname) {
  const slug = fullname
    .toLowerCase()
    .replace(/[⛔⚠️]/g, '')
    .replace(/\(.*?\)/g, '')
    .trim()
    .replace(/\s+/g, '-');
  return `${slug}@lifedrawing.art`;
}

// Check if record is a special utility user
function isSpecialRecord(fullname) {
  const specialNames = ['closed', 'multiple models', 'unconfirmed'];
  const normalized = fullname.toLowerCase().replace(/[⛔⚠️()]/g, '').trim();
  return specialNames.some(name => normalized.includes(name));
}

// Check if hosted value is numeric (active = 1) or not (active = 0)
function parseActive(hostedValue) {
  if (!hostedValue || hostedValue === '-' || hostedValue === 'x') return 0;
  const asNumber = parseFloat(hostedValue);
  return !isNaN(asNumber) && asNumber > 0 ? 1 : 0;
}

// Parse website to JSON array
function parseWebsites(websiteValue) {
  if (!websiteValue || websiteValue.trim() === '') return null;
  return JSON.stringify([websiteValue.trim()]);
}

async function importModels() {
  try {
    console.log('Starting models import...\n');

    // Read the models JSON file
    const data = JSON.parse(fs.readFileSync('./docs/google-export/models.json', 'utf8'));

    let imported = 0;
    let skipped = 0;
    let errors = 0;
    const processedEmails = new Set();

    for (const record of data.records) {
      try {
        // Skip if no email (unless it's a special record)
        const isSpecial = isSpecialRecord(record.fullname);
        let email = record.email?.trim();

        if (!email && !isSpecial) {
          console.log(`⏭️  Skipping (no email): ${record.fullname}`);
          skipped++;
          continue;
        }

        // Generate email for special records
        if (isSpecial) {
          email = generateSpecialEmail(record.fullname);
        }

        // Check for duplicates (skip non-special duplicates)
        if (!isSpecial && processedEmails.has(email)) {
          console.log(`⏭️  Skipping duplicate email: ${record.fullname} (${email})`);
          skipped++;
          continue;
        }

        // Check if user already exists
        const existingUser = await sql`
          SELECT id FROM users WHERE emailaddress = ${email}
        `;

        let userId;

        if (existingUser.length > 0) {
          userId = existingUser[0].id;
          console.log(`   Using existing user: ${email}`);
        } else {
          // Create user
          const userResult = await sql`
            INSERT INTO users (emailaddress, password, active, confirmed_on)
            VALUES (
              ${email},
              ${generatePasswordHash()},
              ${parseActive(record.hosted)},
              ${record.confirmed === '2' ? new Date() : null}
            )
            RETURNING id
          `;
          userId = userResult[0].id;
        }

        // Create user_bio
        const existingBio = await sql`
          SELECT id FROM user_bios WHERE user_id = ${userId}
        `;

        if (existingBio.length === 0) {
          await sql`
            INSERT INTO user_bios (user_id, fullname, instagram, websites)
            VALUES (
              ${userId},
              ${record.fullname || ''},
              ${record.instagram || null},
              ${parseWebsites(record.website)}
            )
          `;
        }

        // Check if model already exists
        const existingModel = await sql`
          SELECT id FROM models WHERE user_id = ${userId}
        `;

        if (existingModel.length > 0) {
          console.log(`⏭️  Skipping (model exists): ${record.fullname}`);
          skipped++;
          continue;
        }

        // Create model
        await sql`
          INSERT INTO models (
            user_id, sex, instagram, portrait, 
            account_holder, account_number, account_sortcode, active
          )
          VALUES (
            ${userId},
            ${mapSex(record.sex)},
            ${record.instagram || ''},
            ${record.portrait || ''},
            ${record.account_holder || null},
            ${record.account || null},
            ${record.sortcode || null},
            ${parseActive(record.hosted)}
          )
        `;

        processedEmails.add(email);
        console.log(`✅ Imported: ${record.fullname} (${email}) - Active: ${parseActive(record.hosted)}`);
        imported++;

      } catch (error) {
        console.error(`❌ Error importing "${record.fullname}":`, error.message);
        errors++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`Import Summary:`);
    console.log(`  ✅ Imported: ${imported}`);
    console.log(`  ⏭️  Skipped:  ${skipped}`);
    console.log(`  ❌ Errors:   ${errors}`);
    console.log(`  📊 Total:    ${data.records.length}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

importModels();
