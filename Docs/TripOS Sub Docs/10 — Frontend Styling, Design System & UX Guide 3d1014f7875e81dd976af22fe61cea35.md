# 10 — Frontend Styling, Design System & UX Guide

<aside>
🎨

**Purpose:** This is the single source of truth for TripOS frontend styling, UI design, UX behavior, component standards, accessibility, responsive design, and frontend packages. AI coding agents and developers should follow this document whenever building or modifying the TripOS frontend.

</aside>

# 1. Product Design Direction

TripOS must feel like a **modern consumer travel product**, not a generic admin dashboard or enterprise SaaS application.

Core design qualities:

- Modern
- Clean
- Friendly
- Trustworthy
- Spacious
- Fast to understand
- Mobile-first
- Accessible to non-technical users
- Powerful without feeling complicated

Primary UX principle:

> **Users should understand what they can do next without needing instructions.**
> 

TripOS should feel closer to a polished combination of modern travel, productivity, and financial apps than a traditional dashboard.

# 2. Frontend Technology & Packages

## Required packages

| Package | Purpose | Policy |
| --- | --- | --- |
| `next` | React framework, routing, rendering | Required |
| `react` | UI library | Required |
| `typescript` | Type safety | Required |
| `tailwindcss` | Utility-first styling | Required |
| `shadcn/ui` | Accessible reusable UI primitives | Required |
| `lucide-react` | Consistent icon system | Required |
| `class-variance-authority` | Component variants | Recommended with shadcn/ui |
| `clsx` | Conditional class composition | Required |
| `tailwind-merge` | Safe Tailwind class merging | Required |
| `next-themes` | Dark/light/system theme handling | Required |
| `motion` | Purposeful UI animation | Recommended |
| `react-hook-form` | Form state management | Recommended |
| `zod` | Client-side schema validation | Required for complex forms |
| `@hookform/resolvers` | Zod + React Hook Form integration | Required when using both |
| `date-fns` | Date manipulation and formatting | Recommended |
| `recharts` | Charts and visual analytics | Use when charts are required |
| `sonner` | Toast notifications | Recommended |
| `cmdk` | Command palette / quick actions | Add when needed |
| `vaul` | Mobile-friendly drawers | Add when needed |
| `embla-carousel-react` | Carousels | Add only when required |

Do not add UI libraries simply because they contain a component we could build with existing primitives. Prefer the existing design system.

# 3. Styling Foundation

## CSS architecture

Use Tailwind CSS as the primary styling mechanism.

Rules:

- Avoid large custom CSS files.
- Avoid inline styles unless there is a genuine dynamic styling requirement.
- Use design tokens instead of hard-coded repeated values.
- Use CSS variables for theme-dependent colors.
- Keep component styling close to the component.
- Prefer semantic class composition over deeply nested selectors.
- Do not introduce another styling framework.

## Design tokens

The application must define centralized tokens for:

- Background
- Foreground/text
- Muted text
- Primary action
- Secondary action
- Destructive action
- Borders
- Input surfaces
- Cards
- Popovers
- Success
- Warning
- Error
- Info
- Focus ring

Use semantic tokens such as `background`, `foreground`, `muted`, `primary`, `destructive`, rather than feature-specific colors.

# 4. Color System

Use a restrained neutral-first palette.

Principles:

- Neutral surfaces should dominate the interface.
- One recognizable TripOS accent should establish brand identity.
- Semantic colors communicate meaning, not decoration.
- Never use color as the only way to communicate state.

Recommended semantic usage:

- Primary/accent → primary actions and selected states
- Green → success, paid, completed
- Amber/yellow → pending, attention, approaching deadline
- Red → errors, destructive actions, money owed where appropriate
- Blue → informational states
- Neutral → default content and secondary information

Avoid:

- Rainbow dashboards
- Excessive gradients
- Saturated backgrounds behind large amounts of text
- Using different colors for every feature
- Low-contrast gray text

# 5. Typography

Preferred fonts:

- **Inter** for a highly neutral/product-focused interface
- **Geist** as an alternative if the visual direction favors a more modern Next.js ecosystem feel

