import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const contactsPath = path.join(__dirname, '../docs/db-seed-user-contacts.json');
const descriptionsPath = path.join(__dirname, '../docs/db-seed-host-description.json');
const outputPath = path.join(__dirname, '../docs/db-seed-host-contacts.json');

const contacts = JSON.parse(fs.readFileSync(contactsPath, 'utf8'));
const descriptions = JSON.parse(fs.readFileSync(descriptionsPath, 'utf8'));

// Helper to normalize strings for comparison
const normalize = (str) => str.toLowerCase().trim().replace(/’/g, "'").replace(/[()]/g, '');

const merged = contacts.map(contact => {
    let searchName = contact.host_name;

    // Manual fixes for known typos/variations
    if (searchName === "Heskith Hubbard Art Society") {
        searchName = "Hesketh Hubbard Art Society";
    }

    // Find matching description
    // 1. Exact match
    let descModel = descriptions.find(d => d.name === searchName);

    // 2. Normalized match
    if (!descModel) {
        descModel = descriptions.find(d => normalize(d.name) === normalize(searchName));
    }

    // 3. Substring match (careful with this one)
    if (!descModel) {
        // Special handling for ELSC which has flipped parens
        if (searchName.includes("East London Stripper Collective")) {
            descModel = descriptions.find(d => d.name.includes("East London Stripper Collective"));
        }
    }

    return {
        name: contact.host_name,
        handle: contact.handle,
        email: contact.found_email,
        description: descModel ? descModel.description : "",
        summary: descModel ? descModel.summary : ""
    };
});

fs.writeFileSync(outputPath, JSON.stringify(merged, null, 4));
console.log(`Successfully merged ${merged.length} items into ${outputPath}`);
