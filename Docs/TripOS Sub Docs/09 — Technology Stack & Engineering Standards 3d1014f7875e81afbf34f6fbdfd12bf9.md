# 09 — Technology Stack & Engineering Standards

<aside>
🔐

**MVP authentication decision:** use secure, short-lived session cookies for the web application unless a concrete client/API requirement makes token-based authentication necessary. Do not introduce JWT refresh-token machinery merely because the application exposes an API.

</aside>

<aside>
🎯

Decision principle: TripOS is being built by one indie developer. Optimize for development speed, simplicity, low operational overhead, maintainability, and strong future escape hatches — not for hypothetical scale.

</aside>

# 1. Purpose

This document defines the technology stack, engineering standards, coding conventions, and technology-adoption rules for TripOS.

It is the **source of truth for technical implementation choices**. AI coding agents should consult this document before introducing a new framework, library, infrastructure component, or coding pattern.

# 2. Solo Developer Engineering Philosophy

TripOS should remain simple enough for one developer to understand and operate.

## Core principles

- Prefer managed services over self-operated infrastructure.
- Prefer boring, proven technology over novelty.
- Prefer one application over distributed systems until distribution is justified.
- Prefer explicit code over excessive abstraction.
- Prefer incremental evolution over premature optimization.
- Minimize the number of technologies that must be maintained.
- Add infrastructure only when a real requirement exists.
- Keep future extraction possible without building future architecture today.

<aside>
⚠️

**Do not solve tomorrow's scaling problem today if doing so makes today's product significantly harder to build.**

</aside>

# 3. Recommended Stack

| Layer | Technology | Adoption | Primary reason |
| --- | --- | --- | --- |
| Language | TypeScript | Now | Type safety across frontend/backend |
| Web application | Next.js | Now | Fast full-stack web development |
| UI | Tailwind CSS | Now | Rapid consistent styling |
| UI components | shadcn/ui | Now | Reusable accessible components |
| Backend | NestJS | Now | Structured modular backend |
| API | REST + OpenAPI | Now | Simple, explicit, debuggable contracts |
| Database | PostgreSQL | Now | Strong relational consistency |
| ORM | Prisma | Now | Productive schema/migration workflow |
| Validation | class-validator / Nest validation | Now | Natural NestJS integration |
| Authentication | Secure session-based auth + OAuth/OIDC providers (Google, Apple, Facebook); token-based API auth only where required | Now | Simple secure web sessions with social sign-in support |
| File storage | S3-compatible object storage | MVP when vault ships | Files should not live in DB |
| Cache | Redis | Later | Add only for demonstrated caching needs |
| Background jobs | BullMQ + Redis | Later | Add when asynchronous work requires it |
| Realtime | WebSockets | Later | Add only when realtime UX requires it |
| Testing | Jest + Supertest | Now | Backend/unit/API confidence |
| API documentation | Swagger/OpenAPI | Now | Human + AI-readable API contract |
| Containers | Docker | Now | Reproducible environments |
| CI | GitHub Actions | Now | Automated verification |
| Error monitoring | Sentry or equivalent | Production | Reduce debugging overhead |
| Logging | Structured application logs | Now | Production diagnostics |
| Observability | OpenTelemetry | Later | Add when system complexity justifies it |
| Search engine | None initially | Avoid for now | PostgreSQL search is sufficient initially |
| Message broker | None initially | Avoid for now | No distributed event infrastructure needed |
| Kubernetes | None | Avoid | Excessive operational burden for solo MVP |

# 4. Architecture Decision

## Modular Monolith

TripOS will start as a **modular monolith**.

```
Next.js
   │
   ▼
NestJS Modular Monolith
   │
   ├── Auth
   ├── Users
   ├── Trips
   ├── Members
   ├── Itinerary
   ├── Expenses
   ├── Tasks
   ├── Vault
   └── Notifications
   │
   ▼
PostgreSQL
```

Modules should have clear ownership and boundaries even though they run in one application.

## Why not microservices?

Microservices would introduce:

- More deployments.
- More networking concerns.
- Distributed debugging.
- Service discovery/configuration.
- More infrastructure.
- More failure modes.
- More AI context required during development.

None of these are justified for the initial product.

A module can be extracted later if there is a concrete reason such as independent scaling, isolation, team ownership, or deployment requirements.

# 5. Technology Adoption Model

Every technology belongs to one of three categories.

## Required Now

Use immediately when implementing the MVP:

- TypeScript.
- Next.js.
- NestJS.
- PostgreSQL.
- Prisma.
- REST/OpenAPI.
- Docker.
- Jest/Supertest.
- GitHub Actions.
- Structured logging.

