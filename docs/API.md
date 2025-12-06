# Neon API Documentation

Complete API reference with working CURL examples for testing with Insomnia or any HTTP client.

**Base URL (Development):** `http://localhost:8787`  
**Base URL (Production):** `https://neon-api.your-domain.workers.dev`

## Table of Contents

- [Authentication](#authentication)
- [Public Endpoints](#public-endpoints)
- [Protected Endpoints](#protected-endpoints)
- [Admin Endpoints](#admin-endpoints)

---

## Authentication

### Register New User

Create a new user account.

**Endpoint:** `POST /api/auth/register`

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "fullname": "John Doe"
}
```

**CURL Example:**

```bash
curl --request POST \
  --url http://localhost:8787/api/auth/register \
  --header 'Content-Type: application/json' \
  --data '{
    "email": "newuser@example.com",
    "password": "securepass123",
    "fullname": "Jane Smith"
  }'
```

**Success Response (201):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 3,
    "email": "newuser@example.com"
  }
}
```

**Error Response (400):**

```json
{
  "error": "Email already registered"
}
```

---

### Login

Authenticate and receive a JWT token.

**Endpoint:** `POST /api/auth/login`

**Request Body:**

```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**CURL Example:**

```bash
curl --request POST \
  --url http://localhost:8787/api/auth/login \
  --header 'Content-Type: application/json' \
  --data '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

**Success Response (200):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "isAdmin": true
  }
}
```

**Error Response (401):**

```json
{
  "error": "Invalid credentials"
}
```

---

## Public Endpoints

These endpoints do not require authentication.

### Get All Venues

Retrieve a list of all active venues.

**Endpoint:** `GET /api/venues`

**CURL Example:**

```bash
curl --request GET \
  --url http://localhost:8787/api/venues
```

**Success Response (200):**

```json
[
  {
    "id": 1,
    "user_id": 1,
    "name": "Art Studio London",
    "week_day": 2,
    "frequency": "weekly",
    "instagram": "@artstudiolondon",
    "website": "https://artstudio.example.com",
    "address": "123 Art Street, London",
    "timezone": "Europe/London",
    "start_time": "19:00:00",
    "duration": 120,
    "postcode": "SW1A 1AA",
    "area": "Central London",
    "price_inperson": 15,
    "price_online": 10,
    "active": 1,
    "tags": ["life drawing", "nude", "beginner-friendly"],
    "organizer_name": "System Administrator"
  }
]
```

---

### Get Venue by ID

Retrieve details of a specific venue.

**Endpoint:** `GET /api/venues/:id`

**CURL Example:**

```bash
curl --request GET \
  --url http://localhost:8787/api/venues/1
```

**Success Response (200):**

```json
{
  "id": 1,
  "user_id": 1,
  "name": "Art Studio London",
  "week_day": 2,
  "start_time": "19:00:00",
  "area": "Central London",
  "active": 1,
  "organizer_name": "System Administrator"
}
```

**Error Response (404):**

```json
{
  "error": "Venue not found"
}
```

---

### Get All Models

Retrieve a list of all active models.

**Endpoint:** `GET /api/models`

**CURL Example:**

```bash
curl --request GET \
  --url http://localhost:8787/api/models
```

**Success Response (200):**

```json
[
  {
    "id": 1,
    "user_id": 2,
    "sex": 2,
    "instagram": "@modelname",
    "portrait": "https://example.com/portrait.jpg",
    "active": 1,
    "fullname": "Model Name",
    "known_as": "Artsy",
    "description": "Professional life drawing model",
    "bio_instagram": "@modelname"
  }
]
```

---

### Get Model by ID

Retrieve details of a specific model.

**Endpoint:** `GET /api/models/:id`

**CURL Example:**

```bash
curl --request GET \
  --url http://localhost:8787/api/models/1
```

**Success Response (200):**

```json
{
  "id": 1,
  "user_id": 2,
  "sex": 2,
  "instagram": "@modelname",
  "portrait": "https://example.com/portrait.jpg",
  "fullname": "Model Name",
  "description": "Professional life drawing model"
}
```

---

### Get All Artists

Retrieve a list of all active artists.

**Endpoint:** `GET /api/artists`

**CURL Example:**

```bash
curl --request GET \
  --url http://localhost:8787/api/artists
```

**Success Response (200):**

```json
[
  {
    "id": 1,
    "user_id": 3,
    "active": 1,
    "fullname": "Artist Name",
    "known_as": "ArtistAlias",
    "instagram": "@artistname",
    "websites": ["https://portfolio.example.com"]
  }
]
```

---

### Get Artist by ID

Retrieve details of a specific artist.

**Endpoint:** `GET /api/artists/:id`

**CURL Example:**

```bash
curl --request GET \
  --url http://localhost:8787/api/artists/1
