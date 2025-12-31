export function makeUserProfiles(collection) {
    return Object.entries(collection).map(([key, value], n) => {
        const schema = {
            REL: { email: value.email },
            
            handle: value.handle,
            fullname: value.fullname,
            phone_number: value.phone_number,
            avatar_url: value.avatar_url,

        }
        // console.log(n, schema);
        return schema;
    });
}