## Add When Needed

Do not introduce until a real requirement appears:

- Redis.
- BullMQ.
- WebSockets.
- Advanced observability.
- Search infrastructure.
- CDN-specific optimization.
- Additional queues.

## Avoid Initially

- Kubernetes.
- Kafka.
- Microservices.
- Elasticsearch/OpenSearch.
- GraphQL unless a concrete requirement emerges.
- Multiple databases.
- Complex event-driven infrastructure.
- Service mesh.
- Custom authentication infrastructure beyond what the product requires.

# 6. Frontend Standards

## Next.js

Use Next.js as the primary web application framework.

Prefer:

- Server-side rendering/server components where appropriate.
- Client components only when interaction requires them.
- Route handlers only for frontend-specific concerns; business APIs remain in the backend where applicable.
- Shared TypeScript types generated from or aligned with OpenAPI contracts rather than manually duplicated models.

## UI structure

Organize UI by feature/domain rather than one giant components directory.

Example:

```
src/
├── app/
├── components/
│   ├── ui/
│   └── shared/
├── features/
│   ├── trips/
│   ├── expenses/
│   ├── itinerary/
│   └── tasks/
├── lib/
└── types/
```

## Frontend rules

- Keep reusable primitives generic.
- Keep domain-specific components inside their feature.
- Avoid giant components.
- Avoid unnecessary global state.
- Keep server state separate from UI state.
- Validate user input before sending requests.
- Handle loading, empty, error, and success states explicitly.
- Maintain responsive behavior from the beginning.
- Accessibility is a requirement, not a later enhancement.

# 7. Backend Standards

## NestJS module structure

Organize backend code by business domain.

```
src/
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   ├── dto/
│   │   └── strategies/
│   ├── trips/
│   ├── expenses/
│   ├── itinerary/
│   └── tasks/
├── common/
├── config/
├── database/
└── main.ts
```

## Layer responsibilities

### Controller

Responsible for:

- HTTP concerns.
- Request parsing.
- Authentication/authorization decorators/guards.
- DTO validation.
- Response status/shape.

Controllers should remain thin.

### Service

Responsible for:

- Business rules.
- Use cases.
- Transaction orchestration.
- Domain-level validation.

### Repository / data-access layer

Responsible for:

- Database queries.
- Persistence concerns.
- Query composition.

Avoid putting business rules inside database-access code.

### DTO

Responsible for:

- API input/output contracts.
- Validation boundaries.

Do not expose ORM models directly as public API contracts.

# 8. Database Standards

PostgreSQL is the authoritative transactional database.

## Rules

- Use UUIDs or another deliberate stable identifier strategy consistently.
- Store money as integer minor units, not floating-point values.
- Use explicit foreign keys.
- Use database constraints for invariants where practical.
- Add indexes based on query patterns.
- Avoid indexes without a demonstrated access pattern.
- Use migrations for schema changes.
- Never manually modify production schema outside the migration process.
- Treat migrations as version-controlled code.
- Use transactions for multi-step state changes that must be atomic.

## Expense-specific rule

Do not treat a precomputed “who owes whom” table as the authoritative source of truth.

Authoritative data should be the expenses, splits, and settlements from which balances can be derived.

# 9. API Standards

Use REST for the initial product API.

Example:

```
POST   /api/v1/trips
GET    /api/v1/trips/:tripId
PATCH  /api/v1/trips/:tripId
DELETE /api/v1/trips/:tripId

POST   /api/v1/trips/:tripId/expenses
GET    /api/v1/trips/:tripId/expenses
GET    /api/v1/trips/:tripId/balances
```

## API rules

- Version public APIs.
- Use consistent HTTP status codes.
- Use predictable error responses.
- Validate input at the boundary.
- Do not leak internal database errors.
- Use pagination for potentially large collections.
- Define sorting/filtering explicitly.
- Document APIs through OpenAPI.
- Keep backward compatibility in mind for public contracts.

# 10. Authentication & Authorization

Authentication and authorization must be separate concepts.

### Authentication methods

TripOS MVP supports:

- Email/password.
- Google Sign-In.
- Apple Sign-In.
- Facebook Login.

Social providers authenticate the user; TripOS remains the system of record for the TripOS account and session.

Use a provider identity model such as `auth_identities` rather than adding `google_id`, `apple_id`, and `facebook_id` columns directly to `users`. A single TripOS user may have multiple linked authentication identities.

Provider identity keys are `(provider, provider_user_id)` and must be unique. Do not use email alone as the provider identity key.

### Social account linking

