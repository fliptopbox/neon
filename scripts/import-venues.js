import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import fs from 'fs';

const sql = neon(process.env.DATABASE_URL);

// Day mapping
const dayMap = {
  'sunday': 0,
  'monday': 1,
  'tuesday': 2,
  'wednesday': 3,
  'thursday': 4,
  'friday': 5,
  'saturday': 6
};

// Parse time string to HH:MM:SS format
function parseTime(timeStr) {
  if (!timeStr) return '19:00:00';
  
  // Extract start time from formats like "7-9.00 PM", "19:00", "6:30-8:30pm", etc.
  const match = timeStr.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)?/i);
  if (!match) return '19:00:00';
  
  let hours = parseInt(match[1]);
  const minutes = match[2] || '00';
  const ampm = match[3];
  
  // Convert to 24-hour format
  // If hour is already >= 12, it's in 24-hour format, don't add 12
  if (ampm && ampm.toUpperCase() === 'PM' && hours < 12) {
    hours += 12;
  } else if (ampm && ampm.toUpperCase() === 'AM' && hours === 12) {
    hours = 0;
  }
  // If no AM/PM and hour >= 12, assume already 24-hour format
  
  return `${hours.toString().padStart(2, '0')}:${minutes}:00`;
}

// Parse price string to integer pence
function parsePrice(priceStr) {
  if (!priceStr || priceStr.trim() === '') return 0;
  
  // Handle special cases
  if (priceStr.toLowerCase().includes('eventrite') || 
      priceStr.toLowerCase().includes('donation') ||
      priceStr.toLowerCase() === 'false') {
    return 0;
  }
  
  // Extract numbers from strings like "£15", "£16.50", "£15 (£10)", "£350 (year)"
  const match = priceStr.match(/£?(\d+)\.?(\d{0,2})/);
  if (!match) return 0;
  
  const pounds = parseInt(match[1]);
  const pence = match[2] ? parseInt(match[2].padEnd(2, '0')) : 0;
  
  return pounds * 100 + pence;
}

// Parse duration to minutes
function parseDuration(durationStr) {
  const hours = parseFloat(durationStr || '2');
  return Math.round(hours * 60);
}

// Clean instagram handle
function cleanInstagram(instagram) {
  if (!instagram) return '';
  return instagram.replace(/^@/, '');
}

// Parse tags to CSV format
function parseTags(tagStr) {
  if (!tagStr || tagStr === 'FALSE') return null;
  const tags = tagStr.split(';').map(t => t.trim()).filter(t => t.length > 0);
  return tags.length > 0 ? tags.join(',') : null;
}

// Check if venue is active
function isActive(comments, attended) {
  const lowerComments = (comments || '').toLowerCase();
  const lowerAttended = (attended || '').toLowerCase();
  return !(lowerComments === 'closed' || lowerAttended === 'closed');
}

async function importVenues() {
  try {
    console.log('Starting venues import...\n');

    // Get user_id for response.write@gmail.com
    const userResult = await sql`
      SELECT id FROM users WHERE emailaddress = 'response.write@gmail.com'
    `;

    if (userResult.length === 0) {
      console.error('Error: User with email response.write@gmail.com not found!');
      process.exit(1);
    }

    const userId = userResult[0].id;
    console.log(`Found user ID: ${userId} for response.write@gmail.com\n`);

    // Read the venues JSON file
    const data = JSON.parse(fs.readFileSync('./docs/google-export/venues.json', 'utf8'));

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const record of data.records) {
      try {
        const venue = {
          user_id: userId,
          name: record.name.trim(),
          week_day: dayMap[record.day.toLowerCase()],
          start_time: parseTime(record.time),
          duration: parseDuration(record.duration),
          area: record.area || '',
          frequency: record.frequency || 'weekly',
          instagram: cleanInstagram(record.instagram),
          website: record.href || '',
          address: record.address || '',
          timezone: record.tz || 'GMT',
          postcode: record.postcode || '',
          price_inperson: parsePrice(record.inperson),
          price_online: parsePrice(record.online),
          tags: parseTags(record.tag),
          active: isActive(record.comments, record.attended) ? 1 : 0
        };

        // Check if venue already exists
        const existing = await sql`
          SELECT id FROM venues 
          WHERE name = ${venue.name} 
          AND week_day = ${venue.week_day}
          AND start_time = ${venue.start_time}
        `;

        if (existing.length > 0) {
          console.log(`⏭️  Skipping duplicate: ${venue.name}`);
          skipped++;
          continue;
        }

        // Insert venue
        await sql`
          INSERT INTO venues (
            user_id, name, week_day, start_time, duration, area, 
            frequency, instagram, website, address, timezone, 
            postcode, price_inperson, price_online, tags, active
          ) VALUES (
            ${venue.user_id}, ${venue.name}, ${venue.week_day}, 
            ${venue.start_time}, ${venue.duration}, ${venue.area},
            ${venue.frequency}, ${venue.instagram}, ${venue.website}, 
            ${venue.address}, ${venue.timezone}, ${venue.postcode},
            ${venue.price_inperson}, ${venue.price_online}, 
            ${venue.tags}, ${venue.active}
          )
        `;

        console.log(`✅ Imported: ${venue.name} (${venue.active ? 'Active' : 'Inactive'})`);
        imported++;

      } catch (error) {
        console.error(`❌ Error importing "${record.name}":`, error.message);
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

importVenues();
