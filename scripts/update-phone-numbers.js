import { readFileSync } from 'fs';
import { neon } from '@neondatabase/serverless';

// Read the database.json file
const dbData = JSON.parse(readFileSync('./docs/google-export/database.json', 'utf8'));
const models = dbData.models.records;

// Get database connection
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function updatePhoneNumbers() {
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  console.log(`Processing ${models.length} models from database.json...`);

  for (const model of models) {
    const { email, phone, fullname } = model;

    if (!email) {
      console.log(`Skipping model without email: ${fullname}`);
      skipped++;
      continue;
    }

    // Skip if no phone number
    if (!phone || phone === '') {
      skipped++;
      continue;
    }

    try {
      // First check if user exists in user_bios
      const existingUser = await sql`
        SELECT ub.user_id, u.emailaddress, ub.phone
        FROM user_bios ub
        JOIN users u ON u.id = ub.user_id
        WHERE LOWER(u.emailaddress) = LOWER(${email})
      `;

      if (existingUser.length === 0) {
        console.log(`No user found for email: ${email} (${fullname})`);
        skipped++;
        continue;
      }

      const user = existingUser[0];

      // Only update if phone is currently null or empty
      if (user.phone && user.phone !== '') {
        console.log(`Phone already exists for ${fullname} (${email}): ${user.phone}`);
        skipped++;
        continue;
      }

      // Update phone number
      await sql`
        UPDATE user_bios
        SET phone = ${phone}
        WHERE user_id = ${user.user_id}
      `;

      console.log(`✓ Updated phone for ${fullname} (${email}): ${phone}`);
      updated++;

    } catch (error) {
      console.error(`Error updating ${fullname} (${email}):`, error.message);
      errors++;
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Total models: ${models.length}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors}`);
}

updatePhoneNumbers().catch(console.error);
