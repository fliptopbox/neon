import fs, { stat } from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

export const defaultInterests = JSON.stringify(['nude', 'clothed', 'costume']);

export function invalidRows(record) {
    if(record?.unsubscribeOn) {
        console.log('⏭️ Skipping unsubscribed user', record);
        return false;
    }

    if(record?.hosted) {
        const hosted = /[0-9]+/.test(record?.hosted);
        if(!hosted) console.log('️❌ Skipping un-hosted', record);
        return hosted;
    }


    if(record?.tester === 'checked' || (record?.sentOn && /^bruce/i.test(record?.fullname))) {
        console.log('️❌ Skipping tester', record);
        return false;
    }

    return true;
}

export function toSlug(text = '') {
    return text.toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .replace(/\s+/g, '-')
        .replace('-tbc', '');
}

export function saveToDisk(tables, dest = './parsed-database.json') {
    // save the tables data to a JSON file
    const outputPath = path.join(__dirname, dest);
    fs.writeFileSync(outputPath, JSON.stringify(tables, null, 2), 'utf-8');

    console.log(
        `✓ Saved parsed database`, 
        outputPath, 
        new Date().toISOString()
    );

    return tables;
};