Use one primary font family consistently.

Typography hierarchy:

- Display: major marketing/product moments only
- H1: page title
- H2: major section
- H3: subsection/card heading
- Body: primary readable content
- Small: metadata and supporting information
- Caption: low-priority contextual information

Rules:

- Use font weight to establish hierarchy.
- Do not use many font sizes on one screen.
- Keep paragraph line length comfortable.
- Never use tiny text for important information.
- Numbers such as balances and totals should be visually prominent.

# 6. Spacing System

Use a consistent spacing scale based primarily on Tailwind spacing tokens.

Preferred rhythm:

- 4px: micro spacing
- 8px: compact spacing
- 12px: control spacing
- 16px: standard component spacing
- 24px: section spacing
- 32px: large separation
- 48px+: page-level separation

Principle:

> **Whitespace is a feature.**
> 

Do not compress screens simply to fit more information.

# 7. Border Radius & Surfaces

Use a modern but restrained radius system:

- Small controls: 8px
- Inputs/buttons: 8–10px
- Cards: 12–16px
- Large feature surfaces: 16–20px
- Pills: fully rounded only when semantically appropriate

Avoid excessive rounded containers where everything looks like a floating card.

Cards should generally use:

- subtle border
- minimal shadow
- clear internal spacing
- strong content hierarchy

Use shadows to establish elevation, not decoration.

# 8. Layout Principles

TripOS is mobile-first.

Desktop:

- Persistent sidebar can be used for primary navigation.
- Main content should have a comfortable maximum width.
- Secondary panels can appear when useful.

Mobile:

- Use bottom navigation for primary destinations where appropriate.
- Use drawers/sheets instead of oversized desktop modals.
- Keep primary actions reachable with the thumb.
- Avoid horizontal scrolling except for genuinely horizontal content.

Suggested responsive breakpoints:

- Mobile: `<640px`
- Tablet: `640px–1024px`
- Desktop: `1024px+`
- Large desktop: `1280px+`

Do not design only for standard device widths. Components must gracefully adapt between breakpoints.

# 9. Navigation

Primary TripOS navigation should remain predictable.

Suggested product navigation:

- Home / Trip overview
- Itinerary
- Money / Expenses
- Tasks
- Vault
- Members

Desktop:

- Sidebar navigation
- Current trip context always visible
- Clear active state

Mobile:

- Bottom navigation for the most important destinations
- More/secondary actions in a menu or sheet
- Trip selector accessible without leaving the current context

Never make users guess where a feature lives.

# 10. Buttons

Button hierarchy:

1. Primary — one dominant action per area
2. Secondary — supporting actions
3. Ghost — low-emphasis actions
4. Destructive — irreversible or dangerous actions
5. Icon button — compact utility actions with accessible labels

Rules:

- Button text must describe the action.
- Prefer `Add expense` over `Submit`.
- Prefer `Create trip` over `Continue` when the action is final.
- Avoid multiple visually dominant buttons competing in the same area.
- Show loading state after submission.
- Prevent accidental duplicate submissions.

# 11. Forms & Input UX

Forms must be designed for completion, not merely data collection.

Rules:

- Ask only for information required at that moment.
- Group related fields.
- Use sensible defaults.
- Preserve entered data when validation fails.
- Validate near the relevant field.
- Show clear human-readable errors.
- Use appropriate input types on mobile.
- Use autocomplete where useful.
- Do not make users re-enter information unnecessarily.

For complex flows, use progressive disclosure rather than showing every option at once.

Example expense flow:

`Amount → Paid by → Participants → Split method → Optional details`

# 12. Progressive Disclosure

TripOS must support both casual and power users.

Default UI should expose the common 80% use case.

Advanced options should be available through:

- `More options`
- expandable sections
- drawers
- secondary dialogs
- contextual menus

Example:

`Split equally` should be the default.

Advanced options:

- Custom amounts
- Percentage
- Shares
- Excluded participants

Do not make beginners understand advanced financial concepts before they can record a simple expense.

