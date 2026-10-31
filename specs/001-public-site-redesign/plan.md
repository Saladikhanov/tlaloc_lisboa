# Implementation Plan: Public Site Redesign

**Branch**: `001-public-site-redesign` (create from `chore/adopt-spec-kit` once that is committed) | **Date**: 2026-10-31 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-public-site-redesign/spec.md`

## Summary

Replace the brown-and-gold look of the public pages (landing, menu, booking) with the
"Daylight + Lluvia" direction in `docs/design.md`: a light, photo-first page anchored by
deep rain-teal, chile red as the single accent, new typefaces, and the mascot used
purposefully. This is a visual and copy change only; no data, API, or business rules change.

Approach: define the new palette and type as CSS custom properties once, **freeze the
current look for the admin** so it is unaffected, then migrate public surfaces in slices
(shell → landing → menu → booking → states), and finish with contrast, accessibility and
performance audits.

## Technical Context

**Language/Version**: TypeScript 5, React 19.2, Next.js 16.1 (App Router)

**Primary Dependencies**: `next-intl` 4, `next/font/google`, `framer-motion` (already installed). No new dependencies.

**Storage**: N/A (no schema or data changes)

**Testing**: No automated suite. Manual acceptance (see [quickstart.md](./quickstart.md)), `npm run lint`, `npm run build`, a contrast-check script, and the `web-design-guidelines` + `vercel-react-best-practices` audits.

**Target Platform**: Mobile-first web (iOS Safari, Android Chrome) plus desktop; Vercel hosting.

**Project Type**: Web application (single Next.js app).

**Performance Goals**: Landing main content in under 3 s on typical mobile (SC-007); no layout shift from images or fonts.

**Constraints**: Bilingual en/pt parity; admin unchanged; reservation behavior unchanged; WCAG 2.1 AA; reduced motion respected.

**Scale/Scope**: 3 public routes × 2 locales, ~1 shared stylesheet (2,959 lines, ~257 color literals), 8 public components.

## Constitution Check

*GATE: passed before research; re-checked after design (still passes).*

| Principle | Status | Note |
|---|---|---|
| I. Bilingual | Pass | Copy edits touch both `messages/*.json` together; pt layout tested for longer text. |
| II. Thin routes / logic in lib | Pass | No route or `src/lib` logic changes. |
| III. Admin private | Pass | Admin untouched functionally; legacy look frozen behind a scoped theme. |
| IV. Reservations never lost | Pass | Booking logic, validation, availability and notifications unchanged (FR-006). |
| V. Migrations | Pass | No schema change. |
| VI. Mobile-first / SEO | Pass | Metadata, sitemap and robots unchanged; manifest colors and OG image updated. |
| VII. Intentional design system | **Satisfied by this feature** | Tokens in one place; `docs/design.md` is the source. |
| VIII. Simplicity | Pass | No new dependency; fonts swap one set for another; single stylesheet kept. |

No violations, so Complexity Tracking is empty.

## Key Decisions (details in [research.md](./research.md))

1. **Tokens first, in `:root`, with the admin frozen.** Admin pages get a scoped class that restores today's variable values and background, so the redesign cannot leak into the back office.
2. **One stylesheet, sectioned.** Keep `src/app/globals.css`; no CSS framework, no CSS-in-JS. Replace literals with tokens as each slice is migrated.
3. **Fonts:** Bricolage Grotesque (headings) + Figtree (body) via `next/font`, replacing Geist, Geist Mono, Bebas Neue and Pacifico (four families → two). Checkpoint: confirm in the browser with the real hero and Portuguese text before committing to the pairing.
4. **Hero:** a real dish photo full-bleed with text only; remove the three stacked blurred background layers and scrim.
5. **Copy cleanup:** delete the unused placeholder keys from both message files; the discount banner stays removed (already commented out).
6. **Brand surfaces outside CSS:** update `manifest.ts` colors, review/replace `og_image.jpg`, and favicon/icon colors if they carry the old brown.

## Project Structure

### Documentation (this feature)

```text
specs/001-public-site-redesign/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── design-tokens.md
├── checklists/requirements.md
└── tasks.md              # created later by /speckit-tasks
```

### Source Code (repository root)

```text
docs/design.md                         # direction (source of truth for look)
scripts/check-contrast.mjs             # NEW: AA check for every token pair
messages/en.json, messages/pt.json     # remove unused placeholder keys; copy edits
public/                                # OG image, hero photo set, mascot usage
src/app/
├── globals.css                        # tokens + migration of public styles; admin scoped theme
├── layout.tsx                         # fonts swap, body class
├── manifest.ts                        # theme/background colors
├── page.module.css                    # DELETE (unused starter file)
├── admin/                             # wrap in scoped legacy theme (no logic change)
└── [locale]/
    ├── page.tsx                       # landing
    ├── menu/page.tsx                  # menu
    └── reserve/                       # booking
src/components/
├── public-nav.tsx, site-footer.tsx    # shell
├── home-gallery.tsx, home-open-status.tsx, delivery-button.tsx
├── menu-quick-find.tsx
└── reserve-flow.tsx                   # booking UI (visual only)
```

**Structure Decision**: Single Next.js app, no new directories except `scripts/` (already
present, currently empty) for the contrast check. Admin files are touched only to attach the
scoped theme.

## Phasing

| Slice | Delivers | Spec stories |
|---|---|---|
| 0. Foundations | Tokens, fonts, admin freeze, contrast script, body/manifest colors | US4 base |
| 1. Shell | Nav, footer, buttons, focus states | US4, US5 |
| 2. Landing | Hero, status, hours, gallery, FAQ/SEO block, copy cleanup | US1 |
| 3. Menu | Sections, quick-find, dish rows, vegetarian marker | US2 |
| 4. Booking | Calendar, slots, form errors, confirmation, mascot states | US3 |
| 5. States and polish | Closed, empty, error, not-found, OG image, icons | US4 |
| 6. Audits | Contrast, keyboard, reduced motion, performance, both audit skills | US5 |

Each slice is shippable on its own because tokens fall back safely; the site never ships a
half-brown, half-new page within a single route.

## Risks

- **Admin leakage** (shared `:root`): mitigated by the scoped theme in Slice 0; verified by opening `/admin` before and after.
- **2,959-line stylesheet** with duplicated rules: migrate by slice and delete dead rules as touched; avoid specificity fights (known pitfall, see `frontend-design`).
- **Portuguese text is longer**: test every slice in pt at 360 px width.
- **No automated tests**: booking regressions are guarded by the manual scenarios in the quickstart; no logic files are edited.
