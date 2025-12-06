import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import crypto from 'crypto';

// Load environment variables from .env file
config();

const DATABASE_URL = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

// Simple password hashing using SHA-256 (same as in API)
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function seed() {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Create admin user
    const adminEmail = 'admin@example.com';
    const adminPassword = hashPassword('admin123');

    const [admin] = await sql`
      INSERT INTO users (emailaddress, password, active, is_admin)
      VALUES (${adminEmail}, ${adminPassword}, 1, true)
      ON CONFLICT (emailaddress) DO UPDATE SET is_admin = true
      RETURNING id, emailaddress
    `;
    console.log(`✅ Created admin user: ${admin.emailaddress}`);

    // Check if admin bio exists, if not create it
    const [existingAdminBio] = await sql`
      SELECT id FROM user_bios WHERE user_id = ${admin.id}
    `;
    
    if (!existingAdminBio) {
      await sql`
        INSERT INTO user_bios (user_id, fullname, description)
        VALUES (${admin.id}, 'System Administrator', 'Main admin account')
      `;
    }

    // Create image types
    const types = [
      { name: 'profile', description: 'Profile pictures' },
      { name: 'portfolio', description: 'Portfolio images' },
      { name: 'venue', description: 'Venue photos' },
      { name: 'session', description: 'Life drawing session photos' },
    ];

    for (const type of types) {
      await sql`
        INSERT INTO types (name, description)
        VALUES (${type.name}, ${type.description})
        ON CONFLICT (name) DO NOTHING
      `;
    }
    console.log(`✅ Created ${types.length} image types`);

    // Create sample test user
    const testPassword = hashPassword('test123');
    const [testUser] = await sql`
      INSERT INTO users (emailaddress, password, active)
      VALUES ('test@example.com', ${testPassword}, 1)
      ON CONFLICT (emailaddress) DO UPDATE SET password = ${testPassword}
      RETURNING id
    `;

    // Check if test user bio exists, if not create it
    const [existingTestBio] = await sql`
      SELECT id FROM user_bios WHERE user_id = ${testUser.id}
    `;
    
    if (!existingTestBio) {
      await sql`
        INSERT INTO user_bios (user_id, fullname, description, instagram)
        VALUES (
          ${testUser.id}, 
          'Test User', 
          'Sample test account for development',
          '@testuser'
        )
      `;
    }
    console.log('✅ Created test user: test@example.com');

    console.log('\n✅ Seeding completed successfully!');
    console.log('\n📝 Login credentials:');
    console.log('   Admin: admin@example.com / admin123');
    console.log('   Test:  test@example.com / test123\n');

  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
