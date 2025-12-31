export function makeVenues(collection) {
    return Object.entries(collection).filter(s => /host/i.test(s[1].type)).map(([key, value], n) => {
        const [venueName, venueStreet] = value.address_line_1.split(',');
        const schema = {
            REL: { email: value.email },

            name: value.name ?? venueName ?? 'Unknown Venue',
            address_line_1: value.address_line_1,
            address_line_2: value.address_line_2 ?? venueStreet ?? '',
            address_city: value.city ?? 'London',
            address_county: value.county,
            address_postcode: value.postcode,
            address_area: value.area ?? '',
            tz: value.tz ?? 'Europe/London',

            latitude: value.latitude ?? '',
            longitude: value.longitude ?? '',

            date_created: value.date_created ?? '',
        }
        return schema;
    });
}