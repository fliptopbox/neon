import fs from 'fs';
import path from 'path';
import { toSlug } from '../export/constants.js';
import { getDefaultDateTime } from './get-default-date-time.js';
import { hashPassword } from './hash-password.js';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const venuesData = fs.readFileSync(path.join(__dirname, './static-venues.json'), 'utf-8');
const venuesDictionary = Object.fromEntries(JSON.parse(venuesData).map(venue =>  [venue.postcode.toUpperCase(), venue]));

// merges static host metadata and makes psuedo users
const userContactsData = fs.readFileSync(path.join(__dirname, './static-host-contacts.json'), 'utf-8');
const hostContacts = JSON.parse(userContactsData)
    .map(contact => {
        const keys = new Set([
            contact.name.trim(),
            contact.name.trim().toLowerCase(),
            contact.handle,
            toSlug(contact.name),
        ].filter(Boolean));

        return { keys, ...contact };
    });

export function getVenues(collection) {
    const venues = collection.venues.records.filter(venue => /close/i.test(venue.attended) === false);

    console.log('⭐️ Processing venues...', venues.length);
    const entries = venues.map((venue, n) => {
        const key = toSlug(venue.name || `venue-${n + 1}`);
        const placeholder = `${key}@placeholder.com`;

        const hostContact = hostContacts.find(contact => contact.keys.has(key)) ?? {};

        const staticData = venuesDictionary[venue.postcode.toUpperCase()] || {
            address_line_1: venue.address,
            address_line_2: '',
            city: 'London',
            county: '',
            postcode: venue.postcode,
            area: venue.area,
            tz: /gmt/i.test(venue.tz) ? 'Europe/London' : venue.tz || 'Europe/London',
        };

        const match = venuesDictionary[venue.postcode.toUpperCase()] ? venue.postcode : false;

        const {
            description = '', //
            summary = '', 
            email: found_email = null, 
            handle: found_handle = null,
            password: found_password = null,
            logline = 'Regular Life Drawing Sessions',
        } = hostContact;

        const row = {
            index: n + 1,
            type: 'hosts',
            matchpostcode: match,
            fullname: venue.name,
            email: String(found_email || placeholder || '').trim().toLowerCase(),
            password_hash: hashPassword(found_email ?? placeholder, found_password),
            is_global_active: true,
            is_admin: false,

            /**/
            // user_profiles
            phone_number: '',
            handle: found_handle || key,
            description: description || '',
            summary: summary || '',
            logline: logline || 'Regular Life Drawing Sessions',
            avatar_url: '',
            interest_tags: '[]',
            flag_emoji: '🏳️',
            affiliate_urls: '[]',
            payment_methods: JSON.stringify({
                monzo: null,
                revolut: null,
                paypal: null,
                iban: null,
                bank: {
                    name: null,
                    sort_code: null,
                    account_number: null,
                }
            }),

            ...getDefaultDateTime(venue.time || '7 PM', venue.duration || '2', venue.dayno || '1'),

            // Venue
            display_name: venue.name,

            social_handles: JSON.stringify({ instagram: venue.instagram ?? null, twitter: venue.twitter ?? null, facebook: venue.facebook ?? null }),
            host_tags: JSON.stringify(`${venue.tag || ''}`.split(';').filter(Boolean).map(tag => tag.trim())),

            ...staticData,
            date_created: staticData.created_on || venue.dateAdded || '',

            // Events
            event_name: venue.fullname || venue.name,
            frequency: venue.frequency,
            week_day: venue.day,
            pricing_table: JSON.stringify([
                ['inperson', (venue.inperson).replace(/[^0-9.]/g, '') || null],
                ['online', (venue.online).replace(/[^0-9.]/g, '') || null]
            ]),

            pricing_text: venue.comments || '',
            website_urls: venue.website ? `['${venue.website}']` : '[]',

            /**/

        };

        row.REF ={
            'events.name': row.fullname,

            'venues.name': row.name,
            'venues.address_postcode': row.postcode,

            'users.email': row.email,
            'users.handle': row.handle,
        }

        console.log(`🏛  Venue ${n + 1}: [%s]`, row.fullname, row.name, row.handle, row.postcode, row.email);
        return [toSlug(row.fullname), row];
    });

    return Object.fromEntries(entries);
}