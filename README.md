<div align="center">
  <img src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&auto=format&fit=crop&q=80" alt="TripOS Banner" width="100%" height="280" style="object-fit: cover; border-radius: 16px; max-height: 280px;" />

  # 🧭 TripOS — Group Trip Operating System
  
  **Turn chaotic group trips into effortless memories.**

  [![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
  [![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?style=flat-square&logo=nestjs)](https://nestjs.com/)
  [![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)](https://prisma.io/)
  [![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Storage-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
  [![pnpm](https://img.shields.io/badge/pnpm-Turbo%20Monorepo-F69220?style=flat-square&logo=pnpm)](https://pnpm.io/)

  <p align="center">
    TripOS is a unified workspace for friends traveling together. It replaces fragmented coordination across WhatsApp, Apple Notes, Google Sheets, Splitwise, and lost booking emails with one central operating system.
  </p>
</div>

---

## 🌟 Key Features

- 👥 **Group Workspaces & Roles**: Role-based permissions (Organizer, Editor, Viewer) with secure tokenized invite links.
- 📅 **Dynamic Itinerary & Timelines**: Day-by-day scheduling with activity categories, locations, times, and member assignment.
- 💸 **Fair Expense Splitting & Debt Minimization**: Real-time multi-currency expense ledger, customizable split ratios, and automated settlement suggestions.
- 🗄️ **Encrypted Trip Vault**: Store e-tickets, hotel booking PDFs, and vouchers with in-app document & image preview powered by **Supabase Storage**.
- 🔐 **Authentication & OAuth**: Complete auth suite with JWT session cookies, password reset, and **Google / Facebook OAuth** integration.
- ⚡ **Dual Database Engine**: Switch effortlessly between **Supabase Cloud PostgreSQL** and **Local PostgreSQL** with a single environment flag (`DB_TARGET`).
- 🎨 **Modern Aesthetics**: Built with Tailwind CSS, glassmorphic dark/light mode, smooth micro-interactions, and 3D globe visualizations.

---

## 🏗️ Architecture & Monorepo Structure

```
TripOS/
├── apps/
│   ├── api/                 # NestJS backend (REST API, Pino Logger, Swagger, Guards)
│   └── web/                 # Next.js 14 App Router (Tailwind CSS, Lucide icons, Framer Motion)
├── packages/
│   ├── database/            # Prisma ORM schema, client generator, and dynamic DB runner
│   └── shared/              # Shared TypeScript types, DTO interfaces, and constants
├── turbo.json               # Turborepo task pipeline configuration
└── package.json             # Monorepo workspaces definition
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: `v20+`
- **pnpm**: `v9+` (`npm i -g pnpm`)
- **Database**: PostgreSQL 15+ (or a free [Supabase](https://supabase.com) project)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/sidhant-kumar08/TripOS.git
cd TripOS
pnpm install
```

### 2. Configure Environment Variables
Copy the template files:
```bash
cp apps/api/.env.example apps/api/.env
cp packages/database/.env.example packages/database/.env
```

Edit `apps/api/.env` and `packages/database/.env`:

```env
# Set database target: "supabase" | "local"
DB_TARGET="supabase"

# Local PostgreSQL
LOCAL_DATABASE_URL="postgresql://tripos_user:password@localhost:5432/tripos_dev"
LOCAL_DIRECT_URL="postgresql://tripos_user:password@localhost:5432/tripos_dev"

# Supabase Cloud PostgreSQL
SUPABASE_DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
SUPABASE_DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# Supabase Storage (Trip Vault & Avatars)
SUPABASE_URL="https://[PROJECT_REF].supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
SUPABASE_VAULT_BUCKET="trip-vault"
SUPABASE_AVATARS_BUCKET="avatars"

# Security & JWT
JWT_SECRET="your-secure-jwt-secret"
JWT_EXPIRATION=3600
SESSION_SECRET="your-session-secret"
```

### 3. Sync Database Schema
Push the Prisma models to your active database target (`Supabase` or `Local`):
```bash
pnpm --filter @tripos/database run db:push
```

### 4. Start Development Servers
```bash
pnpm dev
```

The services will be accessible at:
- 🌐 **Web App:** [http://localhost:3000](http://localhost:3000)
- 🔌 **API Server:** [http://localhost:3001](http://localhost:3001)
- 📚 **Swagger API Docs:** [http://localhost:3001/api/docs](http://localhost:3001/api/docs)

---

## 🛠️ Development Scripts

| Command | Action |
| :--- | :--- |
| `pnpm dev` | Start both Web & API dev servers in watch mode |
| `pnpm build` | Compile and build all apps for production |
| `pnpm lint` | Run ESLint across all workspaces |
| `pnpm typecheck` | Run TypeScript type validation across the entire project |
| `pnpm --filter @tripos/database run db:push` | Push schema changes to the selected DB target |
| `pnpm --filter @tripos/database run db:studio` | Launch Prisma Studio visual database editor |

---

## 🔒 Security & Privacy

- **Input Validation**: Strict whitelist validation via `class-validator` and `ValidationPipe`.
- **Sensitive Data Redaction**: Automatic redaction of passwords, tokens, cookies, and secrets in application logs.
- **Signed Storage URLs**: Time-limited signed URLs for all private travel documents in the Vault.
- **Password Security**: State-of-the-art Argon2 password hashing.

---

## 📚 Project Documentation

- 🏛️ **[System Architecture & Technical Design](Docs/ARCHITECTURE.md)**: Deep dive into the modular monolith, RBAC guards, financial ledger algorithm, and deployment infrastructure.
- 🎯 **[Product Specification & Features](Docs/PRODUCT_SPEC.md)**: Product requirements, user journeys, core modules, and post-MVP roadmap.
- 🛠️ **[Major Problems & Solutions](Docs/PROBLEMS_AND_SOLUTIONS.md)**: Incident logs and architectural resolutions across TypeScript, Docker, CI/CD, and multi-cloud hosting.
- 🗄️ **[Database ERD (dbdiagram.io)](Docs/schema.dbml)**: Complete DBML schema ready for copy-pasting into [dbdiagram.io](https://dbdiagram.io).

---

## 📄 License

Proprietary © 2026 TripOS Team. All rights reserved.