# 13. Cards & Information Density

Cards should represent meaningful groups of information.

Good uses:

- Trip summary
- Expense summary
- Upcoming activity
- Task requiring attention
- Booking/document preview

Bad uses:

- Wrapping every text block in a card
- Nesting cards inside cards without reason
- Using cards as a replacement for layout

Use lists when users need to scan many similar items.

# 14. Itinerary UX

The itinerary should answer three questions immediately:

1. What is happening?
2. When is it happening?
3. Where is it happening?

Prioritize:

- Date
- Time
- Activity
- Location
- Participants

Secondary information:

- Estimated cost
- Notes
- Booking reference

Use timeline/list/calendar representations where they improve comprehension. Do not force users into a complex calendar when a simple chronological list is easier.

# 15. Expense UX

Expense UX must be extremely simple because it will be used frequently during trips.

The primary flow should be fast enough to complete in seconds.

Important visual hierarchy:

- Amount
- Expense title
- Payer
- Who participated
- Current user's resulting balance

Always make it obvious:

- Who paid
- Who owes
- How much
- Whether the expense is settled

Avoid financial jargon where simpler language works.

# 16. Tasks UX

Tasks represent commitments, not generic project-management tickets.

A task should make these obvious:

- What needs to happen?
- Who owns it?
- When is it due?
- Is it complete?

Use clear status indicators and owner avatars.

Example:

`Rahul → Book Airbnb → Due Sep 12 → Pending`

# 17. Trip Vault UX

The vault should feel trustworthy and organized.

Show:

- Document type
- Name
- Related booking/activity when available
- Uploaded date
- Preview/download action

Use recognizable document/file icons.

Avoid exposing technical storage terminology to users.

# 18. Empty States

Empty states should help users take the next action.

Bad:

`No expenses found.`

Better:

`No expenses yet`

`Add your first trip expense so everyone can see who paid.`

`[Add expense]`

Every important empty state should answer:

- What is missing?
- Why does it matter?
- What can I do next?

# 19. Loading States

Prefer skeletons for content-heavy screens.

Use spinners only for short, localized operations.

Rules:

- Avoid flashing empty screens before content loads.
- Match skeleton shapes to the expected content.
- Preserve layout while loading.
- Buttons should show an in-progress state during mutations.

# 20. Error States

Errors should be actionable and human-readable.

Bad:

`500 Internal Server Error`

Better:

`We couldn't save this expense.`

`Your changes weren't saved. Please try again.`

`[Try again]`

Never expose:

- Stack traces
- SQL errors
- Internal service names
- Sensitive technical information

# 21. Toasts & Notifications

Use toasts for lightweight confirmation and non-blocking feedback.

Examples:

- `Expense added`
- `Task completed`
- `Invitation sent`

Do not use toasts for information users must read before continuing.

Use dialogs/sheets for decisions that require attention.

Avoid excessive notifications. Users should not feel constantly interrupted.

# 22. Modals, Dialogs & Drawers

Use dialogs for:

- Confirmation
- Focused forms
- Important decisions

Use drawers/sheets for:

- Mobile forms
- Contextual details
- Filters
- Secondary actions

Avoid giant modal workflows that behave like entire pages.

Destructive actions should require clear confirmation when consequences are significant.

# 23. Accessibility

Accessibility is a product requirement, not a later enhancement.

Requirements:

- Semantic HTML
- Keyboard navigation
- Visible focus states
- Sufficient color contrast
- Accessible labels
- Accessible form errors
- Screen-reader-friendly icon buttons
- Do not rely on color alone
- Respect reduced-motion preferences
- Touch targets should generally be at least ~44px on mobile

Use shadcn/ui primitives where possible because they provide accessible foundations, but verify actual behavior in TripOS flows.

# 24. Icons

Use `lucide-react` as the standard icon library.

Rules:

- One icon style throughout the product.
- Icons should reinforce meaning, not replace important labels.
- Icon-only buttons require accessible labels/tooltips.
- Do not mix random icon libraries.

Examples:

