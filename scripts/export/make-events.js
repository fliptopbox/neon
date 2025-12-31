import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Static Data
const venuesPath = path.resolve(__dirname, 'static-venues.json');
const contactsPath = path.resolve(__dirname, 'static-host-contacts.json');
const rawDbPath = path.resolve(__dirname, '../../docs/google-export/database.json');

const venues = JSON.parse(fs.readFileSync(venuesPath, 'utf-8'));
const contacts = JSON.parse(fs.readFileSync(contactsPath, 'utf-8'));
const rawDb = JSON.parse(fs.readFileSync(rawDbPath, 'utf-8'));

// Build Host -> Venue Name Map from Raw Database
const hostVenueMap = new Map();
if (rawDb.venues && rawDb.venues.records) {
    for (const record of rawDb.venues.records) {
        if (record.name && record.address) {
            const venueName = record.address.split('\n')[0].trim();
            hostVenueMap.set(record.name.trim().toLowerCase(), venueName);
        }
    }
}

export function makeEvents(collection) {
    return Object.entries(collection)
        .filter(s => /host/i.test(s[1].type))
        .map(([key, value]) => {
            // 1. Find Host Contact Metadata
            let contact = contacts.find(c =>
                (value.email && c.email && c.email.toLowerCase() === value.email.toLowerCase()) ||
                (c.handle === key) ||
                (c.name.toLowerCase() === value.fullname.toLowerCase())
            );

            const REF = value.REF || {}; // Use passed REF provided by upstream logic if available

            const hostName = REF['events.name'] || contact?.name || value.fullname;

            // 2. Determine Venue
            let matchedVenue = null;

            // Strategy REF: Use explicit REF if available
            if (REF['venues.name']) {
                matchedVenue = venues.find(v => v.name.toLowerCase() === REF['venues.name'].toLowerCase());
            }

            // Strategy A: Lookup via Google Export Map (Fallback)
            if (!matchedVenue && hostName) {
                const mappedVenueName = hostVenueMap.get(hostName.toLowerCase());
                if (mappedVenueName) {
                    matchedVenue = venues.find(v => v.name.toLowerCase() === mappedVenueName.toLowerCase());
                }
            }

            // Strategy B: Text Search (Fallback)
            if (!matchedVenue) {
                const textToSearch = `${value.fullname} ${value.event_name} ${contact?.description || ''} ${contact?.summary || ''} ${value.description || ''}`.toLowerCase();
                const sortedVenues = [...venues].sort((a, b) => b.name.length - a.name.length);

                for (const v of sortedVenues) {
                    if (textToSearch.includes(v.name.toLowerCase())) {
                        matchedVenue = v;
                        break;
                    }
                }
            }

            // Strategy C: Host IS Venue (Last Resort)
            if (!matchedVenue) {
                matchedVenue = venues.find(v => v.name.toLowerCase() === value.fullname.toLowerCase());
            }

            // 3. Construct Schema
            const schema = {
                REL: {
                    email: contact?.email || value.email, // Link to User (Host)
                    key: matchedVenue ? matchedVenue.name : null, // Link to Venue
                    host_name: hostName
                },

                name: hostName || value.event_name || 'Life Drawing Session',
                description: contact?.summary || contact?.description || value.summary || value.description,

                frequency: value.frequency || 'weekly',
                week_day: value.week_day || 'unknown',

                images: JSON.stringify(value.images || []),
                pricing_table: JSON.stringify(value.pricing_table || []),
                pricing_text: value.pricing_text || '',
                pricing_tags: JSON.stringify(value.pricing_tags || []),

                pose_format: value.pose_format || 'Mixed poses: gesture, short, medium, long'
            };

            return schema;
        });
}