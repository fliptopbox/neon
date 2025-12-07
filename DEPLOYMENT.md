# 🚀 Deployment Guide

This guide explains how to deploy your Neon Admin application to Cloudflare.

## Architecture

Your application has two components:

1. **API** - Cloudflare Workers (Hono backend)
2. **Admin UI** - Cloudflare Pages (React frontend)

## Prerequisites

- [Cloudflare account](https://dash.cloudflare.com/sign-up)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed
- Neon PostgreSQL database (already configured)

## Environment Variables

### API Environment Variables

The API uses secrets stored in Cloudflare Workers:

```bash
DATABASE_URL  # Your Neon PostgreSQL connection string
JWT_SECRET    # Secret key for signing JWTs (use a strong random string in production!)
```

### Admin UI Environment Variables

The admin UI uses Vite environment variables:

**Development** (`src/admin/.env.development`):

```env
# Leave empty to use Vite proxy (connects to localhost:8787)
VITE_API_URL=
```

**Production** (`src/admin/.env.production`):

```env
# Set to your deployed Cloudflare Workers URL
VITE_API_URL=https://neon-api-production.fliptopbox.workers.dev
```

## Step-by-Step Deployment

### 1. Login to Cloudflare

```bash
wrangler login
```

This opens your browser to authenticate with Cloudflare.

### 2. Set Production Secrets

Set your secrets for the production environment:

```bash
# Set your Neon database URL
wrangler secret put DATABASE_URL --env production

# Set a strong JWT secret (NOT the same as development!)
wrangler secret put JWT_SECRET --env production
```

When prompted, paste the values. **Important**: Use a new, secure random string for JWT_SECRET in production!

Generate a secure JWT secret:

```bash
# On macOS/Linux
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3. Deploy the API

```bash
npm run deploy:api
```

Or explicitly for production:

```bash
wrangler deploy --env production
```

After deployment, you'll see a URL like:

```
https://neon-api-production.YOUR-SUBDOMAIN.workers.dev
```

**Copy this URL** - you'll need it for the next step!

### 4. Update Admin Production Config

Edit `src/admin/.env.production` and set the API URL:

```env
VITE_API_URL=https://neon-api-production.YOUR-SUBDOMAIN.workers.dev
```

### 5. Build and Deploy Admin UI

```bash
# Build the admin UI with production settings
npm run build:admin

# Deploy to Cloudflare Pages
npm run deploy:admin
```

Follow the prompts to create a new Pages project. You'll get a URL like:

```
https://YOUR-PROJECT-NAME.pages.dev
```

### 6. Update CORS Settings

After deployment, update `src/api/index.ts` to allow requests from your Pages domain:

```typescript
const allowedOrigins = [
  "http://localhost:3000",
  "https://YOUR-PROJECT-NAME.pages.dev", // Add your Pages URL
];
```

Then redeploy the API:

```bash
npm run deploy:api
```

## Testing Your Deployment

### Test the API

```bash
# Health check
curl https://neon-api-production.YOUR-SUBDOMAIN.workers.dev/

# Test authentication
curl -X POST https://neon-api-production.YOUR-SUBDOMAIN.workers.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

### Test the Admin UI

1. Open your Pages URL in a browser
2. Login with your seeded credentials:
   - Email: `admin@example.com`
   - Password: `admin123`
3. Navigate through the dashboard, models, venues, etc.
4. Test creating/editing/deleting records

## Automated Deployment Script

For easier deployment, use the provided script:

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

This script will:

1. ✅ Check that secrets are set
2. 🔨 Build both API and Admin
3. 🚀 Deploy API to Workers
4. 🚀 Deploy Admin to Pages
5. ✅ Run smoke tests

## Environment-Specific URLs

### Development

- API: `http://localhost:8787`
- Admin: `http://localhost:3000`

### Production

- API: `https://neon-api-production.YOUR-SUBDOMAIN.workers.dev`
- Admin: `https://YOUR-PROJECT-NAME.pages.dev`

## Custom Domains (Optional)

### For Workers API

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to Workers & Pages > neon-api-production
3. Click "Triggers" tab
4. Add a custom domain

### For Pages

1. Go to Workers & Pages > YOUR-PROJECT-NAME
2. Click "Custom domains" tab
3. Add your domain

## Troubleshooting

### "Worker threw exception" errors

- Check that secrets are set: `wrangler secret list --env production`
- Verify DATABASE_URL is correct
- Check Cloudflare Workers logs

### CORS errors

- Ensure your Pages domain is in `allowedOrigins` in `src/api/index.ts`
- Redeploy the API after updating CORS settings

### Admin UI shows "Network Error"

- Verify `VITE_API_URL` in `src/admin/.env.production` is correct
- Check browser console for exact error
- Test API endpoint directly with curl

### 401 Unauthorized

- Ensure JWT_SECRET is set in production
- Check that you're using valid credentials
- Verify token is being sent in Authorization header

## Monitoring

### View Logs

```bash
# Tail production logs
wrangler tail --env production

# View specific errors
wrangler tail --env production --format=json | grep ERROR
```

### Check Metrics

Visit [Cloudflare Dashboard](https://dash.cloudflare.com) > Workers & Pages to view:

- Request counts
- Error rates
- Response times
- Bandwidth usage

## Rollback

If you need to rollback to a previous version:

### Workers

```bash
# List deployments
wrangler deployments list --env production

# Rollback to a specific version
wrangler rollback VERSION_ID --env production
```

### Pages

In the Cloudflare Dashboard:

1. Go to Workers & Pages > YOUR-PROJECT-NAME
2. Click "Deployments" tab
3. Find previous deployment
4. Click "..." menu > "Rollback to this deployment"

## Security Checklist

- [ ] Changed JWT_SECRET from development value
- [ ] DATABASE_URL uses connection pooling (`-pooler` in URL)
- [ ] CORS origins restricted to actual domains
- [ ] Admin credentials changed from defaults
- [ ] HTTPS enforced (automatic with Cloudflare)
- [ ] Secrets stored in Cloudflare (not in code)

## Support

For issues specific to:

- **Cloudflare Workers**: [Workers Docs](https://developers.cloudflare.com/workers/)
- **Cloudflare Pages**: [Pages Docs](https://developers.cloudflare.com/pages/)
- **Neon Database**: [Neon Docs](https://neon.tech/docs)
