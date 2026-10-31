# Tláloc Constitution

Tláloc is a single Next.js application serving a restaurant: a landing site, a QR menu,
an online reservation flow, and an admin back office. These principles reflect how the
codebase already works; new work must preserve them.

## Core Principles

### I. Bilingual by Default (en / pt)
Every guest-facing string lives in `messages/en.json` and `messages/pt.json` and is
rendered via `next-intl`. Public routes are locale-prefixed (`/en`, `/pt`). API errors
shown to guests and DB content (menu, message templates) carry both English and
Portuguese. A feature is not done until both locales are complete.

### II. Thin Routes, Logic in `src/lib`
API route handlers in `src/app/api/**` only authenticate, validate input, call a store or
service in `src/lib`, publish events, and shape the response. Database access goes
through `*-store.ts` modules using the shared Prisma client (`src/lib/prisma.ts`); pages
and components never query Prisma directly. Business rules (availability, rewards,
confirmation) live in dedicated `src/lib` modules.

### III. Admin Is Private and Server-Verified
Everything under `/admin` and `/api/admin/**` requires a valid signed session cookie,
verified server-side (`admin-request.ts` / `admin-auth.ts`). Public endpoints expose
only what guests need (e.g. availability, reservation creation). Secrets come from
environment variables and are never committed or logged; `.env.example` documents every
variable.

### IV. Reservations Must Never Be Lost
A valid reservation is persisted before any notification is attempted. Email (SMTP) and
WhatsApp (Twilio) are best-effort: a missing config or provider failure is reported as
"skipped"/"failed" and must not fail or roll back the booking. Availability is validated
server-side on submission; client-side checks are only a convenience.
Times are interpreted in `Europe/Lisbon`.

### V. Schema Changes via Migrations
All database changes go through Prisma migrations in `prisma/migrations`, kept
backward-compatible with the running production app where feasible. Dates and times are
stored as `YYYY-MM-DD` / `HH:mm` strings, matching existing models. Reservation v1 and v2
coexist; changes to one must not silently break the other.

### VI. Mobile-First, Fast, SEO-Friendly
Guests mostly arrive via phone and QR code. Public pages must be responsive, accessible,
and light (Vercel Speed Insights is enabled). Landing and menu pages keep proper
metadata, `sitemap.ts`, and `robots.ts` coverage for both locales.

### VII. Intentional Design System
The product is being redesigned in two features: the public site first (`001-public-site-redesign`),
then the admin back office (`002-admin-redesign`). The old brown look is not a constraint.
The visual direction (palette, type, spacing, components) is defined once, as design tokens in
`src/app/globals.css`, and documented in `docs/design.md`; pages and components use those
tokens rather than ad-hoc values. UI work uses the `frontend-design` skill and is planned
before it is built. Until 002 ships, the admin keeps its previous look through the scoped
`.admin-theme` wrapper (`src/app/admin/layout.tsx`); rules shared with the public site must be
mirrored there. The admin redesign is a dense, work-tool design that reuses the same tokens
but is not styled like a marketing page. Accessibility (keyboard focus, contrast, reduced
motion) is a baseline for all UI.

### VIII. Simplicity
Prefer the existing stack and patterns over new dependencies. No new library, service, or
abstraction without a stated need in the plan. Keep the project a single deployable app.

## Technology Constraints

- Next.js 16 (App Router), React 19, TypeScript (strict), `next-intl`, `framer-motion`.
- PostgreSQL (Supabase) via Prisma 7 + `@prisma/adapter-pg`.
- Notifications: Nodemailer (SMTP/Resend) and Twilio WhatsApp.
- Hosting: Vercel; non-canonical `*.vercel.app` hosts redirect to the canonical domain
  (see `middleware.ts`).
- Admin live updates use server-sent events (`/api/admin/reservations/stream`).

## Development Workflow & Quality Gates

- Work follows Spec Kit: `/speckit-specify` → `/speckit-clarify` → `/speckit-plan` →
  `/speckit-tasks` → `/speckit-implement`. Specs live in `specs/<NNN-feature>/`.
- Before merging: `npm run lint` and `npm run build` must pass. The project has no
  automated test suite yet; each spec must therefore define manual acceptance steps, and
  any non-trivial pure logic (e.g. availability, rewards) should be introduced with tests
  when a test runner is added.
- Commits use short, imperative messages (conventional prefixes like `feat:`/`chore:`
  are welcome).
- Plans must include a "Constitution Check" against the principles above.

## Governance

This constitution supersedes ad-hoc practice. Amendments are made via
`/speckit-constitution`, with a version bump and a note on what changed and why. Any
deviation from a principle must be justified in the relevant plan's complexity section.

**Version**: 1.2.0 | **Ratified**: 2026-10-31 | **Last Amended**: 2026-10-31
