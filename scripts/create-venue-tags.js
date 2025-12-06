import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// Tag descriptions based on common life drawing session attributes
const tagDescriptions = {
  'loyalty': 'Loyalty program or discounts for regular attendees',
  'paycash': 'Cash payment accepted',
  'paycard': 'Card payment accepted',
  'payonline': 'Online payment available',
  'tips': 'Tips or guidance provided during session',
  'accessories': 'Props or accessories used in poses',
  'aircon': 'Air conditioning available',
  'heating': 'Heating available',
  'materials': 'Art materials provided',
  'equipment': 'Equipment (easels, boards) provided',
  'tea': 'Tea/coffee provided',
  'snacks': 'Snacks or refreshments available',
  'bar': 'Bar or alcoholic drinks available',
  'lights': 'Professional lighting setup',
  'accessible': 'Wheelchair accessible venue',
  'mixed': 'Mixed-length poses (short and long)',
  'long': 'Long pose sessions',
  'extralong': 'Extra-long pose sessions (3+ hours)'
};

async function createVenueTagsTable() {
  try {
    console.log('Creating venue_tags utility table...\n');

    // Drop table if exists
    await sql`DROP TABLE IF EXISTS venue_tags`;
    
    // Create table
    await sql`
      CREATE TABLE venue_tags (
        id VARCHAR(50) PRIMARY KEY,
        description VARCHAR(256) NOT NULL
      )
    `;
    
    console.log('✅ Table created successfully\n');

    // Get all unique tags from venues
    const venues = await sql`SELECT tags FROM venues WHERE tags IS NOT NULL`;
    
    const uniqueTags = new Set();
    
    venues.forEach(venue => {
      if (venue.tags) {
        const tags = venue.tags.split(',').map(t => t.trim().toLowerCase());
        tags.forEach(tag => uniqueTags.add(tag));
      }
    });

    console.log(`Found ${uniqueTags.size} unique tags\n`);

    // Insert tags with descriptions
    let inserted = 0;
    for (const tag of Array.from(uniqueTags).sort()) {
      const description = tagDescriptions[tag] || `${tag.charAt(0).toUpperCase() + tag.slice(1)} attribute`;
      
      await sql`
        INSERT INTO venue_tags (id, description)
        VALUES (${tag}, ${description})
      `;
      
      console.log(`✅ ${tag}: ${description}`);
      inserted++;
    }

    console.log('\n' + '='.repeat(50));
    console.log(`Created venue_tags table with ${inserted} unique tags`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createVenueTagsTable();
