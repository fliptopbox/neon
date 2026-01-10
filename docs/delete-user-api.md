# Delete User API - Quick Reference

## Endpoint: `DELETE /api/users/delete-by`

### Authentication Required
- ✅ **JWT Token** (via `Authorization: Bearer <token>`)
- ✅ **Admin Role** (`isAdmin: true`)

### Request Body

You must provide **one** of the following identifiers:

```typescript
{
  id?: number;           // User ID (highest priority)
  email?: string;        // User email
  password_hash?: string; // User password hash
  handle?: string;       // User profile handle
  fullname?: string;     // User profile fullname (lowest priority)
}
```

### Priority Order

If multiple identifiers are provided, they are checked in this order:
1. `id`
2. `email`
3. `password_hash`
4. `handle`
5. `fullname`

### Success Response (200)

```json
{
  "message": "User and all related data deleted successfully",
  "userId": 123,
  "deletedBy": "fullname"
}
```

### Error Responses

#### 400 Bad Request
```json
{
  "error": "Must provide one of: id, email, password_hash, handle, or fullname"
}
```

#### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```
**Cause:** Missing or invalid JWT token

#### 403 Forbidden
```json
{
  "error": "Forbidden: Admin access required"
}
```
**Cause:** Valid token but user is not an admin

#### 404 Not Found
```json
{
  "error": "User not found"
}
```
**Cause:** No user matches the provided identifier

#### 500 Internal Server Error
```json
{
  "error": "Error message here"
}
```

### Cascade Deletion

When a user is deleted, the following related data is automatically deleted (via CASCADE):
- `user_profiles`
- `models`
- `hosts`
- `events`
- `calendar`
- `tracking`

### Example Usage

#### 1. Get Admin Token

```javascript
const loginResponse = await fetch('http://localhost:8787/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'your-password'
  })
});

const { token } = await loginResponse.json();
```

#### 2. Delete by Fullname

```javascript
const response = await fetch('http://localhost:8787/api/users/delete-by', {
  method: 'DELETE',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ 
    fullname: 'Crème Brûlée' 
  })
});

const result = await response.json();
console.log(result);
// {
//   "message": "User and all related data deleted successfully",
//   "userId": 270,
//   "deletedBy": "fullname"
// }
```

#### 3. Delete by Email

```javascript
const response = await fetch('http://localhost:8787/api/users/delete-by', {
  method: 'DELETE',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ 
    email: 'user@example.com' 
  })
});
```

#### 4. Delete by Handle

```javascript
const response = await fetch('http://localhost:8787/api/users/delete-by', {
  method: 'DELETE',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ 
    handle: 'creme-brulee' 
  })
});
```

### cURL Examples

#### Delete by Fullname
```bash
curl -X DELETE http://localhost:8787/api/users/delete-by \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"fullname": "Crème Brûlée"}'
```

#### Delete by Email
```bash
curl -X DELETE http://localhost:8787/api/users/delete-by \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"email": "user@example.com"}'
```

#### Delete by ID
```bash
curl -X DELETE http://localhost:8787/api/users/delete-by \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"id": 123}'
```

### Implementation Details

**Source:** `/Users/bruce/Projects/github/neon/src/api/routes/users.ts` (lines 243-316)

**Middleware Chain:**
1. `authMiddleware` - Validates JWT token
2. `adminMiddleware` - Checks admin role
3. Handler function - Performs deletion

**Database Query:**
```sql
DELETE FROM users WHERE id = $1
```

The CASCADE constraint handles deletion of related records automatically.

### Testing Checklist

- [ ] Obtain admin JWT token via `/api/auth/login`
- [ ] Include token in `Authorization: Bearer <token>` header
- [ ] Provide one identifier in request body
- [ ] Verify user exists before deletion (optional)
- [ ] Check response for `userId` and `deletedBy` fields
- [ ] Confirm related data is deleted (cascade)

### Common Issues

**Issue:** `401 Unauthorized`
- **Solution:** Make sure to include the `Authorization: Bearer <token>` header

**Issue:** `403 Forbidden`
- **Solution:** Ensure the user is an admin (check `isAdmin` in login response)

**Issue:** `404 Not Found`
- **Solution:** Verify the identifier (fullname, email, etc.) is correct and exists

**Issue:** Token expired
- **Solution:** Tokens expire after 7 days. Login again to get a new token

### See Also

- [Authentication Patterns](./authentication-patterns.md) - Full authentication documentation
- [API Schema](./neon-api-schema.dbml) - Database schema
- [Users API](../src/api/routes/users.ts) - Source code
