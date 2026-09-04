# Getting Started with TripOS

## Prerequisites

- **Node.js 20+** ([download](https://nodejs.org))
- **pnpm** (`npm install -g pnpm`)
- **PostgreSQL 15+** ([download](https://www.postgresql.org/download/))

## Quick Setup (Local Development)

### 1. Clone and Install

```bash
cd d:\Coding\TripOS
pnpm install
```

### 2. Set Up PostgreSQL

Create a PostgreSQL database for development:

```bash
# Using psql
psql -U postgres
CREATE DATABASE tripos_dev;
CREATE USER tripos_user WITH PASSWORD 'tripos_password';
ALTER ROLE tripos_user WITH CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE tripos_dev TO tripos_user;
```

Or use Docker:

```bash
docker run --name tripos-postgres \
  -e POSTGRES_USER=tripos_user \
  -e POSTGRES_PASSWORD=tripos_password \
  -e POSTGRES_DB=tripos_dev \
  -p 5432:5432 \
  -d postgres:15
```

### 3. Configure Environment Variables

**Backend API** (`apps/api/.env`):

```bash
# Copy from example
cp apps/api/.env.example apps/api/.env

# Edit and set:
PORT=3001
NODE_ENV=development
DATABASE_URL="postgresql://tripos_user:tripos_password@localhost:5432/tripos_dev"
JWT_SECRET="your-super-secret-key-change-in-production"
JWT_EXPIRATION=3600
SESSION_SECRET="your-session-secret-change-in-production"
```

**Frontend** (`apps/web/.env.local`):

```bash
# Copy from example
cp apps/web/.env.example apps/web/.env.local

# Usually these are fine as-is:
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Database** (`packages/database/.env`):

```bash
# Copy from example
cp packages/database/.env.example packages/database/.env

# Edit and set:
DATABASE_URL="postgresql://tripos_user:tripos_password@localhost:5432/tripos_dev"
```

### 4. Initialize Database

Generate Prisma client and run migrations:

```bash
# From root directory
pnpm db:generate
pnpm db:migrate:dev

# This will create the schema and ask if you want to create migration
# Name it something like "init" for initial schema
```

### 5. Start Development Servers

From the root directory, run all services in parallel:

```bash
pnpm dev
```

This will start:

- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:3001`
- **API Documentation**: `http://localhost:3001/api/docs` (Swagger UI)

### 6. Verify Everything Works

1. Open `http://localhost:3000` in your browser
2. You should see the TripOS home page
3. Try registering a new account
4. After login, you should see the dashboard

## Project Structure

```
TripOS/
├── apps/
│   ├── api/              # NestJS backend (port 3001)
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   └── modules/
│   │   │       ├── auth/
│   │   │       ├── users/
│   │   │       ├── trips/
│   │   │       └── [more modules]
│   │   └── package.json
│   │
│   └── web/              # Next.js frontend (port 3000)
│       ├── app/
│       │   ├── page.tsx              # Home page
│       │   ├── auth/
│       │   │   ├── login/page.tsx
│       │   │   └── register/page.tsx
│       │   ├── dashboard/page.tsx    # Trip dashboard
│       │   └── trips/
│       │       └── [tripId]/page.tsx # Trip detail
│       ├── lib/
│       │   ├── api.ts                # API client
│       │   ├── auth-context.tsx      # Auth state management
│       │   └── protected-route.tsx
│       └── package.json
│
├── packages/
│   ├── database/         # Prisma schema & migrations
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   ├── .env.example
│   │   └── package.json
│   │
│   └── shared/           # Shared TypeScript types
│       ├── types/
│       ├── index.ts
│       └── package.json
│
├── Docs/                 # Product & engineering docs
├── .github/
│   └── workflows/
│       └── ci.yml        # GitHub Actions CI
├── package.json          # Monorepo root
├── pnpm-workspace.yaml   # Workspace config
└── README.md
```

## Common Commands

### Development

```bash
# Start all services in watch mode
pnpm dev

# Start only backend
cd apps/api && pnpm dev

# Start only frontend
cd apps/web && pnpm dev

# View database with Prisma Studio
pnpm db:studio
```

### Building

```bash
# Build all services
pnpm build

# Build specific app
cd apps/api && pnpm build
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
cd apps/api && pnpm test:cov
```

### Code Quality

```bash
# Lint all services
pnpm lint

# Type-check all services
pnpm typecheck
```

### Database

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations in dev mode (creates new if needed)
pnpm db:migrate:dev

# Push schema to database (dev only)
pnpm db:push

# Launch Prisma Studio (visual DB browser)
pnpm db:studio
```

## API Documentation

Once the API is running, visit:

```
http://localhost:3001/api/docs
```

This is a Swagger UI that documents all endpoints.

### Authenticate API Requests

1. Visit the `POST /auth/register` endpoint in Swagger
2. Register a test account
3. Copy the returned `accessToken`
4. Click "Authorize" button (top right)
5. Paste: `Bearer <your-access-token>`
6. Now all requests will include authentication

## Phase 1 Completion Checklist

- [x] Repository initialized with monorepo structure
- [x] NestJS backend scaffolding
- [x] Next.js frontend scaffolding
- [x] Prisma database schema
- [x] PostgreSQL setup
- [x] Authentication module (register/login)
- [x] Users module
- [x] Trips module (create, list, get, invite, accept invitation)
- [x] Basic test suite setup
- [x] GitHub Actions CI workflow
- [x] API documentation (Swagger)
- [x] Frontend authentication flow
- [x] Dashboard and trip pages
- [x] Environment configuration

## Troubleshooting

### Port already in use

```bash
# If port 3000 or 3001 is taken, you can change them:
# Frontend: Update NEXT_PUBLIC_API_URL in apps/web/.env.local
# Backend: Update PORT in apps/api/.env
```

### Database connection error

```bash
# Check if PostgreSQL is running
psql -U tripos_user -d tripos_dev -h localhost

# If connection fails, verify:
# 1. PostgreSQL service is running
# 2. DATABASE_URL is correct
# 3. Username and password match
```

### Prisma client not found

```bash
# Regenerate Prisma client
pnpm db:generate
```

### Dependencies not installing

```bash
# Clear pnpm cache
pnpm store prune

# Reinstall
pnpm install
```

## Next Steps

After Phase 1 is working:

1. **Phase 2** - Implement Itinerary & Tasks (see [04 — Phase-wise Implementation Plan](../Docs/TripOS%20Sub%20Docs/04%20%E2%80%94%20Phase-wise%20Implementation%20Plan%203d1014f7875e815d88b3eeca8ffee64e.md))
2. **Phase 3** - Implement Expenses & Settlements
3. **Phase 4** - Implement Trip Vault

For detailed requirements, see the documentation in `Docs/` folder.

## Getting Help

- **API Issues**: Check `http://localhost:3001/api/docs` for endpoint documentation
- **Database Issues**: Run `pnpm db:studio` to inspect data
- **Frontend Issues**: Check browser console and Next.js terminal output
- **Documentation**: See `Docs/` folder for product & engineering specs