- New provider login resolves an existing provider identity before creating a new user.
- If no identity exists, account creation/linking follows explicit safety rules.
- Linking an additional provider requires an authenticated TripOS session or an explicit secure recovery flow.
- Never automatically merge two existing TripOS accounts solely because their emails match.
- Users cannot remove their last usable authentication method.
- Apple private relay addresses must be treated as provider identities, not as a guaranteed permanent email address.

### Session model

For the web MVP, use secure, short-lived session cookies and server-side session validation. Do not add JWT refresh-token machinery unless a concrete mobile/public API requirement makes it necessary.

### Authentication

Answers: **Who is this user?**

### Authorization

Answers: **Can this user perform this action on this trip/resource?**

TripOS should use explicit authorization rules for roles such as:

- Owner.
- Admin.
- Member.

Never rely solely on frontend visibility for authorization.

Authorization must be enforced by the backend.

# 11. Security Standards

Minimum standards:

- Never commit secrets.
- Use environment variables/secret management.
- Hash passwords using a modern password hashing algorithm when passwords are managed directly.
- Use secure token handling.
- Validate and sanitize untrusted input.
- Enforce authorization server-side.
- Apply rate limiting to sensitive endpoints when appropriate.
- Protect file uploads.
- Restrict file types and sizes.
- Do not expose internal storage URLs unnecessarily.
- Avoid logging tokens, passwords, private documents, or sensitive personal information.
- Keep dependencies updated.

# 12. Error Handling

Use consistent application errors.

Errors should communicate:

- What went wrong.
- Whether the client can fix it.
- A stable error/code identifier where useful.

Do not expose:

- Stack traces in production responses.
- SQL errors.
- Secrets.
- Internal infrastructure details.

Use centralized exception handling in the backend.

# 13. Logging Standards

Use structured logs.

A production log should make it possible to answer:

- What happened?
- When did it happen?
- Which request caused it?
- Which user/trip/request identifier is relevant?
- What failed?

Avoid noisy logs for normal successful operations unless they provide operational value.

Never log secrets or sensitive payloads.

# 14. Testing Standards

Testing priority for a solo developer:

### Highest priority

- Business-critical expense calculations.
- Authorization rules.
- Authentication flows.
- Transactional operations.
- API contracts.
- Data integrity.

### Medium priority

- Core trip flows.
- Itinerary operations.
- Task assignment.
- Invitation flows.

### Lower priority

- Purely presentational UI details that are inexpensive to manually verify.

Tests should protect behavior, not implementation details.

# 15. Code Quality Standards

## Naming

Use descriptive names.

Bad:

```tsx
const x = await svc.do(id);
```

Better:

```tsx
const trip = await tripService.getTripById(tripId);
```

## Functions

Prefer small functions with one clear responsibility.

Avoid functions that:

- Validate input.
- Perform multiple unrelated database operations.
- Send notifications.
- Format responses.
- Calculate business rules.

all in one large block.

## Classes

A class should have a coherent responsibility.

Avoid “God services” such as `TripService` containing every operation in the product.

## Comments

Write comments for **why**, not obvious **what**.

Bad:

```tsx
// Increment count by one
count += 1;
```

Useful:

```tsx
// Keep settlement calculations deterministic by using integer minor units.
```

# 16. TypeScript Standards

- Enable strict TypeScript configuration.
- Avoid `any` unless explicitly justified.
- Prefer `unknown` when the type is genuinely unknown.
- Use discriminated unions for state-heavy domain models where appropriate.
- Keep public interfaces explicit.
- Avoid unnecessary type assertions.
- Prefer inferred local types when they remain readable.
- Keep shared types intentional; do not create a giant global types file.

# 17. Git Standards

Use Git from the beginning.

## Commit guidelines

Commits should be:

- Small.
- Focused.
- Descriptive.
- Independently understandable where practical.

Examples:

```
feat(expenses): add equal split calculation
fix(auth): reject expired refresh tokens
refactor(trips): isolate member authorization
chore(db): add trip indexes
```

Avoid giant commits containing unrelated features and refactors.

# 18. Environment Management

Maintain clear environments:

```
Local → Development/Staging → Production
```

Use environment variables for configuration.

Never commit:

- API keys.
- Database credentials.
- JWT secrets.
- Storage credentials.
- Third-party secrets.

Provide a safe `.env.example` containing variable names but no secrets.

# 19. Dependency Management

Before adding a dependency, ask:

1. Do we actually need it?
2. Can the existing stack solve the problem cleanly?
3. Is the dependency maintained?
4. Does it introduce significant complexity?
5. Will a future developer/AI agent understand why it exists?
6. Does its license work for the product?

