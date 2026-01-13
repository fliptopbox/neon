import { defaultInterests } from "./constants.js";
import { hashPassword } from './hash-password.js';
import { toSlug, invalidRows } from '../export/constants.js';

const defaultUser = {
    type: 'system',
    avatar_url: '1024/bruce-thomas.jpg',
    interest_tags: defaultInterests,
    phone_number: '+44 759 4616 416',
    flag_emoji: '🏳️',
    affiliate_urls: '[]',
    is_global_active: true,
    is_admin: false,
    user_status: 'unconfirmed',

    payment_methods: JSON.stringify({
        monzo: null, //'https://monzo.me/raffaellaqueiroz',
        revolut: 'https://revolut.me/brucethomas',
        paypal: 'https://paypal.me/brucethomas',
        bank: {
            name: 'System Administrator',
            sort_code: '123456',
            account_number: '12345678',
            iban: null, //'GB1234567812345678',
        }
    }),
};

export function getUsers(data) {
    const collection = Object.values(data);

    const users = {
        [toSlug('System Administrator')]: {
            fullname: 'System Administrator',
            handle: 'system-admin',
            email: process.env.SYSTEM_ADMIN_EMAIL || 'lifedrawing@gmx.com',
            password_hash: hashPassword(process.env.SYSTEM_ADMIN_EMAIL || 'lifedrawing@gmx.com', process.env.SYSTEM_ADMIN_PASSWORD || 'lifedrawing!!!'),
            is_global_active: true,
            ...defaultUser,

            user_status: 'active',
            is_admin: true,
        },

        [toSlug('Bruce Thomas')]: {
            fullname: 'Bruce Thomas',
            handle: 'bruce-thomas',
            email: 'response.write@gmail.com',
            password_hash: hashPassword('response.write@gmail.com', 'pa55word!'),
            is_global_active: true,
            ...defaultUser,

            user_status: 'active',
            is_admin: true,
        },
        // 'Life Drawing Art'
        // See db-seed-host-contacts.json

        [toSlug('Jayne Kilroy')]: {
            fullname: 'Jayne Kilroy',
            handle: 'jayne-kilroy',
            email: 'jayne.kilroy@gmx.com',
            password_hash: hashPassword('jayne.kilroy@gmx.com', 'jayne123'),
            ...defaultUser,
        }
    };

    collection.forEach(item => {
        if (!item?.records) return;
        if (/(venues|calendar)/i.test(item.title)) return;

        console.log('⭐️ Processing ...', item.title, item.records.length);

        const type = item.title.toLowerCase();

        item.records.filter(invalidRows).forEach((record, n) => {
            const fullname = (record.name || record.fullname || null);
            if (fullname === null) {
                console.warn('❌ No fullname:', type, record);
                return;
            }

            const slug = toSlug(fullname);

            if ((record.emailaddress || record.email || null) === null) {
                console.warn('⚠️ No email', type, slug, record);
            }

            const email = record.emailaddress || record.email || `${slug}@placeholder.com`;

            // models (number = true)
            const hosted = /^[0-9]+$/.test(record?.hosted);
            const empty = record?.hosted === undefined;
            const isGlobalActive = empty || hosted === true ? true : false;

            if (users[slug] !== undefined) {
                console.warn('⭕️ Not replacing existing user', type, slug, record);
            }

            users[slug] = users[slug] || {

                type: type,
                fullname: fullname,
                email: email.trim().toLowerCase(),
                password_hash: hashPassword(email),
                user_status: 'unconfirmed',
                is_global_active: isGlobalActive,
                is_admin: false,

                // user_profiles
                phone_number: (record?.phone || record?.phone_number || '').trim().replace(/^7/g, '07'),
                handle: slug,
                description: '',
                avatar_url: record.portrait || '',
                interest_tags: item.title === 'models' ? defaultInterests : '[]',
                flag_emoji: '🏳️',
                affiliate_urls: record?.website ? `['${record.website}']` : '[]',
                payment_methods: JSON.stringify({
                    monzo: null,
                    revolut: null,
                    paypal: null,
                    iban: null,
                    bank: {
                        name: record?.account_holder || null,
                        sort_code: record?.sortcode || null,
                        account_number: record?.account || null,
                    }
                }),

                // model
                display_name: fullname,
                website_urls: record.website ? `['${record.website}']` : '[]',
                portrait_urls: record.portrait ? `['${record.portrait}']` : '[]',
                social_handles: JSON.stringify([
                    record.instagram ? { instagram: record.instagram } : null,
                    record.twitter ? { twitter: record.twitter } : null,
                    record.facebook ? { facebook: record.facebook } : null,
                ].filter(Boolean)),
                sex: /^m/i.test(record.sex) ? 'male' : /^f/i.test(record.sex) ? 'female' : 'unspecified',

                date_created: record.dateAdded || record.createdOn || '',
                tz: record.location ?? record.timezone ?? 'Europe/London',
            };
        });
    });

    return users;
}