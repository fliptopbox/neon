export function makeHosts(collection) {
    return Object.entries(collection).filter(s => /host/i.test(s[1].type)).map(([key, value], n) => {
        const schema = {
            REL: { email: value.email, key },
            REF: value.REF,

            name: value.name || value.fullname || key,
            description: value.description,
            summary: value.summary,
            social_handles: value.social_handles,
            host_tags: value.host_tags,
            default_date_time: value.default_date_time,
            default_duration: value.default_duration,
            date_created: value.date_created,

        }
        return schema;
    });
}