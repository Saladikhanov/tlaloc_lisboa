# Tasks: Public Site Redesign

**Input**: Design documents from `/specs/001-public-site-redesign/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/design-tokens.md](./contracts/design-tokens.md), [quickstart.md](./quickstart.md)

**Tests**: Not requested (no test suite exists). Verification is the contrast script, `npm run lint`, `npm run build`, and the manual scenarios in `quickstart.md`.

**Organization**: Grouped by user story. Shared shell work (nav, footer, buttons, focus) sits in Phase 2 because every story needs it.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on unfinished tasks)
- **[Story]**: US1 landing · US2 menu · US3 booking · US4 identity · US5 accessibility/performance
- Most CSS tasks edit `src/app/globals.css` and so are NOT marked [P] (same-file conflicts)

## Ground rules for every task

- Use tokens from `contracts/design-tokens.md`; no new hex literals in public styles.
- Never edit logic in `src/lib/**` or `src/app/api/**` (FR-006).
- Any message key change goes in `messages/en.json` and `messages/pt.json` together.
- After each phase run `npm run lint` and `node scripts/check-contrast.mjs`; test pt at 360 px width.
- Commit after each task or small group.

---

## Phase 1: Setup

**Purpose**: Tooling and baselines before touching styles

- [ ] T001 [P] Create `scripts/check-contrast.mjs`: plain Node ESM, no dependencies; hold the token palette and the allowed foreground/background pairs from `contracts/design-tokens.md`, compute WCAG ratios, print each pair, and exit non-zero if any normal-text pair is under 4.5:1 or any large-text pair under 3:1
- [ ] T002 [P] Delete unused starter file `src/app/page.module.css` (confirm with `grep -rn "page.module" src` that nothing imports it)
- [ ] T003 Record "before" baselines for comparison: screenshots of `/en`, `/pt`, `/en/menu`, `/en/reserve`, `/admin/login` at 360 px and 1280 px, saved outside the repo (scratchpad); note any brown-literal count with `grep -cE "#130800|#1a0a00|#2a1505|#3a1f0b" src/app/globals.css`

---

## Phase 2: Foundational (blocks all stories)

**Purpose**: Tokens, admin freeze, fonts, brand surfaces, and the shared shell

**⚠️ CRITICAL**: No user story work starts until the admin check at the end of this phase passes

- [ ] T004 Audit classes shared by admin and public (`site-shell`, `form-shell`, `card`, `btn`, `btn-primary`, `btn-secondary`, `footer-note`, `admin-calendar-head`, `lang-btn`, etc.) by grepping `src/components/*.tsx` and `src/app/**`; write the resulting list as a comment block at the top of the shared-class section in `src/app/globals.css`
- [ ] T005 Add the new palette tokens (`--paper`, `--teal`, `--teal-mid`, `--cyan`, `--chile`, `--lime`, `--agave`, `--muted`) and type/space tokens to `:root` in `src/app/globals.css`, using the NEW names from `contracts/design-tokens.md`; keep the old variables (`--bg`, `--card`, `--accent`, …) defined but no longer used by public styles
- [ ] T006 Add an `.admin-theme` wrapper in `src/app/globals.css` that re-declares today's legacy values (`--bg #130800`, `--card #2a1505`, `--text #fff4e0`, `--accent #f5a623`, etc.) plus the old background gradient and any `.btn`/`.card` overrides needed so shared classes look identical inside it (depends on T004, T005)
- [ ] T007 Apply `.admin-theme` to the admin pages without changing logic: wrap the returned markup in `src/app/admin/page.tsx` and `src/app/admin/login/page.tsx`; ensure the page background fills the viewport (depends on T006)
- [ ] T008 Replace the hardcoded brown `body` gradient and the `padding-top: 70px` coupling in `src/app/globals.css` with token-driven `background`/`color`, so the public default is `--paper`/`--teal` and the admin wrapper supplies its own (depends on T006)
- [ ] T009 Swap fonts in `src/app/layout.tsx`: remove `Geist`, `Geist_Mono`, `Bebas_Neue`, `Pacifico`; add `Bricolage_Grotesque` (`--font-display`) and `Figtree` (`--font-body`) via `next/font/google` with `latin` and `latin-ext` subsets and `display: "swap"`; update every `font-family` reference in `src/app/globals.css` (Bebas Neue, Pacifico, Geist) to the new tokens
- [ ] T010 **Checkpoint — font pairing**: run `npm run dev`, view the hero, nav and a Portuguese menu line with accents (á ã ç õ) at 360 px; if it reads wrong, switch headings to Familjen Grotesk (fallback in `research.md` R2) in `src/app/layout.tsx` and record the final choice in `docs/design.md` (depends on T009)
- [ ] T011 [P] Update `src/app/manifest.ts` `background_color` and `theme_color` from `#130800` to the new page color, and add a matching `themeColor` to the viewport/metadata export in `src/app/layout.tsx`
- [ ] T012 Restyle the shared shell with tokens in `src/app/globals.css` and `src/components/public-nav.tsx`: `.site-nav`, `.nav-links`, `.nav-toggle`, `.lang-btn`, brand mascot sizing, mobile menu; teal nav with paper text; no tracked all-caps labels (depends on T005)
- [ ] T013 Restyle `src/components/site-footer.tsx` and its CSS to the teal/paper tokens, with links keeping visible focus (depends on T005)
- [ ] T014 Restyle buttons and cards in `src/app/globals.css`: primary = chile with white label (4.89:1), secondary = teal outline; `:focus-visible` ring on every interactive element using lime on teal and teal on paper; remove `outline: none` without replacement; list transition properties explicitly (no `transition: all`); mirror any needed look in `.admin-theme .btn` / `.admin-theme .card` so the admin is unchanged (depends on T006)
- [ ] T015 Add a global `@media (prefers-reduced-motion: reduce)` block in `src/app/globals.css` that disables non-essential animation and smooth scrolling (FR-014)
- [ ] T016 Wire the token pairs into `scripts/check-contrast.mjs` (T001) and run it; fix any failing pair (depends on T005, T012–T014)
- [ ] T017 **Checkpoint — admin unchanged**: open `/admin/login` (and `/admin` if credentials are available) and compare with the T003 baseline; run `git diff --stat -- src/lib src/app/api` and confirm it is empty. Do not proceed until both pass

**Checkpoint**: Foundation ready; user stories can begin

---

## Phase 3: User Story 1 — Landing page that feels like Tláloc (P1) 🎯 MVP

**Goal**: First phone screen shows name, real dish photo, open/closed status and "Book a table"; no leftover dev copy; no brown.

**Independent Test**: Quickstart §2 — `/en` and `/pt` at 360 px and desktop.

- [ ] T018 [US1] Rebuild the hero in `src/app/[locale]/page.tsx`: one full-bleed `next/image` from the existing photo set with `priority`, explicit `width`/`height`, responsive `sizes`, and a descriptive `alt`; text-only headline from `Home.heroHeading`, the open/closed status, and a chile "Book a table" button on the first phone screen; remove the three stacked `backgroundTlaloc.webp` blur layers and scrim (FR-002, R4)
- [ ] T019 [US1] Replace the hero styles in `src/app/globals.css` (`.hero*`, `.hero-bg-*`, `.hero-scrim`, `.home-hero-*`) with token-based layout; delete the now-unused blur/scrim rules; avoid specificity clashes between `.hero` and `.hero-ctas` (depends on T018)
- [ ] T020 [P] [US1] Restyle `src/components/home-open-status.tsx` and `.home-open-status*` rules: open vs closed distinguishable by text and icon, not color alone; keep `computeIsOpenNow` logic untouched
- [ ] T021 [US1] Restyle the working-hours block (`.home-hours-*`) in `src/app/globals.css` and its markup in `src/app/[locale]/page.tsx`; closed days labelled with `Home.closedLabel` text
- [ ] T022 [P] [US1] Restyle `src/components/home-gallery.tsx`: keep carousel behavior and `aria` labels, drop decorative gradient/glow, keep its `framer-motion` use only for user-triggered transitions and guard with reduced motion
- [ ] T023 [P] [US1] Restyle `src/components/delivery-button.tsx` as a secondary button using the shared button tokens
- [ ] T024 [US1] Restyle the SEO block and FAQ (`.home-seo-card`, `.home-faq-*`) in `src/app/globals.css`: normal reading column under 80 characters, `<details>` with visible focus; no identical rounded-card grid (FR-011)
- [ ] T025 [US1] Remove the commented-out discount banner block (`home-discount-banner`) from `src/app/[locale]/page.tsx` and delete the `.home-discount-banner*` CSS rules in `src/app/globals.css` (FR-003)
- [ ] T026 [US1] Remove unused placeholder keys from BOTH `messages/en.json` and `messages/pt.json`: `Home.title`, `Home.body`, `Home.qrTitle`, `Home.qrBody`, `Home.reservationTitle`, `Home.reservationBody`, `Home.seoTitle`, `Home.seoBody`, `Home.discountBannerHeadline`, `Home.discountBannerBody`, `Home.discountBannerCta`; first grep `src` to confirm each is unused, then verify both files keep identical key sets (SC-005)
- [ ] T027 [US1] Review and tighten visible landing copy in both `messages/en.json` and `messages/pt.json` (hero, description, pricing line): plain, specific, equivalent meaning in both languages, no emoji; keep SEO phrasing that search relies on
- [ ] T028 [US1] Verify US1 per Quickstart §2 in `/en` and `/pt`, including the closed state and 360 px width; fix overflow in Portuguese

**Checkpoint**: Landing page complete and independently shippable

---

## Phase 4: User Story 2 — Readable, scannable menu (P1)

**Goal**: Fast, legible menu in the new look, QR-friendly.

**Independent Test**: Quickstart §3 — `/en/menu`, `/pt/menu` at 360 px.

- [ ] T029 [US2] Restyle the menu page in `src/app/[locale]/menu/page.tsx` and menu rules in `src/app/globals.css`: section headings, dish rows, price alignment; long names and descriptions wrap without pushing the price (`min-width: 0`, `overflow-wrap`); use `font-variant-numeric: tabular-nums` for prices
- [ ] T030 [US2] Restyle `src/components/menu-quick-find.tsx` and `.menu-quick-find*`: sticky bar uses tokens; set `--quick-find-h` correctly and add `scroll-margin-top` so jumped-to headings are not hidden behind fixed bars (FR-013)
- [ ] T031 [US2] Make the vegetarian marker readable without color: add a small icon plus visible label or accessible name in the dish row markup (`src/app/[locale]/menu/page.tsx`) using `--agave`; check both locales have the label text in `messages/*.json`
- [ ] T032 [US2] Handle empty section/dish description gracefully (no empty gaps or broken layout) in `src/app/[locale]/menu/page.tsx`
- [ ] T033 [US2] Verify US2 per Quickstart §3 in both locales at 360 px and 200% text zoom

**Checkpoint**: Menu complete; US1 and US2 both work independently

---

## Phase 5: User Story 3 — Confident table booking (P1)

**Goal**: Booking flow in the new look with clear states; behavior unchanged.

**Independent Test**: Quickstart §4 — full booking in both languages on a phone-size screen.

- [ ] T034 [US3] Restyle the booking layout in `src/components/reserve-flow.tsx` and `src/app/[locale]/reserve/layout.tsx`: shell, progress bar (`.reserve-flow-progress*`), step panels (`.reserve-flow-step-panel`) with tokens; visual and markup-class changes only — do not alter state, availability calls or submit logic
- [ ] T035 [US3] Restyle the calendar (`.reserve-flow-calendar-grid`, day cells, month header) in `src/app/globals.css`: selected day, today, and disabled (closed or fully booked) days distinguishable without color alone (strike/pattern + `aria-disabled` or `disabled` + text in the accessible name); keep the existing fully-booked greying behavior working
- [ ] T036 [US3] Restyle the time-slot buttons and guests/party-size controls: 44 px minimum touch targets, visible selected state, `:focus-visible`
- [ ] T037 [US3] Restyle form fields: visible `<label>`, `autocomplete`, correct `type`/`inputmode` on phone and email, placeholders ending with `…`; error message directly under the field with a fix-oriented message; on failed submit focus moves to the first invalid field (UI-level behavior only; validation rules unchanged)
- [ ] T038 [US3] Restyle the confirmation modal (`reservation-modal-*` in `src/components/reserve-flow.tsx` and CSS): states date, time and party size; says what happens next; consistent action vocabulary ("Book a table" → "Table booked"); mascot shown here with a purpose (FR-010)
- [ ] T039 [US3] Review all booking copy in `messages/en.json` and `messages/pt.json` (labels, errors, success): active voice, specific button labels, equal meaning in both languages
- [ ] T040 [US3] Verify US3 per Quickstart §4 in both languages: happy path, fully booked day, closed weekday, same-day cutoff, missing field, then `git diff --stat -- src/lib src/app/api` is empty (SC-009)

**Checkpoint**: All three P1 stories done and shippable

---

## Phase 6: User Story 4 — Consistent identity everywhere (P2)

**Goal**: One coherent brand across pages and states; mascot used purposefully.

**Independent Test**: Quickstart §2 across every public page and state; admin unchanged.

- [ ] T041 [US4] Add a "closed today" presentation with the mascot on the landing page (`src/components/home-open-status.tsx` or the hours block in `src/app/[locale]/page.tsx`), shown only when the restaurant is closed
- [ ] T042 [P] [US4] Add a branded not-found page at `src/app/[locale]/not-found.tsx` (both locales via `next-intl`, link back home and to booking); add the needed keys to `messages/en.json` and `messages/pt.json`
- [ ] T043 [P] [US4] Add a branded error boundary at `src/app/[locale]/error.tsx` (client component) with a fix-oriented message and a "Try again" action, both locales
- [ ] T044 [US4] Review `public/og_image.jpg` and the icon set (`public/favicon*.{ico,webp}`, `public/apple-touch-icon*.png`, `public/icon-*.png`): if they carry the old brown, produce replacements in the new palette; keep file names or update references in `src/app/layout.tsx` and `src/app/[locale]/page.tsx`
- [ ] T045 [US4] Sweep for leftover old-brand colors in public styles: `grep -nE "#130800|#1a0a00|#2a1505|#3a1f0b|#f5a623|#ffd166|#c4622d|#e8351a|#f0ddb8|#fff4e0" src/app/globals.css`; every remaining hit must be inside `.admin-theme`; replace the rest with tokens (SC-004)
- [ ] T046 [US4] Confirm FR-011 against `docs/design.md`: no identical rounded-card grid, no tracked all-caps eyebrows, no numbering on non-sequences, no fade-up on every section; fix offenders in `src/app/globals.css` and the page components
- [ ] T047 [US4] Re-verify `/admin/login` and `/admin` against the T003 baseline (FR-017)

**Checkpoint**: Brand is consistent across pages and states

---

## Phase 7: User Story 5 — Accessible and fast on a phone (P2)

**Goal**: Keyboard, contrast, reduced motion, layout stability, speed.

**Independent Test**: Quickstart §6.

- [ ] T048 [US5] Keyboard-only pass over `/en`, `/pt`, both menus and the booking flow: focus always visible, logical tab order, skip link to main content added in `src/app/[locale]/layout.tsx` if missing, sticky bars never cover the focused element (`scroll-padding-top` in `src/app/globals.css`)
- [ ] T049 [P] [US5] Add explicit `width`/`height` (or `fill` with a sized parent) and correct `sizes` to every `next/image` on public pages (`src/app/[locale]/page.tsx`, `src/components/home-gallery.tsx`, `src/components/public-nav.tsx`); below-fold images lazy, hero `priority`; confirm no layout shift (FR-015)
- [ ] T050 [P] [US5] Check heading hierarchy (single `<h1>` per page, ordered `h2`–`h3`), image `alt` text, `aria-live` for async messages in `src/components/reserve-flow.tsx`, and `lang` attribute per locale in `src/app/layout.tsx`
- [ ] T051 [US5] Check behavior with OS reduced motion enabled: no non-essential animation on landing, gallery, nav or modal
- [ ] T052 [US5] Run `/web-design-guidelines` on `src/app/[locale]/page.tsx`, `src/app/[locale]/menu/page.tsx`, `src/components/{public-nav,site-footer,home-gallery,home-open-status,menu-quick-find,reserve-flow}.tsx`; fix findings or record why a finding is skipped (ignore its Title Case rule, per `CLAUDE.md`)
- [ ] T053 [US5] Run `/vercel-react-best-practices` on the same files, focusing on bundle size, image handling and client components; fix high-impact findings
- [ ] T054 [US5] Run `node scripts/check-contrast.mjs` and a throttled mobile load of `/en` (landing main content under 3 s, SC-007); record results in the PR description

**Checkpoint**: All stories complete

---

## Phase 8: Polish & Cross-Cutting

- [ ] T055 [P] Update `docs/design.md` with the final fonts, final palette values if any changed, and the mascot lockup decision (resolve "Open decisions")
- [ ] T056 [P] Update `CLAUDE.md` Design section if the token names or admin theme rule changed
- [ ] T057 Run `npm run lint` and `npm run build`; fix errors
- [ ] T058 Run the full `quickstart.md` validation (§1–§7) in both languages and record pass/fail per item in the PR description
- [ ] T059 Open the PR from `001-public-site-redesign` with before/after screenshots (from T003) for landing, menu, booking and admin; include contrast results and audit summaries

---

## Dependencies & Execution Order

- **Phase 1** → **Phase 2** (T004 → T006 → T007/T008/T014; T005 before T012–T014; T009 → T010; T017 gates everything after).
- **US1, US2, US3** (P1) can start after T017; they touch mostly different component files but share `src/app/globals.css`, so merge in order US1 → US2 → US3 or rebase often.
- **US4** after US1–US3 (it sweeps and finishes cross-page states). **US5** after US4, because it audits the finished UI.
- **Polish** last.

### Parallel opportunities

- Phase 1: T001, T002 together.
- Phase 2: T011 alongside T012–T013 (different files).
- US1: T020, T022, T023 (separate component files).
- US4: T042, T043 (new files).
- US5: T049, T050.

```text
# Example: US1 component work in parallel after T018–T019
Task: "Restyle src/components/home-open-status.tsx (T020)"
Task: "Restyle src/components/home-gallery.tsx (T022)"
Task: "Restyle src/components/delivery-button.tsx (T023)"
```

## Implementation Strategy

### MVP first

1. Phases 1–2 (tokens, admin freeze, fonts, shell) — stop at T017.
2. Phase 3 (US1 landing) — validate on a phone, share a preview.
3. Menu (US2) and booking (US3) next, each validated alone.
4. Identity (US4) and accessibility/performance (US5) once pages exist.

### Incremental delivery

Each phase ends with a checkpoint that is safe to deploy: tokens fall back cleanly and the
admin is frozen, so the site is never half-brown within a single route. Prefer deploying
after US1–US3 (all P1).

## Notes

- Do not change reservation, availability, rewards, notification or API code.
- If a task needs a decision not in the spec or plan, stop and add it to `docs/design.md` "Open decisions" instead of guessing.
- Verify visual work in the browser (phone width and desktop) before ticking a task.
