# 06 — Future Features & Product Extensions

<aside>
🔭

**Roadmap principle:** validate the core group workflow first. Future features should deepen coordination, reduce manual work, or create a defensible product advantage.

</aside>

## Tier 1 — High-value extensions

### AI expense entry

User says: “Rahul paid ₹2,400 for dinner for Rahul, Aman and me.” AI extracts a structured draft. Deterministic server validation is required before persistence.

### Receipt parsing

Upload receipt → extract merchant, total, date and line items → user confirms → create expense draft.

### Smart reminders

Remind the right person about tasks, unpaid settlements, upcoming activities, or missing confirmations based on explicit preferences.

### Calendar integration

Export/import itinerary events with clear conflict and timezone handling.

### Maps integration

Location search, route links, distance estimates and travel-time hints.

## Tier 2 — Collaboration extensions

- Polls for dates, hotels, activities and transport.
- Decision records: question, options, votes, final decision and timestamp.
- Group comments attached to itinerary items/tasks.
- Change history and “what changed?” summaries.
- Shared trip budget with category limits.

## Tier 3 — Finance extensions

- Multi-currency expenses.
- Exchange-rate snapshots at transaction time.
- Receipt line-item splitting.
- Recurring/shared subscriptions during a trip.
- Payment-provider integrations.
- Partial settlement and refunds.
- Expense categories and analytics.

**Important:** payment processing introduces financial, regulatory, fraud and operational complexity. Keep it separate from the core accounting model.

## Tier 4 — Booking/integration ecosystem

- Import flight/train/hotel confirmation emails.
- Booking reference extraction.
- Calendar synchronization.
- Maps/places integration.
- Travel insurance/document reminders.
- Deep links to external booking providers rather than becoming a booking marketplace prematurely.

## Tier 5 — AI Trip Copilot

Potential capabilities:

- Generate itinerary proposals from destination, dates, interests and budget.
- Re-plan when an activity is removed.
- Detect schedule conflicts.
- Summarize trip changes.
- Recommend budget adjustments.
- Turn natural language into structured tasks/expenses.

**AI boundary:** AI proposes and extracts; deterministic domain services validate and commit.

## Tier 6 — Post-trip experience

- Final trip expense report.
- Shared photo/memory timeline.
- Trip highlights.
- Reusable trip templates.
- “Copy this trip” for recurring groups.
- Personal travel history.

## Potential business models

- Free core product.
- Premium trip features/storage.
- Paid AI usage.
- Group/family subscription.
- Affiliate revenue from relevant external travel services, subject to product trust and disclosure.

## Features intentionally deferred

- Full travel booking marketplace.
- Public social network.
- Always-on location tracking.
- Complex recommendation marketplace.
- Crypto/payment experiments.
- Microservices solely for future scale.

## Prioritization framework

Score each proposal from 1–5 on:

**User value × frequency × differentiation × feasibility**, then subtract **risk × operational complexity**.

Only promote features with evidence from pilot usage, interviews, support requests, or measurable behavior.

## Product evolution hypothesis

**Stage A:** trip coordination.

**Stage B:** financial and document reliability.

**Stage C:** intelligent automation.

**Stage D:** integrations and repeat-trip ecosystem.

The product should earn the right to expand at each stage rather than assuming all features are necessary from day one.