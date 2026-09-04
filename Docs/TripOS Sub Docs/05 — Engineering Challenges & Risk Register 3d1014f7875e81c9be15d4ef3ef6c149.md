# 05 — Engineering Challenges & Risk Register

<aside>
⚠️

**Highest-risk area:** financial correctness. Treat expenses, splits, balances and settlements as a small accounting domain, not ordinary CRUD.

</aside>

## Risk scale

**P0:** can cause security, data loss or incorrect money state.

**P1:** can materially break core product workflows.

**P2:** quality/usability/performance concern with workaround.

## Risk register

| Risk | Priority | Failure mode | Mitigation |
| --- | --- | --- | --- |
| Incorrect expense math | P0 | Users see wrong balances | Integer minor units, invariants, transactions, property tests |
| Duplicate expense | P0 | Retry creates duplicate charge | Idempotency keys + unique command record |
| Unauthorized trip access | P0 | User reads another group's data | Central authorization checks + integration tests |
| Invitation abuse | P0 | Token guessing/reuse | Random opaque token, hash at rest, expiry, single-use |
| File exposure | P0 | Private documents become public | Private bucket, authorization, short-lived signed access |
| Lost concurrent update | P1 | One user's edit overwrites another | Version checks / optimistic concurrency |
| Notification duplication | P1 | Users receive repeated alerts | Outbox + idempotent consumer keys |
| Database bottleneck | P1 | Slow dashboard/expense queries | Indexing, query plans, pagination, measured caching |
| Overengineering | P1 | Delivery slows | Modular monolith and explicit extraction criteria |
| Notification noise | P2 | Users disable notifications | Preferences + event priority |
| AI hallucination | P1 | Incorrect itinerary/expense extraction | AI produces proposals; deterministic validation before writes |
| Currency complexity | P1 | Wrong conversion/accounting | Single-currency-per-expense MVP; explicit conversion model later |
| Time zones | P1 | Activities appear at wrong time | Store UTC instants + trip/user timezone context |
| Data retention | P1 | Old files/data create privacy burden | Retention policy and deletion workflows |

## Deep engineering challenges

### 1. Expense consistency

A successful expense write must atomically create the expense and all payer/split rows. Any failure rolls back the entire command.

### 2. Balance derivation

Balances should be derived from immutable-ish financial records rather than repeatedly mutating a single balance column. Caches can accelerate reads but must be rebuildable.

### 3. Permission boundaries

Every object lookup must be scoped to the authenticated user's accessible trip. Avoid ID-only authorization such as `GET /expenses/{id}` without checking membership and object ownership policy.

### 4. Invitations

Invitation links are bearer credentials. Use high-entropy random values, store only a hash, expire them, and invalidate after acceptance/revocation.

### 5. Collaboration

Trips are collaborative but not necessarily real-time. Start with normal HTTP refresh/revalidation. Add websockets only when the product demonstrates a meaningful need for live updates.

### 6. File security

Never expose storage keys directly. Validate size/content type, scan where justified, and serve through an authorization-controlled mechanism.

### 7. Async reliability

Notifications/integrations must survive worker crashes. Use transactional outbox, retries with exponential backoff, idempotent handlers, and a dead-letter mechanism.

## Performance traps to avoid

- N+1 member/activity/expense queries.
- Loading every trip expense when only recent activity is needed.
- Recalculating large histories synchronously on every dashboard request.
- Unbounded list endpoints.
- Caching mutable financial values without an invalidation/rebuild strategy.

## Security checklist

- [ ]  Password hashing with a modern memory-hard algorithm.
- [ ]  Token/session revocation strategy.
- [ ]  Authorization tests for every trip-scoped resource.
- [ ]  Rate limiting on auth/invitations.
- [ ]  Input/schema validation.
- [ ]  SQL injection protection through parameterized queries/ORM.
- [ ]  XSS-safe rendering of user content.
- [ ]  Secure file access.
- [ ]  Secrets outside source control.
- [ ]  Audit trail for sensitive/financial actions.
- [ ]  Dependency and container scanning.

## Operational failure scenarios to test

- Database unavailable during expense creation.
- Worker crashes after event is written but before delivery.
- Client retries the same expense request.
- Two users edit the same activity.
- Invitation accepted simultaneously twice.
- Object storage unavailable during upload.
- Migration fails halfway through deployment.

## Risk review cadence

Review P0/P1 risks at every release milestone. A risk is not considered mitigated until the relevant failure mode has an automated test or operational control.

## Authentication expansion — added risk coverage

TripOS MVP now supports email/password plus Google, Apple, and Facebook login. Authentication risks must include OAuth/OIDC callback validation, provider identity spoofing, duplicate-account creation, unsafe account linking, provider token/session handling, and Apple private-relay email handling. Provider identity IDs are authoritative; email alone must not be used to automatically merge accounts.