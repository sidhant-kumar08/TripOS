# 04 — Phase-wise Implementation Plan

<aside>
🚀

**Execution rule:** complete each phase's exit criteria before expanding scope. The goal is a production-quality MVP, not maximum feature count.

</aside>

## Phase 0 — Product & engineering foundation

**Goal:** remove ambiguity before coding.

Deliverables:

- PRD approved.
- Architecture baseline approved.
- Data model/API contract reviewed.
- Repository initialized.
- Coding conventions, environment strategy and branching rules documented.
- Local Docker setup.
- CI skeleton: lint, typecheck, unit tests.

Exit criteria: a clean developer can clone, configure, run tests, start dependencies and boot the application.

## Phase 1 — Identity, trips & membership

**Goal:** establish the collaborative trip boundary.

Work:

- Registration/login/session handling.
- User profile.
- Trip CRUD.
- Trip membership model.
- Invitation token generation/acceptance.
- Roles and authorization middleware/guards.
- Trip dashboard API.

Tests:

- Authentication failures.
- Expired/used invitation.
- Duplicate membership.
- Cross-trip access denial.
- Role restrictions.

Exit criteria: creator can create a trip, invite members and securely access shared trip data.

## Phase 2 — Itinerary & responsibilities

**Goal:** make the trip operationally useful.

Work:

- Activity CRUD.
- Participant management.
- Date/time validation.
- Task CRUD and assignment.
- Dashboard aggregation.
- Basic activity feed/audit events.

Tests:

- Time validation.
- Participant authorization.
- Cross-trip object access.
- Concurrent update/version conflict.

Exit criteria: group can build an itinerary and assign/complete responsibilities.

## Phase 3 — Expenses & settlements

**Goal:** deliver the strongest value proposition with financial correctness.

Work:

- Expense command model.
- Payers and splits.
- Equal/custom split calculation.
- Transactional persistence.
- Idempotency.
- Balance calculation.
- Settlement suggestions.
- Settlement records.
- Financial audit history.

Testing strategy:

- Unit tests for split math.
- Property-based tests for reconciliation invariants.
- Integration tests with real PostgreSQL.
- Retry/idempotency tests.
- Concurrent write tests.

Exit criteria: representative real-world group expenses always reconcile exactly and duplicate submissions cannot create duplicate charges.

## Phase 4 — Trip vault

**Goal:** centralize important trip artifacts.

Work:

- File metadata.
- Private object storage.
- Signed/authorized download.
- Upload constraints.
- Receipt/ticket categorization.
- Delete/retention policy.

Exit criteria: members can securely upload and retrieve allowed trip documents.

## Phase 5 — Notifications & asynchronous jobs

**Goal:** reduce manual checking without making the app noisy.

Work:

- Outbox table and worker.
- In-app notification model.
- Email notifications for essential events.
- Retry/backoff/dead-letter handling.
- User notification preferences.

Exit criteria: core events can trigger reliable asynchronous notifications and failed jobs are observable/retriable.

## Phase 6 — Production hardening

**Goal:** make the MVP safe to operate.

Work:

- Rate limits.
- Security review.
- Dependency scanning.
- Structured logs/metrics.
- Error tracking.
- DB backups and restore test.
- Migration safety.
- Load testing critical endpoints.
- CI/CD and staging.
- Production runbook.

Exit criteria: production deployment is reproducible, monitored, backed up and recoverable.

## Phase 7 — Intelligence & integrations

**Goal:** increase differentiation after core behavior is validated.

Candidate work:

- Natural-language expense entry.
- Receipt extraction.
- AI itinerary proposals.
- Calendar/maps integrations.
- Booking email import.
- Smart reminders.

Exit criteria: only features with validated user demand are promoted to committed roadmap work.

## Engineering workflow for every feature

1. Update relevant specification.
2. Create implementation task.
3. Define acceptance criteria and edge cases.
4. Implement domain rules first.
5. Add unit tests.
6. Add integration/API tests.
7. Add observability where needed.
8. Review migration/performance/security impact.
9. Run CI.
10. Update decision log if architecture changed.

## Suggested repository structure

```
apps/
  api/
  web/
packages/
  contracts/
  domain/
  config/
infrastructure/
  docker/
  migrations/
docs/
  adr/
  api/
```

Keep the repository structure aligned with actual ownership; do not create empty abstractions just to match the diagram.

## MVP milestone sequence

**M1:** foundation + auth + trips

**M2:** membership + invitations + authorization

**M3:** itinerary + tasks

**M4:** expenses + balances

**M5:** settlements + vault

**M6:** notifications + hardening

**M7:** pilot with real friend group → fix usability/reliability → release decision