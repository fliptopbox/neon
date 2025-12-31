export function makeUsers(collection) {
    return Object.entries(collection).map(([key, value]) => {
        const schema = {
            email: value.email,
            password_hash: value.password_hash,
            is_global_active: value.is_global_active,
            is_admin: value.is_admin,
            date_created: value.date_created,
        }
        // console.log(schema);
        return schema;
    });
}