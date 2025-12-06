import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import fs from 'fs';

const sql = neon(process.env.DATABASE_URL);

// Parse date string to timestamp
// Format: "Thu, 04 Jan 24" or "Sat, 23 Nov 24"
function parseDate(dateStr) {
  if (!dateStr) return null;
  
  // Extract parts: day, month, year
  const parts = dateStr.trim().replace(/,/g, '').split(/\s+/);
  // parts = ["Thu", "04", "Jan", "24"]
  
  const day = parts[1];
  const monthStr = parts[2];
  const yearShort = parts[3];
  
  // Convert month name to number
  const months = {
    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
    'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
    'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
  };
  
  const month = months[monthStr];
  
  // Convert 2-digit year to 4-digit (24 -> 2024, 25 -> 2025, 26 -> 2026)
  const year = `20${yearShort}`;
  
  return `${year}-${month}-${day.padStart(2, '0')}`;
}

// Parse start time to HH:MM:SS
function parseStartTime(startStr) {
  if (!startStr) return '19:00:00';
  const hour = parseInt(startStr);
  return `${hour.toString().padStart(2, '0')}:00:00`;
}

// Parse duration to float
function parseDuration(durationStr) {
  if (!durationStr) return 2.0;
  return parseFloat(durationStr);
}

// Parse attendance count
function parseAttendance(countStr) {
  if (!countStr || countStr === '') return 0;
  const num = parseInt(countStr);
  return isNaN(num) ? 0 : num;
}

// Clean fullname for matching (remove suffixes like "(TBC)")
function cleanFullname(fullname) {
  if (!fullname) return '';
  return fullname
    .replace(/\(TBC\)/gi, '')
    .replace(/\(OPEN CALL\)/gi, '')
    .trim();
}

async function importCalendar() {
  try {
    console.log('Starting calendar import...\n');

    // First, create the calendar table
    console.log('Creating calendar table...');
    try {
      await sql`DROP TABLE IF EXISTS calendar CASCADE`;
      await sql`
        CREATE TABLE calendar (
          id BIGSERIAL PRIMARY KEY,
          user_id BIGINT NOT NULL,
          venue_id BIGINT NOT NULL,
          date TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
          attendance_inperson INTEGER NOT NULL DEFAULT 0,
          attendance_online INTEGER NOT NULL DEFAULT 0,
          start TIME NOT NULL,
          duration NUMERIC(4,2) NOT NULL,
          notes TEXT NULL,
          created_on TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
          modified_on TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
          CONSTRAINT calendar_user_id_foreign FOREIGN KEY(user_id) REFERENCES users(id),
          CONSTRAINT calendar_venue_id_foreign FOREIGN KEY(venue_id) REFERENCES venues(id)
        )
      `;
      console.log('✅ Calendar table created\n');
    } catch (error) {
      console.error('Error creating table:', error.message);
      process.exit(1);
    }

    // Get venue_id for "Life Drawing Art"
    const venueResult = await sql`
      SELECT id FROM venues WHERE name = 'Life Drawing Art' LIMIT 1
    `;
    
    if (venueResult.length === 0) {
      console.error('Error: Venue "Life Drawing Art" not found!');
      process.exit(1);
    }
    
    const venueId = venueResult[0].id;
    console.log(`Using venue_id: ${venueId} for "Life Drawing Art"\n`);

    // Read the calendar JSON file
    const data = JSON.parse(fs.readFileSync('./docs/google-export/calendar.json', 'utf8'));

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const record of data.records) {
      try {
        // Skip records with no fullname or "Available" records
        const cleanedName = cleanFullname(record.fullname);
        
        if (!cleanedName || cleanedName === '' || cleanedName.includes('Available')) {
          console.log(`⏭️  Skipping (no model): ${record.pk}`);
          skipped++;
          continue;
        }

        // Look up user_id from user_bios table
        const userBio = await sql`
          SELECT user_id FROM user_bios 
          WHERE LOWER(fullname) = LOWER(${cleanedName})
          LIMIT 1
        `;

        if (userBio.length === 0) {
          console.log(`⚠️  User not found: ${cleanedName} (${record.pk})`);
          skipped++;
          continue;
        }

        const userId = userBio[0].user_id;
        const eventDate = parseDate(record.date);
        
        if (!eventDate) {
          console.log(`⚠️  Invalid date: ${record.date} (${record.pk})`);
          skipped++;
          continue;
        }

        // Insert calendar entry
        await sql`
          INSERT INTO calendar (
            user_id, venue_id, date, attendance_inperson, attendance_online, 
            start, duration, notes
          )
          VALUES (
            ${userId},
            ${venueId},
            ${eventDate},
            ${parseAttendance(record.inperson)},
            ${parseAttendance(record.online)},
            ${parseStartTime(record.start)},
            ${parseDuration(record.duration)},
            ${record.notes || null}
          )
        `;

        console.log(`✅ Imported: ${eventDate} - ${cleanedName} (${parseAttendance(record.inperson)} in-person, ${parseAttendance(record.online)} online)`);
        imported++;

      } catch (error) {
        console.error(`❌ Error importing "${record.pk}":`, error.message);
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

importCalendar();
