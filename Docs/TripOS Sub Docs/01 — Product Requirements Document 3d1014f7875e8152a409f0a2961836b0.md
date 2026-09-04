# 01 — Product Requirements Document

<aside>
🎯

**Purpose:** define what TripOS should solve, who it serves, what belongs in MVP, and how we decide whether the product is working.

</aside>

## 1. Problem

Friend groups currently coordinate trips across WhatsApp/Telegram, spreadsheets, notes, expense splitters, maps, booking emails, and cloud storage. Context is fragmented and responsibility is ambiguous.

TripOS centralizes the shared operational state of a trip.

## 2. Target users

**Primary:** a group organizer who creates and coordinates a trip for roughly 3–15 friends.

**Secondary:** invited participants who primarily consume information, respond to activities, record expenses, and complete assigned tasks.

## 3. Jobs to be done

- Plan a trip collaboratively without repeated chat messages.
- Know the current itinerary and changes.
- Record shared spending accurately.
- Know exactly who owes whom.
- Assign and track trip responsibilities.
- Keep important trip information in one place.

## 4. Product principles

- Group-first rather than individual-first.
- Structured state over ephemeral chat.
- Simple common workflows; advanced controls when needed.
- Financial correctness over convenience shortcuts.
- Explicit permissions and auditability.
- Progressive complexity.

## 5. MVP scope

### Authentication

- Email/password authentication.
- Session/token management.
- Profile basics.

### Trips and membership

- Create/update/archive trip.
- Destination and dates.
- Invite link/token.
- Join/leave trip.
- Owner/admin/member roles.
- Membership status and access checks.

### Itinerary

- Create/update/delete activities.
- Start/end time, location, notes, estimated cost.
- Participant list.
- Chronological day view.

### Tasks

- Create task.
- Assign member.
- Due date.
- Open/completed state.

### Expenses

- Amount, currency, description, category, date.
- One or more payers.
- Equal or custom participant shares.
- Validation that shares reconcile exactly to expense amount.
- Member balances.
- Simplified settlement suggestions.
- Settlement recording.

### Trip vault

- Secure references/files for tickets, receipts, confirmations, and notes.
- Access restricted to trip members.

## 6. Explicit non-goals for MVP

- In-app hotel/flight purchasing.
- Payment processing.
- Full chat replacement.
- Social feed.
- Complex recommendation engine.
- Microservice architecture.
- Multi-region deployment.
- Advanced AI agent workflows.

## 7. Core user journeys

### Create trip

Sign in → create trip → enter destination/dates → invite friends → trip dashboard.

### Plan

Dashboard → itinerary → add activity → choose participants → assign owner/task where needed.

### Spend

Member adds expense → chooses payer(s) → chooses split rule → server validates → balance projection updates.

### Settle

Open balances → view simplified debts → record settlement → balances update with immutable financial history.

## 8. Functional requirements

- Every protected trip operation must verify authenticated identity and trip membership.
- Only authorized roles may change trip-wide settings or membership.
- Expense totals and splits must be stored using integer minor currency units.
- Financial records must preserve an audit trail.
- Deleted entities should not silently destroy financial history.
- Concurrent updates must not produce invalid financial state.

## 9. Non-functional requirements

- API p95 target for normal reads: <300 ms under expected MVP load.
- API p95 target for normal writes: <500 ms excluding asynchronous work.
- Financial writes are transactional.
- Passwords are never stored in plaintext.
- Sensitive files use private storage and signed/authorized access.
- Logs contain correlation IDs and must avoid secrets and unnecessary personal data.
- Automated unit/integration tests cover critical domain rules.

## 10. Success metrics

**Activation:** percentage of creators who invite at least one participant and add one trip item.

**Collaboration:** percentage of trips with multiple active contributors.

**Core value:** percentage of trips with at least one expense and/or completed task.

**Retention proxy:** percentage of users who create or join another trip within a defined period.

**Reliability:** failed financial writes, duplicate expenses, authorization incidents, notification failure rate.

## 11. Acceptance criteria for MVP

A small friend group can create a trip, invite participants, build an itinerary, assign responsibilities, record real expenses, see correct balances, record settlement, and retrieve trip documents without needing another system for the core workflow.

## 12. Open product questions

- Should guest/non-account participants be supported initially?
- Is a trip vault necessary in v1 or can it be deferred?
- Which notification events are essential?
- What is the smallest feature set that makes groups switch from their existing workflow?
- Which metric gates investment into advanced features?

## Authentication update

TripOS MVP supports **email/password, Google Sign-In, Apple Sign-In, and Facebook Login**. Social authentication is treated as an account-access mechanism; the TripOS user remains the canonical application identity. Multiple provider identities may be linked to one TripOS user.

The product must prevent accidental duplicate accounts and must not use provider email alone as the identity key. Account linking requires explicit authenticated/safe flows.