Avoid adding libraries for trivial functionality.

# 20. Infrastructure Standards

The default infrastructure should be managed services wherever practical.

The goal is:

```
Developer time → Product development
NOT
Developer time → Operating infrastructure
```

Prefer managed:

- PostgreSQL.
- Object storage.
- Deployment.
- Error monitoring.
- Email delivery.
- Authentication components where appropriate.

# 21. Performance Standards

Performance optimization should be evidence-driven.

Start with:

- Correct database indexes.
- Efficient queries.
- Pagination.
- Appropriate caching boundaries.
- Avoiding N+1 queries.
- Reasonable payload sizes.
- Frontend code splitting/lazy loading where useful.

Do not introduce Redis or a dedicated search engine merely because they are common in large systems.

## Performance workflow

```
Measure → Identify bottleneck → Optimize → Measure again
```

# 22. When to Introduce Redis

Redis should be introduced only when one of these becomes real:

- Repeated expensive reads.
- Rate limiting at meaningful scale.
- Distributed session/state requirement.
- Background job infrastructure.
- Short-lived distributed coordination.

Until then, PostgreSQL and application memory are sufficient for many MVP use cases.

# 23. When to Introduce Background Jobs

Use background jobs for work that:

- Is slow.
- Does not need to block the HTTP response.
- Requires retries.
- Is scheduled.
- Is notification-heavy.

Examples:

- Email notifications.
- Reminder delivery.
- File processing.
- AI processing.
- Scheduled trip reminders.

Do not create a queue for ordinary synchronous CRUD operations.

# 24. When to Consider Service Extraction

A module should only become a separate service when there is a demonstrated reason.

Possible triggers:

- Independent scaling requirements.
- Independent deployment cadence.
- Clear resource isolation needs.
- Strong security/isolation requirements.
- Operational ownership changes.
- A module becomes a genuinely independent product capability.

The migration path should be:

```
Modular Monolith
      ↓
Clear Module Boundary
      ↓
Explicit Interface
      ↓
Async/API Boundary if justified
      ↓
Extract Service
```

# 25. AI Coding Agent Standards

AI agents must follow this document when modifying TripOS.

Before coding:

1. Identify the affected module.
2. Read the relevant product/API/data requirements.
3. Check this technology standard.
4. Search the Technical Decision Log for relevant decisions.
5. Inspect existing code.

During coding:

- Follow existing module structure.
- Avoid unnecessary dependencies.
- Keep changes focused.
- Do not introduce infrastructure without justification.
- Preserve API contracts.
- Follow TypeScript strictness.
- Add tests for important behavior.

After coding:

- Run tests.
- Run type checks.
- Run linting.
- Review database migrations.
- Review security implications.
- Update source-of-truth documentation if the contract or architecture changed.

# 26. Standard Definition of Done

A feature is not complete merely because the code works locally.

A feature is considered done when:

- Requirements are satisfied.
- API contracts are correct.
- Authorization is enforced.
- Data integrity is protected.
- Relevant tests exist.
- Type checking passes.
- Linting passes.
- Migration is valid if schema changed.
- Error handling is appropriate.
- Security implications are reviewed.
- Documentation is updated when necessary.

# 27. Technology Review Process

Technology decisions should be reviewed when:

- A major product milestone is reached.
- A recurring bottleneck appears.
- Operational complexity increases.
- A technology becomes difficult to maintain.
- A new requirement cannot be met cleanly by the current stack.

Do not change technologies simply because a newer alternative is popular.

# 28. Final Stack Philosophy

<aside>
🚀

**Build the simplest system that can become a serious product.** TripOS should start with a strong modular foundation, not a large infrastructure footprint. Complexity must be earned by real product requirements, measurable performance problems, or operational evidence.

</aside>

## Authentication provider implementation notes

Social login is a first-class MVP requirement. Initial providers: **Google, Apple, Facebook**.

Implementation rules:

- Use OAuth 2.0 / OpenID Connect according to each provider's supported flow.
- Keep provider credentials/secrets in environment/secret management.
- Validate callback state/CSRF protections and provider-issued identity assertions/tokens server-side.
- Store provider subject/user ID in `auth_identities`; never use email as the sole provider identity key.
- Resolve an existing provider identity before creating a new TripOS user.
- Require an authenticated/safe flow for linking another provider.
- Never silently merge two existing TripOS accounts.
- Do not persist provider access/refresh tokens unless a later product integration genuinely requires them.
- Maintain secure session cookies for the TripOS web application after successful social authentication.