```

**Success Response (200):**

```json
{
  "id": 1,
  "user_id": 3,
  "fullname": "Artist Name",
  "instagram": "@artistname"
}
```

---

### Get Images by User ID

Retrieve all images for a specific user.

**Endpoint:** `GET /api/images/user/:userId`

**CURL Example:**

```bash
curl --request GET \
  --url http://localhost:8787/api/images/user/2
```

**Success Response (200):**

```json
[
  {
    "id": 1,
    "user_id": 2,
    "type_id": 1,
    "src": "https://example.com/image.jpg",
    "active": 1,
    "type_name": "profile"
  }
]
```

---

## Protected Endpoints

These endpoints require authentication. Include the JWT token in the Authorization header.

### Get Current User Profile

Retrieve the authenticated user's profile.

**Endpoint:** `GET /api/users/me`

**Headers:**

- `Authorization: Bearer YOUR_JWT_TOKEN`

**CURL Example:**

```bash
curl --request GET \
  --url http://localhost:8787/api/users/me \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

**Success Response (200):**

```json
{
  "id": 1,
  "emailaddress": "admin@example.com",
  "active": 1,
  "created_on": "2025-11-30T12:00:00.000Z",
  "fullname": "System Administrator",
  "known_as": null,
  "description": "Main admin account",
  "instagram": null,
  "websites": null
}
```

---

### Update User Bio

Update the authenticated user's biographical information.

**Endpoint:** `PUT /api/users/me/bio`

**Headers:**

- `Authorization: Bearer YOUR_JWT_TOKEN`
- `Content-Type: application/json`

**Request Body:**

```json
{
  "fullname": "John Doe",
  "known_as": "Johnny",
  "description": "Life drawing enthusiast",
  "instagram": "@johndoe",
  "websites": ["https://johndoe.com", "https://art.johndoe.com"]
}
```

**CURL Example:**

```bash
curl --request PUT \
  --url http://localhost:8787/api/users/me/bio \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  --header 'Content-Type: application/json' \
  --data '{
    "fullname": "John Doe",
    "known_as": "Johnny",
    "description": "Life drawing enthusiast",
    "instagram": "@johndoe",
    "websites": ["https://johndoe.com"]
  }'
```

**Success Response (200):**

```json
{
  "id": 2,
  "user_id": 1,
  "fullname": "John Doe",
  "known_as": "Johnny",
  "description": "Life drawing enthusiast",
  "instagram": "@johndoe",
  "websites": ["https://johndoe.com"],
  "modified_on": "2025-11-30T12:30:00.000Z"
}
```

---

### Create Venue

Create a new venue (requires authentication).

**Endpoint:** `POST /api/venues`

**Headers:**

- `Authorization: Bearer YOUR_JWT_TOKEN`
- `Content-Type: application/json`

**Request Body:**

```json
{
  "name": "New Art Studio",
  "week_day": 3,
  "frequency": "weekly",
  "instagram": "@newstudio",
  "website": "https://newstudio.com",
  "address": "456 Creative Lane, Manchester",
  "timezone": "Europe/London",
  "start_time": "18:30:00",
  "duration": 180,
  "postcode": "M1 1AA",
  "area": "Northern Quarter",
  "price_inperson": 12,
  "price_online": 8,
  "tags": ["life drawing", "clothed", "all levels"]
}
```

**CURL Example:**

```bash
curl --request POST \
  --url http://localhost:8787/api/venues \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  --header 'Content-Type: application/json' \
  --data '{
    "name": "New Art Studio",
    "week_day": 3,
    "frequency": "weekly",
    "instagram": "@newstudio",
    "website": "https://newstudio.com",
    "address": "456 Creative Lane, Manchester",
    "timezone": "Europe/London",
    "start_time": "18:30:00",
    "duration": 180,
    "postcode": "M1 1AA",
    "area": "Northern Quarter",
    "price_inperson": 12,
    "price_online": 8,
    "tags": ["life drawing", "clothed", "all levels"]
  }'
```

**Success Response (201):**

```json
{
  "id": 2,
  "user_id": 1,
  "name": "New Art Studio",
  "week_day": 3,
  "start_time": "18:30:00",
  "area": "Northern Quarter",
  "active": 1
}
```

---

### Update Venue

Update an existing venue.

**Endpoint:** `PUT /api/venues/:id`

**Headers:**

- `Authorization: Bearer YOUR_JWT_TOKEN`
- `Content-Type: application/json`

**Request Body:**

```json
{
  "name": "Updated Studio Name",
  "week_day": 4,
  "frequency": "bi-weekly",
  "instagram": "@updatedstudio",
  "website": "https://updated.com",
  "address": "789 New Street",
  "timezone": "Europe/London",
  "start_time": "19:00:00",
  "duration": 120,
  "postcode": "M2 2BB",
  "area": "City Centre",
  "price_inperson": 15,
  "price_online": 10,
  "tags": ["advanced", "portrait"]
}
```