- Plus → add
- Check → completed
- Calendar → itinerary/date
- Wallet → expenses
- Users → members
- CheckSquare → tasks
- Folder → vault

# 25. Animation & Motion

Use `motion` selectively.

Animation should communicate:

- State change
- Navigation
- Hierarchy
- Feedback
- Spatial relationship

Good examples:

- Sheet entering/exiting
- Expense successfully added
- Task completion
- Expand/collapse
- Subtle page transitions

Avoid:

- Constant floating elements
- Long transitions
- Decorative animations on every component
- Motion that slows down frequent workflows

Respect `prefers-reduced-motion`.

# 26. Dark Mode

Dark mode must be designed, not simply inverted.

Rules:

- Use semantic CSS variables.
- Avoid pure black as the default large background unless specifically designed that way.
- Maintain readable contrast.
- Reduce excessive borders and shadows where appropriate.
- Test charts, images, dialogs, forms, and status colors in both modes.

Support:

- Light
- Dark
- System preference

# 27. Responsive & Touch UX

Mobile interactions must be intentional.

Rules:

- Minimum comfortable touch targets.
- Avoid hover-only functionality.
- Avoid tiny dropdown controls.
- Use bottom sheets for mobile contextual actions where appropriate.
- Keep important actions within easy reach.
- Use sticky actions only when they genuinely improve completion.

# 28. Tables vs Lists

Avoid traditional dense tables on mobile.

Use:

- Lists
- Cards
- Responsive rows
- Expandable details

Tables are acceptable for genuinely tabular information, especially desktop financial/admin views, but must have a mobile representation.

# 29. Search, Filters & Sorting

Filtering should be progressive.

Start with the most useful filter.

Advanced filters can live inside a sheet/popover.

Always make active filters visible.

Provide a clear way to reset filters.

Do not create complex filter interfaces for datasets that users rarely need to filter.

# 30. Feedback & Optimistic UI

Use immediate feedback where safe.

Examples:

- Completing a task can immediately update the UI.
- Adding a participant can update membership UI after successful confirmation.

For operations where correctness is critical, do not falsely show success before the server confirms it.

The UI must clearly distinguish:

- Saving
- Saved
- Failed

# 31. UX for Different User Types

TripOS should work for:

- First-time users
- Non-technical users
- Frequent travelers
- Power users
- Users on mobile
- Users with accessibility needs

Principles:

- Use plain language.
- Minimize required decisions.
- Provide sensible defaults.
- Keep advanced controls discoverable but hidden until needed.
- Never assume users understand product terminology.
- Explain unusual concepts contextually.

# 32. First-Time User Experience

The first experience should establish value quickly.

Recommended flow:

`Sign up → Create/join trip → Add people → See trip overview → Add first activity/expense`

Avoid forcing users through long onboarding before they can experience the product.

Use contextual empty states to teach the product.

# 33. Design System Component Structure

Recommended frontend structure:

```
src/
├── app/
├── components/
│   ├── ui/
│   └── shared/
│       ├── Navbar/
│       ├── Sidebar/
│       ├── BottomNav/
│       ├── EmptyState/
│       ├── LoadingState/
│       ├── ErrorState/
│       └── PageHeader/
├── features/
│   ├── auth/
│   ├── trips/
│   ├── itinerary/
│   ├── expenses/
│   ├── tasks/
│   └── vault/
├── lib/
└── types/
```

`components/ui` contains generic primitives.

`components/shared` contains reusable TripOS-wide components.

`features/*` contains domain-specific UI and logic.

Do not put expense-specific components in `components/ui`.

Example:

`features/expenses/components/ExpenseCard.tsx`

# 34. Component Design Rules

Every reusable component should have:

- Clear responsibility
- Predictable props
- Accessible behavior
- Responsive behavior
- Loading/error considerations where relevant
- Variants only when genuinely needed

Avoid:

- Giant components
- Components containing unrelated business logic
- Deeply coupled feature components
- One-off styling copied across many files

Extract a component when:

