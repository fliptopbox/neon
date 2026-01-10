# Port Configuration Fix

## Issue

The `add-model/script.js` was trying to connect to the API on port **8788**, but the API server is actually running on port **8787**.

### Error Message
```
POST http://localhost:8788/api/register/model net::ERR_CONNECTION_REFUSED
Network error: Failed to fetch
```

## Root Cause

From the `npm run dev` output:
```
[wrangler:info] Ready on http://localhost:8787
```

The Wrangler dev server runs on port **8787** by default, not 8788.

## Fix Applied

**File:** `/Users/bruce/Projects/github/neon/src/www/add-model/script.js`

**Line 480:**
```javascript
// Before:
const response = await fetch('http://localhost:8788/api/register/model', {

// After:
const response = await fetch('http://localhost:8787/api/register/model', {
```

## Port Configuration Summary

| Service | Port | URL |
|---------|------|-----|
| **API Server** (Wrangler) | 8787 | http://localhost:8787 |
| **Frontend** (Python HTTP) | 8000 | http://localhost:8000 |
| **Admin UI** (Vite) | 3000 | http://localhost:3000 |

## Testing

The add-model form should now work correctly. Try:

1. Navigate to http://localhost:8000/add-model/
2. Fill out the form
3. Submit

The form will now correctly connect to the API on port 8787.

## Related Files

If you need to update API endpoints in other files, search for:
```bash
grep -r "8788" src/www/
```

All API calls should use port **8787**.