**CURL Example:**

```bash
curl --request PUT \
  --url http://localhost:8787/api/venues/2 \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  --header 'Content-Type: application/json' \
  --data '{
    "name": "Updated Studio Name",
    "week_day": 4,
    "frequency": "bi-weekly",
    "instagram": "@updatedstudio",
    "website": "https://updated.com",
    "address": "789 New Street",
    "timezone": "Europe/London",
    "start_time": "19:00:00",
    "duration": 120,
    "postcode": "M2 2BB",
    "area": "City Centre",
    "price_inperson": 15,
    "price_online": 10,
    "tags": ["advanced", "portrait"]
  }'
```

**Success Response (200):**

```json
{
  "id": 2,
  "name": "Updated Studio Name",
  "week_day": 4,
  "area": "City Centre"
}
```

---

### Create Model

Create a new model profile.

**Endpoint:** `POST /api/models`

**Headers:**

- `Authorization: Bearer YOUR_JWT_TOKEN`
- `Content-Type: application/json`

**Request Body:**

```json
{
  "sex": 1,
  "instagram": "@modelinstagram",
  "portrait": "https://example.com/portrait.jpg",
  "account_holder": "Model Name",
  "account_number": "12345678",
  "account_sortcode": "12-34-56"
}
```

**CURL Example:**

```bash
curl --request POST \
  --url http://localhost:8787/api/models \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  --header 'Content-Type: application/json' \
  --data '{
    "sex": 1,
    "instagram": "@modelinstagram",
    "portrait": "https://example.com/portrait.jpg",
    "account_holder": "Model Name",
    "account_number": "12345678",
    "account_sortcode": "12-34-56"
  }'
```

**Success Response (201):**

```json
{
  "id": 2,
  "user_id": 1,
  "sex": 1,
  "instagram": "@modelinstagram",
  "portrait": "https://example.com/portrait.jpg",
  "active": 1
}
```

---

### Update Model

Update an existing model profile.

**Endpoint:** `PUT /api/models/:id`

**Headers:**

- `Authorization: Bearer YOUR_JWT_TOKEN`
- `Content-Type: application/json`

**Request Body:**

```json
{
  "sex": 2,
  "instagram": "@updatedmodel",
  "portrait": "https://example.com/new-portrait.jpg",
  "account_holder": "Updated Name",
  "account_number": "87654321",
  "account_sortcode": "65-43-21"
}
```

**CURL Example:**

```bash
curl --request PUT \
  --url http://localhost:8787/api/models/2 \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  --header 'Content-Type: application/json' \
  --data '{
    "sex": 2,
    "instagram": "@updatedmodel",
    "portrait": "https://example.com/new-portrait.jpg",
    "account_holder": "Updated Name",
    "account_number": "87654321",
    "account_sortcode": "65-43-21"
  }'
```

**Success Response (200):**

```json
{
  "id": 2,
  "sex": 2,
  "instagram": "@updatedmodel",
  "portrait": "https://example.com/new-portrait.jpg"
}
```

---

### Create Artist

Create a new artist profile.

**Endpoint:** `POST /api/artists`

**Headers:**

- `Authorization: Bearer YOUR_JWT_TOKEN`

**CURL Example:**

```bash
curl --request POST \
  --url http://localhost:8787/api/artists \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

**Success Response (201):**

```json
{
  "id": 2,
  "user_id": 1,
  "active": 1
}
```

---

### Upload Image

Upload a new image for the authenticated user.

**Endpoint:** `POST /api/images`

**Headers:**

- `Authorization: Bearer YOUR_JWT_TOKEN`
- `Content-Type: application/json`

**Request Body:**

```json
{
  "type_id": 1,
  "src": "https://example.com/my-image.jpg"
}
```

**CURL Example:**

```bash
curl --request POST \
  --url http://localhost:8787/api/images \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  --header 'Content-Type: application/json' \
  --data '{
    "type_id": 1,
    "src": "https://example.com/my-image.jpg"
  }'
```

**Success Response (201):**

```json
{
  "id": 1,
  "user_id": 1,
  "type_id": 1,
  "src": "https://example.com/my-image.jpg",
  "active": 1
}
```

---

### Delete Image

Delete an image (soft delete).

**Endpoint:** `DELETE /api/images/:id`

**Headers:**

- `Authorization: Bearer YOUR_JWT_TOKEN`

**CURL Example:**

```bash
curl --request DELETE \
  --url http://localhost:8787/api/images/1 \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

**Success Response (200):**

```json
{
  "message": "Image deleted"
}
```

---

## Admin Endpoints

These endpoints require admin privileges (isAdmin: true).