- It is reused
- It represents a meaningful UI pattern
- It has independent behavior
- Reuse improves consistency

Do not extract components merely to make files shorter.

# 35. UX Writing

UI copy should be:

- Short
- Clear
- Friendly
- Action-oriented
- Human

Prefer:

`Add expense`

`Invite friends`

`Book accommodation`

`Mark as paid`

Avoid:

`Execute operation`

`Submit data`

`Perform action`

Use consistent terminology throughout the product.

# 36. Data Visualization

Use `recharts` only when visualization improves understanding.

Potential TripOS charts:

- Trip spending by category
- Spending over time
- Contribution by member

Charts must:

- Work in light and dark mode
- Have readable labels
- Provide accessible supporting information
- Not rely only on color
- Remain useful on mobile

Do not turn simple numbers into charts unnecessarily.

# 37. Performance Rules

Frontend styling must not come at the cost of performance.

Rules:

- Prefer CSS transitions for simple animations.
- Lazy-load heavy components when appropriate.
- Optimize images.
- Avoid unnecessary client components.
- Avoid excessive JavaScript for purely visual behavior.
- Avoid large UI libraries when existing primitives solve the problem.
- Keep first-load experience fast.

# 38. Frontend Package Adoption Rules

**Use now:**

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide React
- clsx
- tailwind-merge
- class-variance-authority
- next-themes

**Use as product flows require them:**

- React Hook Form
- Zod
- date-fns
- Sonner
- Motion
- Recharts
- cmdk
- Vaul

**Avoid initially:**

- Multiple component libraries
- Multiple icon libraries
- Bootstrap
- Material UI unless a future architectural decision explicitly changes this standard
- Styled Components as a second styling system
- Emotion as a second styling system
- Large animation frameworks when CSS is sufficient

# 39. AI Coding-Agent Frontend Rules

Before changing frontend code, the agent must identify:

1. Which feature is being changed.
2. Which reusable UI components already exist.
3. Which design tokens apply.
4. Which responsive behavior is required.
5. Which accessibility requirements apply.

The agent must:

- Reuse existing components.
- Follow this guide before inventing new patterns.
- Avoid adding packages without justification.
- Avoid introducing a second styling approach.
- Test mobile and desktop states.
- Test loading, empty, success, and error states for meaningful flows.
- Preserve established terminology.

If a new UI pattern is introduced repeatedly, update this guide or the shared design system rather than creating isolated implementations.

# 40. Frontend Definition of Done

A frontend feature is complete only when:

- [ ]  Requirements are implemented.
- [ ]  UI follows this design system.
- [ ]  Responsive behavior is implemented.
- [ ]  Keyboard/accessibility behavior is considered.
- [ ]  Loading state exists where needed.
- [ ]  Empty state exists where needed.
- [ ]  Error state exists where needed.
- [ ]  Success/feedback behavior exists where needed.
- [ ]  Forms have useful validation and errors.
- [ ]  Buttons prevent accidental duplicate submission.
- [ ]  Dark mode has been considered.
- [ ]  No unnecessary dependency was added.
- [ ]  Existing shared components were reused where appropriate.
- [ ]  Mobile and desktop layouts were checked.
- [ ]  TypeScript passes.
- [ ]  Lint passes.
- [ ]  Relevant tests pass.

# 41. Non-Negotiable Design Principles

1. **UX over decoration.**
2. **Clarity over density.**
3. **Consistency over novelty.**
4. **Mobile-first, not mobile-later.**
5. **Progressive disclosure over overwhelming users.**
6. **Accessibility is part of quality.**
7. **Use color for meaning.**
8. **Use animation with purpose.**
9. **One design system, not a collection of libraries.**
10. **Build reusable patterns, not duplicated screens.**
11. **Make the next action obvious.**
12. **The product should feel simple even when the underlying system is complex.**

<aside>
🚀

**Target outcome:** TripOS should look polished enough to feel like a serious consumer product while remaining simple enough that a first-time, non-technical user can successfully create a trip, invite friends, add an activity, record an expense, and understand their responsibilities without documentation.

</aside>