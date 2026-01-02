
const domains = [
    'stan.store',
    'gumroad',
    'patreon',
    'payhip'
];

export const reStoreDomains = new RegExp(domains.join('|'), 'i');