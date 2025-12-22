import { readFileSync, writeFileSync } from 'fs';

// Read both files
const newData = JSON.parse(readFileSync('database.json', 'utf8'));
const oldData = JSON.parse(readFileSync('database.json.bak', 'utf8'));

// Function to get all IDs from a dataset
function getAllIds(data) {
  const ids = new Set();
  for (const [tableName, table] of Object.entries(data)) {
    if (table.records && Array.isArray(table.records)) {
      table.records.forEach(record => {
        if (record.id) ids.add(record.id);
      });
    }
  }
  return ids;
}

// Get IDs from both files
const newIds = getAllIds(newData);
const oldIds = getAllIds(oldData);

// Find new records
const newRecordIds = [...newIds].filter(id => !oldIds.has(id));

console.log('New file has', newIds.size, 'total records');
console.log('Old file has', oldIds.size, 'total records');
console.log('Found', newRecordIds.length, 'new record IDs');

// Extract new records
const newRecords = {};
for (const [tableName, table] of Object.entries(newData)) {
  if (table.records && Array.isArray(table.records)) {
    const newTableRecords = table.records.filter(record => newRecordIds.includes(record.id));
    if (newTableRecords.length > 0) {
      newRecords[tableName] = {
        ...table,
        records: newTableRecords
      };
      console.log('Table:', tableName, '- New records:', newTableRecords.length);
    }
  }
}

// Write new records to file
writeFileSync('database-new-records.json', JSON.stringify(newRecords, null, 2));
console.log('\nNew records written to database-new-records.json');
