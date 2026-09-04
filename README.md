# TripOS — Group Trip Operating System

TripOS is a shared trip workspace for friends. It replaces fragmented coordination across chat, notes, spreadsheets, expense apps, and booking emails with one unified platform.

**Core promise:** Everyone knows what is happening, who owns it, what was decided, what has been booked, and who owes whom.

## Project Structure

```
TripOS/
├── apps/
│   ├── api/           # NestJS backend service
│   └── web/           # Next.js frontend application
├── packages/
│   ├── shared/        # Shared types and utilities
│   └── database/      # Prisma schema and migrations
├── Docs/              # Product and engineering documentation
└── package.json       # Turbo monorepo configuration
```

## Tech Stack

- **Frontend:** Next.js 14+ with React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** NestJS with TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Package Manager:** pnpm
- **Build System:** Turbo

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm
- PostgreSQL 15+

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Generate Prisma client
pnpm db:generate

# Run database migrations
pnpm db:migrate

# Start development servers
pnpm dev
```

The application will be available at:
- Frontend: `http://localhost:3000`
- API: `http://localhost:3001`

## Documentation

See [Docs/TripOS Main Doc — Product & Engineering Workspace.md](Docs/TripOS%20Main%20Doc%20—%20Product%20&%20Engineering%20Workspace.md) for complete product and engineering documentation.

## Development Workflow

### Commands

- `pnpm dev` - Start all services in development mode
- `pnpm build` - Build all services for production
- `pnpm test` - Run tests across all services
- `pnpm lint` - Lint all services
- `pnpm typecheck` - Type-check all services

## Implementation Phases

- **Phase 0:** Foundation (repository, Docker, CI)
- **Phase 1:** Authentication, trips, and membership
- **Phase 2:** Itinerary and responsibilities
- **Phase 3:** Expenses and settlements
- **Phase 4:** Trip vault

## License

Proprietary
