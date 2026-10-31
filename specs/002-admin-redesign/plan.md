# Implementation Plan: Admin Back Office Redesign

**Branch**: `002-admin-redesign` | **Date**: 2026-10-31 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-admin-redesign/spec.md`

## Summary

Give the admin a new shell and a light and dark theme, then migrate its screens in four
stages while the rest keeps its current look. The change is visual and usability only: no
behavior, data, permission, notification or API change.

Approach:
1. **Tokens first.** Admin-only semantic tokens (`--a-*`) with a light and a dark value set,
   switched by one attribute on `<html>`, kept in a separate stylesheet that only admin routes load.
2. **A new shell** (glass top bar and tabs on desktop, bottom tab bar and a "More" sheet on phones, theme
   switch, sign out) that replaces the row of tab buttons inside the big admin component.
3. **A "legacy island" wrapper** around every tab that is not migrated yet, so it keeps today's dark brown
   look and stays fully usable inside the new shell, in either theme.
4. **Migrate by stage**, deleting legacy rules as each part moves, and remove the island wrapper at the end.

## Technical Context

**Language/Version**: TypeScript 5, React 19.2, Next.js 16.1 (App Router)

**Primary Dependencies**: Existing only (`next`, `next-intl` untouched here, `framer-motion` kept where the admin already uses it). No theming library; no new dependency.

**Storage**: No database change. The theme choice is one browser-storage entry per device.

**Testing**: No automated suite. Verification is manual plus scripted browser checks (overflow, theme persistence, tab flows), the extended contrast script, `npm run lint`, `npm run build`, and the two audit skills.

**Target Platform**: Phone and desktop browsers; Vercel hosting.

**Project Type**: Web application (single Next.js app).

**Performance Goals**: Admin shell interactive without a theme flash; public pages ship no extra CSS or JavaScript.

**Constraints**: Public site unchanged and light only; admin behavior and API unchanged; admin stays English; AA contrast in both themes; 360 px phone support.

**Scale/Scope**: 2 routes (`/admin`, `/admin/login`), 8 tabs, one 4,942-line component with 118 layout-only inline styles (none hardcode a color), about 130 admin-specific CSS rules plus shared classes.

## Constitution Check

*GATE: passes with one planned amendment (see below).*

| Principle | Status | Note |
|---|---|---|
| I. Bilingual | N/A | Admin is staff-facing and English only, as today. |
| II. Thin routes, logic in lib | Pass | No route or `src/lib` change. |
| III. Admin private, server-verified | Pass | Auth untouched. The theme entry holds no secret. |
| IV. Reservations never lost | Pass | No change to creation, status or notification logic. |
| V. Migrations | Pass | No schema change. |
| VI. Mobile-first, fast, SEO | Pass | Admin CSS lives in its own file so public pages do not grow. |
| VII. Intentional design system | **Amend to 1.3.0** | Add: the admin has a light and a dark token set in `src/app/admin/admin.css`; the public site stays light only. |
| VIII. Simplicity | Pass | No library for theming; a small inline script and one toggle. |

Amendment 1.3.0 is made as the first task of this feature (via `/speckit-constitution`).

## Key Decisions (details in [research.md](./research.md))

1. **Theme mechanism**: attribute `data-admin-theme="light|dark"` on `<html>`, set before first paint by a tiny inline script in the admin layout, and removed when leaving the admin. Preference stored under one key; absent means "follow the device".
2. **Tokens**: semantic admin tokens in a new `src/app/admin/admin.css` (loaded only by the admin layout), derived from the shared palette. All proposed pairs already pass AA (see [contracts/admin-ui-contract.md](./contracts/admin-ui-contract.md)).
3. **Shell**: one new client component owns the top bar, tabs, theme switch, "More" sheet and sign out; tabs stay deep-linkable through `?tab=`.
4. **Migration unit**: the tab. A tab is either `admin-v2` (new tokens and components) or `admin-legacy` (today's look, scoped island). The legacy rules stay in `globals.css` until the last stage removes them.
5. **Component splitting**: keep state and effects in the big component; extract a tab's JSX into its own file only when its markup changes, to limit risk.
6. **Status never by color alone**: chips carry text and a shape.
7. **Alerts**: the three alert styles map to status tokens; sound and desktop notifications unchanged.
8. **Browser bar color**: the admin sets `theme-color` to match the active theme.

## Project Structure

### Documentation (this feature)

```text
specs/002-admin-redesign/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── admin-ui-contract.md
├── checklists/requirements.md
└── tasks.md              # created later by /speckit-tasks
```

### Source Code (repository root)

```text
src/app/admin/
├── layout.tsx              # theme scope + inline pre-paint script; loads admin.css; fonts kept until the end
├── admin.css               # NEW: admin tokens (light/dark), shell, v2 components
├── page.tsx                # uses the new shell
└── login/page.tsx          # new look, theme switch
src/components/
├── admin-shell.tsx         # NEW: top bar, tabs, bottom bar, More sheet, sign out
├── admin-theme-scope.tsx   # NEW: sets and clears the html attribute, keeps theme-color in sync
├── admin-theme-toggle.tsx  # NEW: light / dark / device control
├── admin-top-nav.tsx       # replaced by the shell, removed at the end of stage 1
├── admin-page-header.tsx   # Today's clock header, restyled
└── admin-back-office.tsx   # tab buttons row removed; tabs migrated one by one
scripts/check-contrast.mjs  # EXTENDED: admin pairs in both themes
src/app/globals.css         # legacy admin rules deleted in the last stage
```

**Structure Decision**: Single Next.js app. Admin gets its own stylesheet and a handful of new components; public code is untouched.

## Phasing

| Stage | Delivers | Spec stories |
|---|---|---|
| 0. Foundations | Constitution 1.3.0, admin tokens and themes, theme scope and toggle, legacy island wrapper, contrast script for admin | US1 base |
| 1. Shell, Today, Reservations | New shell and login, Today, Reservations (cards, add and delete dialogs), live alerts and settings styles | US1, US2, US3, US4 |
| 2. Calendar | Calendar tab and closures | US5 |
| 3. The rest | Metrics, rewards, menu, hours, security and settings | US6 |
| 4. Cleanup | Remove `admin-legacy`, legacy fonts and legacy CSS; final audits | US6, FR-015 |

Every stage is shippable on its own because unmigrated tabs stay readable as dark islands.

## Risks

- **One huge component**: edit by tab, run the booking and admin flows after each tab, and keep `git diff -- src/lib src/app/api` empty.
- **Shared global classes** (`.btn`, `.card`, inputs, labels) are used by public, admin v2 and legacy: scope v2 overrides under `.admin-app` and keep the island mirrors until the end.
- **Tutorial mode is removed** (owner decision, unused): about 170 lines of state, demo data, hints and overlay in the big component and 15 style rules go first, which makes Today, Reservations and Calendar simpler to migrate. The business phone and email stored under the old "tutorial settings" name stay, because the public home page reads them.
- **Theme flash and html attribute leaks**: pre-paint script plus cleanup on leaving the admin.
- **Phone browser bars** may tint from page content on newer iOS; keep `theme-color` in sync and check on a real phone.
- **Light theme next to dark islands** during rollout can look uneven; keep stages short.
