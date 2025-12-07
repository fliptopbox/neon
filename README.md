# Neon Admin API

Database admin website with public API using Cloudflare Workers, Neon PostgreSQL, and React.

## 🚀 Features

- **Public API** - RESTful API for venues, models, and artists
- **Admin Dashboard** - React-based admin interface
- **Authentication** - JWT-based auth with user roles
- **Database** - Neon PostgreSQL (serverless)
- **Deployment** - Cloudflare Workers (API) + Cloudflare Pages (Admin)

## 📋 Prerequisites

- Node.js 18+ (LTS)
- Neon PostgreSQL account
- Cloudflare account (for deployment)

## 🛠️ Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file (or use existing one):

```env
NETLIFY_DATABASE_URL=postgresql://user:pass@host/db
JWT_SECRET=your-secret-key-here
```

### 3. Database Setup

Run migrations to create tables:

```bash
npm run db:migrate
```

Seed the database with sample data:

```bash
npm run db:seed
```

This creates:

- Admin user: `admin@example.com` / `admin123`
- Test user: `test@example.com` / `test123`

## 🧪 Development

### Run both API and Admin Dashboard:

```bash
npm run dev
```

Or run them separately:

```bash
# API only (http://localhost:8787)
npm run dev:api

# Admin Dashboard only (http://localhost:3000)
npm run dev:admin
```

## 📦 Build

```bash
npm run build
```

## 🚀 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions.

### Quick Deploy

```bash
# Set production secrets
wrangler secret put DATABASE_URL --env production
wrangler secret put JWT_SECRET --env production

# Build and deploy everything
npm run build
npm run deploy:api
npm run deploy:admin
```

### Environment Variables

**API (Cloudflare Workers secrets):**

- `DATABASE_URL` - Neon PostgreSQL connection string
- `JWT_SECRET` - Secret for signing JWTs

**Admin UI (src/admin/.env.production):**

- `VITE_API_URL` - Your deployed API URL

See `.env.example` files for templates.

## 📁 Project Structure

```
neon/
├── src/
│   ├── api/                    # Cloudflare Worker API
│   │   ├── db/                 # Database utilities
│   │   ├── middleware/         # Auth middleware
│   │   ├── routes/             # API routes
│   │   └── index.ts            # Main API entry
│   └── admin/                  # React Admin Dashboard
│       ├── src/
│       │   ├── components/     # React components
│       │   ├── contexts/       # Auth context
│       │   ├── pages/          # Page components
│       │   ├── App.tsx
│       │   └── main.tsx
│       └── index.html
├── scripts/
│   ├── migrate.js              # Database migrations
│   ├── seed.js                 # Database seeding
│   └── reset.js                # Database reset
├── docs/
│   └── drawSQL-pgsql-export-2025-11-30.sql
├── package.json
├── tsconfig.json
├── vite.config.ts
└── wrangler.toml
```

## 🔌 API Endpoints

### Public Endpoints

- `GET /api/venues` - List all venues
- `GET /api/venues/:id` - Get venue by ID
- `GET /api/models` - List all models
- `GET /api/models/:id` - Get model by ID
- `GET /api/artists` - List all artists
- `GET /api/artists/:id` - Get artist by ID

### Auth Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Protected Endpoints (require JWT)

- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me/bio` - Update user bio
- `POST /api/venues` - Create venue
- `PUT /api/venues/:id` - Update venue
- `DELETE /api/venues/:id` - Delete venue (admin only)
- `POST /api/models` - Create model
- `PUT /api/models/:id` - Update model
- `DELETE /api/models/:id` - Delete model (admin only)

## 🧪 Testing

```bash
npm test
```

## 📝 Database Schema

See `docs/drawSQL-pgsql-export-2025-11-30.sql` for the complete schema.

Main tables:

- `users` - User accounts
- `user_bios` - User profile information
- `models` - Model profiles
- `artists` - Artist profiles
- `venues` - Life drawing venues
- `images` - User images
- `types` - Image types

## 🔒 Admin Access

To make a user an admin, update the database:

```sql
UPDATE users SET is_admin = true WHERE emailaddress = 'user@example.com';
```

## 📄 License

See LICENSE file for details.