### Get All Users

Retrieve a list of all users (admin only).

**Endpoint:** `GET /api/users`

**Headers:**

- `Authorization: Bearer YOUR_ADMIN_JWT_TOKEN`

**CURL Example:**

```bash
curl --request GET \
  --url http://localhost:8787/api/users \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

**Success Response (200):**

```json
[
  {
    "id": 1,
    "emailaddress": "admin@example.com",
    "fullname": "System Administrator",
    "active": 1,
    "created_on": "2025-11-30T12:00:00.000Z"
  },
  {
    "id": 2,
    "emailaddress": "test@example.com",
    "fullname": "Test User",
    "active": 1,
    "created_on": "2025-11-30T12:05:00.000Z"
  }
]
```

**Error Response (403):**

```json
{
  "error": "Forbidden: Admin access required"
}
```

---

### Toggle User Status

Toggle a user's active status (admin only).

**Endpoint:** `PATCH /api/users/:id/toggle`

**Headers:**

- `Authorization: Bearer YOUR_ADMIN_JWT_TOKEN`

**CURL Example:**

```bash
curl --request PATCH \
  --url http://localhost:8787/api/users/2/toggle \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

**Success Response (200):**

```json
{
  "message": "User status toggled"
}
```

---

### Delete Venue

Delete a venue (soft delete, admin only).

**Endpoint:** `DELETE /api/venues/:id`

**Headers:**

- `Authorization: Bearer YOUR_ADMIN_JWT_TOKEN`

**CURL Example:**

```bash
curl --request DELETE \
  --url http://localhost:8787/api/venues/2 \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

**Success Response (200):**

```json
{
  "message": "Venue deleted"
}
```

---

### Delete Model

Delete a model (soft delete, admin only).

**Endpoint:** `DELETE /api/models/:id`

**Headers:**

- `Authorization: Bearer YOUR_ADMIN_JWT_TOKEN`

**CURL Example:**

```bash
curl --request DELETE \
  --url http://localhost:8787/api/models/2 \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

**Success Response (200):**

```json
{
  "message": "Model deleted"
}
```

---

### Delete Artist

Delete an artist (soft delete, admin only).

**Endpoint:** `DELETE /api/artists/:id`

**Headers:**

- `Authorization: Bearer YOUR_ADMIN_JWT_TOKEN`

**CURL Example:**

```bash
curl --request DELETE \
  --url http://localhost:8787/api/artists/2 \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

**Success Response (200):**

```json
{
  "message": "Artist deleted"
}
```

---

## Error Responses

### 401 Unauthorized

```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden

```json
{
  "error": "Forbidden: Admin access required"
}
```

### 404 Not Found

```json
{
  "error": "Not found"
}
```

### 400 Validation Error

```json
{
  "error": "Validation error",
  "details": [
    {
      "path": ["email"],
      "message": "Invalid email"
    }
  ]
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal server error"
}
```

---

## Data Types Reference

### Week Days

- `0` = Sunday
- `1` = Monday
- `2` = Tuesday
- `3` = Wednesday
- `4` = Thursday
- `5` = Friday
- `6` = Saturday

### Sex

- `0` = Not specified
- `1` = Male
- `2` = Female

### Image Types

- `1` = profile
- `2` = portfolio
- `3` = venue
- `4` = session

---

## Testing Workflow

### 1. Login as Admin

```bash
curl --request POST \
  --url http://localhost:8787/api/auth/login \
  --header 'Content-Type: application/json' \
  --data '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

Save the returned token.

### 2. Get All Venues (Public)

```bash
curl --request GET \
  --url http://localhost:8787/api/venues
```

### 3. Create a Venue (Authenticated)

```bash
curl --request POST \
  --url http://localhost:8787/api/venues \
  --header 'Authorization: Bearer YOUR_TOKEN_HERE' \
  --header 'Content-Type: application/json' \
  --data '{
    "name": "Test Venue",
    "week_day": 2,
    "frequency": "weekly",
    "website": "https://test.com",
    "address": "123 Test St",
    "timezone": "Europe/London",
    "start_time": "19:00:00",
    "duration": 120,
    "postcode": "SW1A 1AA",
    "area": "Test Area",
    "price_inperson": 10,
    "price_online": 5,
    "tags": ["test"]
  }'
```

### 4. Get Your Profile

```bash
curl --request GET \
  --url http://localhost:8787/api/users/me \
  --header 'Authorization: Bearer YOUR_TOKEN_HERE'
```

---

## Notes

- All timestamps are in ISO 8601 format
- JWT tokens expire after 7 days
- All DELETE operations are soft deletes (set active = 0)
- Tags should be an array of strings
- Websites should be an array of URLs
- Prices are in the smallest currency unit (pence/cents)
- Duration is in minutes
