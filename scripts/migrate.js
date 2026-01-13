import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/*
i want to re-write this script. srcipts/migrate.js
i have made SQL schema changes. see dbml

the objective is to migrate a static json dataset from: scripts/export/parsed-database.json to my postgres database, read the SQL schema from docs/neon-api-schema.dbml
drop and create the tables and relationships
highlight any errors or problems with the source data

the static JSON we need to insert into the SQL database has a helper property eg. REL: { email }, this will help you  find the users.id where the REL.email links the parent table and derive related relationship to other tables.
*/

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure we have a database URL
if (!process.env.DATABASE_URL && !process.env.NETLIFY_DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL not found in environment');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL);

/**
 * Main Migration Function
 */
async function migrate() {
  console.log('🚀 Starting Migration Script...');

  // 1. Read Schema and Data
  const schemaPath = path.resolve(__dirname, '../docs/neon-api-schema.dbml');
  const dataPath = path.resolve(__dirname, './export/parsed-database.json');

  if (!fs.existsSync(schemaPath)) {
    console.error('❌ Schema file not found:', schemaPath);
    process.exit(1);
  }
  if (!fs.existsSync(dataPath)) {
    console.error('❌ Data file not found:', dataPath);
    process.exit(1);
  }

  const dbml = fs.readFileSync(schemaPath, 'utf-8');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  console.log('📂 Loaded DBML and JSON Data.');

  // 2. Parse DBML and Generate DDL
  const schema = parseDBML(dbml);
  const ddl = generateDDL(schema);

  // 3. Drop and Recreate Schema
  console.log('📦 Recreating Database Schema...');
  try {
    const tables = schema.tables.map(t => t.name);
    for (const t of tables) {
      await sql(`DROP TABLE IF EXISTS "${t}" CASCADE`);
    }
    const enums = schema.enums.map(e => e.name);
    // Explicitly drop known old/renamed enums to ensure cleanliness
    const knownEnums = [...new Set([...enums, 'status_enum', 'user_status_enum', 'event_status_enum'])];

    for (const e of knownEnums) {
      await sql(`DROP TYPE IF EXISTS "${e}" CASCADE`);
    }

    // Execute DDL
    for (const stmt of ddl) {
      console.log(`Executing: ${stmt}`);
      await sql(stmt);
    }
    console.log('✅ Schema Created Successfully.');
  } catch (e) {
    console.error('❌ Schema Creation Failed:', e);
    process.exit(1);
  }

  // 4. Data Insertion Maps
  const mapEmailToUserId = new Map(); // email -> users.id

  // Helper: Insert Row
  async function insertClean(tableName, row, idOverride = null) {
    // Sanitization
    const cleanRow = { ...row };
    delete cleanRow.REL;

    if (idOverride) cleanRow.id = idOverride;

    const tableDef = schema.tables.find(t => t.name === tableName);
    if (!tableDef) {
      console.error(`Unknown table ${tableName}`);
      return null;
    }
    const validCols = tableDef.columns.map(c => c.name);

    const dbRow = {};
    for (const col of validCols) {
      let val = cleanRow[col];

      // Sanitize JSON fields
      if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
        try {
          JSON.parse(val);
        } catch {
          val = val.replace(/'/g, '"');
          try { JSON.parse(val); } catch { val = '[]'; }
        }
      }

      if (val === '' && (col.includes('date') || col.includes('time') || col.includes('id') || col === 'latitude' || col === 'longitude')) {
        val = null;
      }

      if (val !== undefined) {
        dbRow[col] = val;
      }
    }

    // Default Timestamps if missing
    if (validCols.includes('date_created') && !dbRow.date_created) {
      dbRow.date_created = new Date().toISOString();
    }

    const keys = Object.keys(dbRow);
    const vals = Object.values(dbRow);
    const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');

    const cols = tableDef.columns.map(c => c.name);
    const hasId = cols.includes('id');

    let q = `INSERT INTO "${tableName}" (${keys.map(k => `"${k}"`).join(', ')}) VALUES (${placeholders})`;
    if (hasId) {
      q += ' RETURNING id';
    }

    try {
      const res = await sql(q, vals);
      if (hasId && res.length > 0) {
        return res[0].id;
      }
      return null;
    } catch (e) {
      if (!e.message.includes('duplicate key')) {
        console.error(`❌ Insert Error [${tableName}]:`, e.message, dbRow);
      }
      return null;
    }
  }

  // --- 5. Insert Data ---

  // USERS
  console.log('� Inserting Users...');
  let SYS_ID = null;

  if (data.users) {
    let idCounter = 1;
    for (const u of data.users) {
      const email = u.email;
      if (!email) continue;
      if (mapEmailToUserId.has(email)) continue;
      const id = await insertClean('users', u, idCounter);
      if (id) {
        mapEmailToUserId.set(email, id);
        idCounter++;

        if (email === (process.env.SYSTEM_ADMIN_EMAIL || 'lifedrawing@gmx.com')) {
          SYS_ID = id;
          console.log(`🛡 System Fallback User set to: ${email} (ID: ${id})`);
        }
      }
    }
  }

  // Fallback if not found
  if (!SYS_ID) {
    console.warn(`⚠️ Warning: ${process.env.SYSTEM_ADMIN_EMAIL || 'lifedrawing@gmx.com'} not found. SYS_ID defaulting to 1.`);
    SYS_ID = 1;
  }

  // USER PROFILES
  console.log('👤 Inserting User Profiles...');
  if (data.user_profiles) {
    let idCounter = 1;
    for (const p of data.user_profiles) {
      const email = p.REL?.email;
      if (!email) continue;
      const userId = mapEmailToUserId.get(email);
      if (!userId) {
        console.warn(`⚠️ Profile Orphan: ${email}`);
        continue;
      }
      p.user_id = userId;
      await insertClean('user_profiles', p, idCounter++);
    }
  }

  // VENUES
  console.log('building Venues...');
  const venueMap = new Map();
  if (data.venues) {
    let idCounter = 1;
    for (const v of data.venues) {
      const id = await insertClean('venues', v, idCounter++);
      if (id) venueMap.set(v.name, id);
    }
  }

  // MODELS
  console.log('🎨 Inserting Models...');
  if (data.models) {
    let idCounter = 1;
    for (const m of data.models) {
      const email = m.REL?.email;
      if (!email) continue;
      const userId = mapEmailToUserId.get(email);
      if (!userId) continue;

      m.user_id = userId;
      await insertClean('models', m, idCounter++);
    }
  }

  // HOSTS
  console.log('🎤 Inserting Hosts...');
  if (data.hosts) {
    let idCounter = 1;
    for (const h of data.hosts) {
      const email = h.REL?.email;
      if (!email) continue;
      const userId = mapEmailToUserId.get(email);
      if (!userId) continue;

      if (!h.name) {
        console.warn('⚠️ Host skipped (no name):', h);
        continue;
      }

      h.user_id = userId;
      delete h.summary;
      await insertClean('hosts', h, idCounter++);
    }
  }

  // EVENTS
  console.log('📅 Inserting Events...');
  if (data.events) {
    let idCounter = 1;
    for (const e of data.events) {
      const email = e.REL?.email;
      let userId = SYS_ID;

      if (email) {
        const uid = mapEmailToUserId.get(email);
        if (uid) userId = uid;
      }
      e.user_id = userId;

      // Link Venue
      // We use REL.key (which is the venue/host name in source) or name to find venue
      const venueKey = e.REL?.key;
      if (venueKey) {
        const vid = venueMap.get(venueKey);
        if (vid) e.venue_id = vid;
        else {
          // Try explicit lookup if key mismatch
          // Or fallback?
        }
      }

      // Fallback for known specific case if needed
      // "Drawing in the Library" -> Homerton Library?
      if (!e.venue_id && /library/i.test(e.name)) {
        const v = data.venues.find(v => /homerton/i.test(v.name));
        if (v) {
          const vid = venueMap.get(v.name);
          if (vid) e.venue_id = vid;
        }
      }

      // Fix frequency
      if (e.frequency === 'fortnightly') e.frequency = 'biweekly';

      delete e.host_user_id;
      delete e.date_created;

      await insertClean('events', e, idCounter++);
    }
  }

  // FALLBACK EVENT (ID 1)
  const hasEvent1 = data.events && data.events.length > 0;
  if (!hasEvent1) {
    await insertClean('events', {
      id: 1,
      user_id: SYS_ID,
      name: 'Legacy Import Event',
      description: 'Fallback',
      frequency: 'adhoc',
      week_day: 'unknown'
    }, 1);
  }

  // CALENDAR
  console.log('🗓 Inserting Calendar...');
  if (data.calendar) {
    let idCounter = 1;
    for (const c of data.calendar) {
      const email = c.REL?.email;
      let userId = null;
      if (email) userId = mapEmailToUserId.get(email);

      if (!userId) {
        // If model not found, try to use System? No, better skip for now inside migration.
        // Or maybe we can't link it.
        continue;
      }

      c.user_id = userId;
      if (!c.event_id) c.event_id = 1;

      await insertClean('calendar', c, idCounter++);
    }
  }

  // EXCHANGE RATES
  console.log('💱 Inserting Exchange Rates...');
  if (data.exchange_rates) {
    for (const r of data.exchange_rates) {
      await insertClean('exchange_rates', r);
    }
  }

  // --- 6. Reset Sequences ---
  console.log('🔄 Resetting Auto-Increment Sequences...');
  const tablesWithSeq = ['users', 'user_profiles', 'venues', 'models', 'hosts', 'events', 'calendar'];

  for (const t of tablesWithSeq) {
    try {
      // Check if table has rows first to avoid setval error on empty table
      const countRes = await sql(`SELECT count(*) as c FROM "${t}"`);
      if (countRes[0].c > 0) {
        await sql(`SELECT setval('${t}_id_seq', (SELECT MAX(id) FROM "${t}"))`);
        console.log(`   - ${t}_id_seq synced`);
      } else {
        // Optional: reset to 1 if empty, but usually not needed if dropped
      }
    } catch (e) {
      console.warn(`⚠️ Could not reset sequence for ${t}: ${e.message}`);
    }
  }

  console.log('✨ Migration Complete!');
  process.exit(0);
}


// --- PARSING HELPERS ---

function parseDBML(dbml) {
  const schema = { tables: [], enums: [], refs: [] };
  const lines = dbml.split('\n');
  let currentTable = null;
  let currentEnum = null;

  for (let line of lines) {
    line = line.trim();

    // Strip trailing comments
    const commentIdx = line.indexOf('//');
    if (commentIdx !== -1) {
      line = line.substring(0, commentIdx).trim();
    }

    if (!line) continue;

    if (line.toLowerCase().startsWith('enum ')) {
      const name = line.split(' ')[1];
      currentEnum = { name, values: [] };
      schema.enums.push(currentEnum);
    } else if (line.toLowerCase().startsWith('table ')) {
      const name = line.split(' ')[1];
      currentTable = { name, columns: [] };
      schema.tables.push(currentTable);
    } else if (line.startsWith('}')) {
      currentTable = null;
      currentEnum = null;
    } else if (line.toLowerCase().startsWith('ref:')) {
      // Updated regex to capture optional settings [...]
      const match = line.match(/"([^"]+)"\."([^"]+)"\s*<\s*"([^"]+)"\."([^"]+)"(\s*\[(.*)\])?/);
      if (match) {
        const refObj = {
          fromTable: match[1],
          fromCol: match[2],
          toTable: match[3],
          toCol: match[4],
          settings: {}
        };

        if (match[6]) {
          const settingsStr = match[6];
          const props = settingsStr.split(',').map(s => s.trim());
          for (const p of props) {
            const [key, val] = p.split(':').map(s => s.trim().toLowerCase());
            if (key === 'delete') refObj.settings.onDelete = val;
            if (key === 'update') refObj.settings.onUpdate = val;
          }
        }
        schema.refs.push(refObj);
      }
    } else {
      if (currentEnum) {
        const val = line.split(' ')[0];
        if (val) currentEnum.values.push(val);
      } else if (currentTable) {
        // Column: name type [settings]
        const colMatch = line.match(/^(\w+)\s+([^\s]+)\s*(.*)$/);
        if (colMatch) {
          const name = colMatch[1];
          const type = colMatch[2];
          let settingsStr = colMatch[3];

          let constraints = [];
          let defaultValue = null;
          let isIncrement = false;

          if (settingsStr.startsWith('[') && settingsStr.endsWith(']')) {
            settingsStr = settingsStr.slice(1, -1);

            // Smart split by comma respecting quotes/brackets
            const props = [];
            let current = '';
            let inQuote = false;
            let quoteChar = '';
            let bracketDepth = 0;

            for (let i = 0; i < settingsStr.length; i++) {
              const char = settingsStr[i];

              if ((char === "'" || char === '`') && (i === 0 || settingsStr[i - 1] !== '\\')) {
                if (!inQuote) {
                  inQuote = true;
                  quoteChar = char;
                } else if (char === quoteChar) {
                  inQuote = false;
                }
              }

              if (!inQuote) {
                if (char === '{' || char === '[') bracketDepth++;
                if (char === '}' || char === ']') bracketDepth--;
              }

              if (char === ',' && !inQuote && bracketDepth === 0) {
                props.push(current.trim());
                current = '';
              } else {
                current += char;
              }
            }
            if (current.trim()) props.push(current.trim());

            for (const p of props) {
              const lower = p.toLowerCase();
              if (lower === 'primary key') constraints.push('PRIMARY KEY');
              else if (lower === 'not null') constraints.push('NOT NULL');
              else if (lower === 'unique') constraints.push('UNIQUE');
              else if (lower === 'increment') isIncrement = true;
              else if (lower.startsWith('default:')) {
                let def = p.substring(8).trim();
                if ((def.startsWith("'") && def.endsWith("'")) || (def.startsWith('`') && def.endsWith('`'))) {
                  def = def.slice(1, -1);
                }
                defaultValue = def;
              }
            }
          }

          currentTable.columns.push({ name, type, constraints, defaultValue, isIncrement });
        }
      }
    }
  }
  return schema;
}

function generateDDL(schema) {
  const stmts = [];

  // Enums
  for (const e of schema.enums) {
    stmts.push(`CREATE TYPE "${e.name}" AS ENUM (${e.values.map(v => `'${v}'`).join(', ')})`);
  }

  // Tables
  for (const t of schema.tables) {
    let cols = [];
    for (const c of t.columns) {
      let type = c.type;

      if (c.isIncrement) {
        if (type === 'integer') type = 'SERIAL';
        else if (type === 'bigint') type = 'BIGSERIAL';
      }

      if (type === 'timestamptz') type = 'TIMESTAMPTZ';
      else if (type === 'datetime') type = 'TIMESTAMP';

      let line = `"${c.name}" ${type}`;

      if (c.constraints.length > 0) {
        line += ' ' + c.constraints.join(' ');
      }
      if (c.defaultValue !== null) {
        if (c.defaultValue === 'now()') line += ' DEFAULT NOW()';
        else if (c.defaultValue === 'true') line += ' DEFAULT TRUE';
        else if (c.defaultValue === 'false') line += ' DEFAULT FALSE';
        else if (!isNaN(Number(c.defaultValue)) && c.defaultValue !== '') line += ` DEFAULT ${c.defaultValue}`;
        else {
          // quote it
          line += ` DEFAULT '${c.defaultValue.replace(/'/g, "''")}'`; // Escape single quotes!
        }
      }
      cols.push(line);
    }
    stmts.push(`CREATE TABLE "${t.name}" (${cols.join(', ')})`);
  }

  // Refs
  for (const r of schema.refs) {
    let stmt = `ALTER TABLE "${r.fromTable}" ADD FOREIGN KEY ("${r.fromCol}") REFERENCES "${r.toTable}" ("${r.toCol}")`;
    if (r.settings.onDelete) {
      stmt += ` ON DELETE ${r.settings.onDelete.toUpperCase()}`;
    }
    if (r.settings.onUpdate) {
      stmt += ` ON UPDATE ${r.settings.onUpdate.toUpperCase()}`;
    }
    stmts.push(stmt);
  }

  return stmts;
}

// Run
migrate().catch(e => console.error(e));
