import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function exportSchema() {
  // Get all tables
  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `;

  console.log('-- PostgreSQL Database Schema');
  console.log('-- Generated:', new Date().toISOString());
  console.log('');

  for (const { table_name } of tables) {
    // Get CREATE TABLE statement
    const columns = await sql`
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        column_default,
        is_nullable,
        udt_name
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = ${table_name}
      ORDER BY ordinal_position
    `;

    console.log(`CREATE TABLE "${table_name}"`);
    console.log('(');
    
    const colDefs = columns.map((col, idx) => {
      let def = `    "${col.column_name}"`;
      
      // Data type
      if (col.data_type === 'USER-DEFINED') {
        def += ` ${col.udt_name.toUpperCase()}`;
      } else if (col.data_type === 'character varying') {
        def += ` VARCHAR(${col.character_maximum_length || 255})`;
      } else if (col.data_type === 'timestamp without time zone') {
        def += ' TIMESTAMP(0) WITHOUT TIME ZONE';
      } else if (col.data_type === 'bigint') {
        if (col.column_default && col.column_default.includes('nextval')) {
          def += ' BIGSERIAL';
        } else {
          def += ' BIGINT';
        }
      } else if (col.data_type === 'smallint') {
        def += ' SMALLINT';
      } else if (col.data_type === 'integer') {
        def += ' INTEGER';
      } else if (col.data_type === 'text') {
        def += ' TEXT';
      } else if (col.data_type === 'time without time zone') {
        def += ' TIME';
      } else if (col.data_type === 'jsonb') {
        def += ' JSONB';
      } else {
        def += ` ${col.data_type.toUpperCase()}`;
      }
      
      // Nullable
      if (col.is_nullable === 'NO') {
        def += ' NOT NULL';
      } else {
        def += ' NULL';
      }
      
      // Default value
      if (col.column_default && !col.column_default.includes('nextval')) {
        if (col.column_default === 'CURRENT_TIMESTAMP' || col.column_default === 'now()') {
          def += ' DEFAULT NOW()';
        } else if (col.column_default.includes('::')) {
          const defaultVal = col.column_default.split('::')[0];
          def += ` DEFAULT ${defaultVal}`;
        } else {
          def += ` DEFAULT ${col.column_default}`;
        }
      }
      
      return def + (idx < columns.length - 1 ? ',' : '');
    });
    
    console.log(colDefs.join('\n'));
    console.log(');');
    
    // Get constraints
    const constraints = await sql`
      SELECT 
        con.conname as constraint_name,
        con.contype as constraint_type,
        pg_get_constraintdef(con.oid) as definition
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      WHERE rel.relname = ${table_name}
      ORDER BY con.contype
    `;
    
    for (const c of constraints) {
      if (c.constraint_type === 'p') {
        const match = c.definition.match(/\((.+?)\)/);
        if (match) {
          console.log(`ALTER TABLE "${table_name}" ADD PRIMARY KEY(${match[1]});`);
        }
      } else if (c.constraint_type === 'u') {
        const match = c.definition.match(/UNIQUE \((.+?)\)/);
        if (match) {
          console.log(`ALTER TABLE "${table_name}" ADD CONSTRAINT "${c.constraint_name}" UNIQUE(${match[1]});`);
        }
      }
    }
    
    console.log('');
  }

  // Get foreign keys
  const fkeys = await sql`
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      tc.constraint_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
    ORDER BY tc.table_name, kcu.column_name
  `;

  for (const fk of fkeys) {
    console.log(`ALTER TABLE "${fk.table_name}" ADD CONSTRAINT "${fk.constraint_name}"`);
    console.log(`    FOREIGN KEY ("${fk.column_name}") REFERENCES "${fk.foreign_table_name}" ("${fk.foreign_column_name}");`);
  }
}

exportSchema().catch(console.error);
