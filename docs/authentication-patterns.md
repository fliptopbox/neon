# Authentication Patterns in Neon API

## Overview

The Neon API uses **JWT (JSON Web Token)** authentication with role-based access control (RBAC). The authentication system is implemented using `@tsndr/cloudflare-worker-jwt`.

## Authentication Flow

### 1. Registration (`POST /api/auth/register`)

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "fullname": "John Doe"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "isAdmin": true
  },
  "message": "Admin account created"
}
```

**Notes:**
- The **first user** to register automatically becomes an admin
- Password must be at least 8 characters
- A user profile is automatically created with a handle derived from the fullname

### 2. Login (`POST /api/auth/login`)

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "isAdmin": true
  }
}
```

**Notes:**
- Only active users (`is_global_active = true`) can log in
- Updates the user's `date_last_seen` timestamp

## JWT Token Structure

The JWT payload contains:

```typescript
interface JWTPayload {
  userId: number;
  email: string;
  isAdmin: boolean;
}
```

**Token Expiration:** 7 days

## Middleware

### `authMiddleware`

**Purpose:** Validates JWT token and extracts user information

**Usage:**
```typescript
app.get("/protected", authMiddleware, async (c) => {
  const user = c.get("user") as JWTPayload;
  // user.userId, user.email, user.isAdmin
});
```

**Behavior:**
- Expects `Authorization: Bearer <token>` header
- Returns `401 Unauthorized` if token is missing or invalid
- Sets `user` context variable with decoded JWT payload

### `adminMiddleware`

**Purpose:** Restricts access to admin users only

**Usage:**
```typescript
app.delete("/admin-only", authMiddleware, adminMiddleware, async (c) => {
  // Only admins can access this endpoint
});
```

**Behavior:**
- Must be used **after** `authMiddleware`
- Returns `403 Forbidden` if user is not an admin
- Checks `user.isAdmin` from the JWT payload

## Protected Endpoints

### Admin-Only Endpoints

All of these require both `authMiddleware` and `adminMiddleware`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/` | List all users with profile info |
| PUT | `/api/users/:id` | Update user and profile |
| PATCH | `/api/users/:id/toggle` | Toggle user active status |
| PATCH | `/api/users/:id/toggle-admin` | Toggle admin status |
| DELETE | `/api/users/:id` | Delete user by ID |
| DELETE | `/api/users/delete-by` | Delete user by various identifiers |

### User Endpoints

These require only `authMiddleware`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/me` | Get current user profile |
| PUT | `/api/users/me/profile` | Update own profile |

## Making Authenticated Requests

### Example: Delete User by Fullname

```javascript
// 1. Login first
const loginResponse = await fetch('http://localhost:8787/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'admin-password'
  })
});

const { token } = await loginResponse.json();

// 2. Use token for authenticated request
const deleteResponse = await fetch('http://localhost:8787/api/users/delete-by', {
  method: 'DELETE',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`  // ← Include token here
  },
  body: JSON.stringify({ fullname: 'John Doe' })
});

const result = await deleteResponse.json();
```

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```
**Causes:**
- Missing `Authorization` header
- Invalid token format (not `Bearer <token>`)
- Expired token
- Invalid signature

### 403 Forbidden
```json
{
  "error": "Forbidden: Admin access required"
}
```
**Causes:**
- Valid token but user is not an admin
- Attempting to access admin-only endpoint

## Security Notes

1. **Password Hashing:** Passwords are hashed using a custom `hashPassword` function that includes the email as salt
2. **JWT Secret:** Stored in `c.env.JWT_SECRET` (Cloudflare Workers environment variable)
3. **First User Admin:** The first user to register automatically becomes an admin
4. **Token Expiration:** Tokens expire after 7 days
5. **Active Users Only:** Only users with `is_global_active = true` can authenticate

## Testing Authentication

### Create First Admin User

```bash
curl -X POST http://localhost:8787/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "secure-password",
    "fullname": "Admin User"
  }'
```

### Login and Get Token

```bash
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "secure-password"
  }'
```

### Use Token for Authenticated Request

```bash
TOKEN="your-jwt-token-here"

curl -X DELETE http://localhost:8787/api/users/delete-by \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "fullname": "User To Delete"
  }'
```

## Summary

The `/api/users/delete-by` endpoint requires:
1. ✅ Valid JWT token in `Authorization: Bearer <token>` header
2. ✅ User must be an admin (`isAdmin: true` in JWT payload)
3. ✅ One of: `id`, `email`, `password_hash`, `handle`, or `fullname` in request body

This is why the test failed with `401 Unauthorized` - the request was missing the authentication token.
