import fs, { stat } from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

import { getUsers } from './get-users.js';
import { getVenues } from './get-venues.js';
import { saveToDisk } from './constants.js';
import { makeUsers } from './make-users.js';
import { makeUserProfiles } from './make-user-profiles.js';
import { makeModels } from './make-models.js';
import { makeVenues } from './make-venues.js';
import { makeHosts } from './make-hosts.js';
import { makeEvents } from './make-events.js';
import { makeCalendar } from './make-calendar.js';
import { fetchExchangeRates } from './get-exchange-rates.js';

const exchangeRates = (async () => await fetchExchangeRates())();
const staticData = fs.readFileSync(path.join(__dirname, '../../docs/google-export/database.json'), 'utf-8');
const json = JSON.parse(staticData);

delete json.test;
delete json.members;

const users = getUsers(json);
const hosts = getVenues(json);
const allusers = { ...users, ...hosts };
const venues = makeVenues(allusers);

const homertonIndex = venues.findIndex(v => /homerton/i.test(v.name)); //?

export const tables = saveToDisk({
    users: makeUsers(allusers),
    user_profiles: makeUserProfiles(allusers),

    venues,
    models: makeModels(allusers),
    hosts: makeHosts(allusers),

    events: makeEvents(allusers),

    calendar: makeCalendar(json.calendar.records, allusers, homertonIndex),
    exchange_rates: exchangeRates.records,
});
