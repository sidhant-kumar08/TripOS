# 07 — Technical Decision Log

# Architecture Review — 2026-09-04

<aside>
✅

**Final MVP direction:** keep TripOS as a modular monolith with PostgreSQL as the transactional source of truth. Avoid infrastructure that does not solve a current product problem.

</aside>

## Confirmed decisions

- Modular monolith: **keep**.
- Next.js + TypeScript frontend: **keep**.
- NestJS + TypeScript backend: **keep**.
- PostgreSQL + Prisma: **keep**.
- REST + OpenAPI: **keep**.
- Integer minor units for money: **keep**.
- One currency per expense in MVP: **keep**.
- Private object storage for Vault: **keep**.
- No real-time collaboration in MVP: **keep**.
- Transactional outbox: **keep as the reliability pattern**, but only introduce delivery infrastructure when asynchronous workloads require it.

## Simplifications

- Redis is **not an MVP dependency**. Add it only for a demonstrated caching, rate-limiting, distributed-state, or queue requirement.
- Background workers are **not required for the first synchronous MVP flows**. Introduce them for slow, retryable, scheduled, or externally integrated work.
- Authentication should favor **secure web sessions/cookies** for the web MVP. Token refresh machinery should be introduced only if a concrete client/API requirement warrants it.
- Do not introduce microservices, Kafka, Kubernetes, Elasticsearch/OpenSearch, or multiple databases without measurable justification.

## Implementation rule

The architecture is considered final enough to start coding. Future changes should be made because of a concrete requirement, measured bottleneck, security need, or product decision — not because a technology is popular or theoretically scalable.

## First implementation target

Build the repository and local development environment first, then implement authentication and the trip/membership foundation before higher-level modules such as itinerary, tasks, expenses, and Vault.

<aside>
📐

**Purpose:** preserve architectural context so future implementation changes are deliberate rather than accidental.

</aside>

## ADR-000 — Support multiple authentication providers

**Status:** Accepted

**Decision:** TripOS MVP supports email/password plus Google, Apple, and Facebook authentication. Provider identities are stored separately from the core TripOS user record, allowing multiple login methods to map to one user account.

**Why:** social login reduces signup friction, while a separate identity model prevents provider-specific fields from contaminating the core user model and supports future providers.

**Security:** provider subject/user ID is the identity key; email alone is not sufficient. Linking and account merging require explicit safety rules.

**Revisit when:** authentication requirements expand to additional clients/providers or a managed identity platform becomes operationally preferable.

## ADR-001 — Start with a modular monolith

**Status:** Accepted

**Decision:** one deployable backend with explicit domain modules.

**Why:** fastest delivery, simpler transactions and local development, lower operational burden. Module boundaries preserve a future extraction path.

**Revisit when:** measured scale, deployment independence or team ownership requires service extraction.

## ADR-002 — PostgreSQL is the financial source of truth

**Status:** Accepted

**Decision:** expenses, payers, splits and settlements are persisted transactionally in PostgreSQL.

**Why:** strong consistency, constraints, transactions and mature query capabilities.

**Revisit when:** no foreseeable need for a different primary store for this domain.

## ADR-003 — Store money as integer minor units

**Status:** Accepted

**Decision:** persist monetary values as integers plus ISO currency code.

**Why:** avoids floating-point errors and makes reconciliation deterministic.

## ADR-004 — One currency per expense in MVP

**Status:** Accepted

**Decision:** an expense has one currency; cross-currency settlement/conversion is deferred.

**Why:** dramatically reduces accounting ambiguity while covering the primary use case.

## ADR-005 — Transactional outbox for async events

**Status:** Accepted

**Decision:** domain events required for reliable asynchronous processing are written to an outbox in the same transaction as the business change.

**Why:** avoids the dual-write failure where DB state commits but event publication fails.

## ADR-006 — AI cannot directly mutate core financial state

**Status:** Accepted

**Decision:** AI can extract or propose structured data, but deterministic application/domain validation must approve writes.

**Why:** probabilistic output must not bypass financial invariants or authorization.

## ADR-007 — No real-time collaboration in MVP

**Status:** Accepted

**Decision:** use normal HTTP plus client revalidation initially; defer websockets.

**Why:** lower complexity and enough for initial trip coordination. Revisit based on observed collaboration friction.

## ADR-008 — Private object storage for trip files

**Status:** Accepted

**Decision:** store file bytes in private object storage and metadata in PostgreSQL.

**Why:** scalable file delivery, separation of concerns and controlled access.

## ADR-009 — Cursor pagination for unbounded collections

**Status:** Accepted

**Decision:** list APIs use cursor pagination where collections can grow.

**Why:** stable performance and pagination semantics under concurrent writes.

## Decision template for future ADRs

**Context:** what changed or what problem exists?

**Options considered:** list viable alternatives.

**Decision:** selected approach.

**Rationale:** why it wins now.

**Consequences:** benefits and costs.

**Revisit criteria:** measurable signals that should trigger reassessment.

## Change policy

A change to a core invariant, data ownership boundary, public API contract, authentication model, financial model, or deployment architecture requires an ADR before implementation is considered complete.