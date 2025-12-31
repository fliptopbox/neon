export function makeModels(collection) {
    return Object.entries(collection).filter(s => /model/i.test(s[1].type)).map(([key, value], n) => {
        const schema = {
            REL: { email: value.email },

            display_name: value.display_name,
            website_urls: value.website_urls,
            social_handles: value.social_handles,
            portrait_urls: value.portrait_urls,

            sex: value.sex,
            date_created: value.date_created,
        }
        return schema;
    });
}