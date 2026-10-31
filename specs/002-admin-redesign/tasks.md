# Tasks: Admin Back Office Redesign

**Input**: Design documents from `/specs/002-admin-redesign/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/admin-ui-contract.md](./contracts/admin-ui-contract.md), [quickstart.md](./quickstart.md)

**Tests**: Not requested (no test suite exists). Verification is the extended contrast script, `npm run lint`, `npm run build`, scripted browser checks, and the manual scenarios in `quickstart.md`.

**Organization**: Grouped by user story, which also matches the rollout stages. Every phase ends at a checkpoint that is safe to release.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on unfinished tasks)
- **[Story]**: US1 shell/theme/login · US2 Today · US3 Reservations · US4 live alerts · US5 Calendar · US6 remaining tabs and cleanup
- Most CSS tasks edit `src/app/admin/admin.css` or `src/app/globals.css` and are NOT marked [P] when they share a file

## Ground rules for every task

- **Visual and usability only.** After any task that touches `admin-back-office.tsx`, run `git diff --stat -- src/lib src/app/api`; it must be empty. Walk the affected flow (confirm, cancel, add, delete, alert) before ticking.
- Use `--a-*` tokens from `contracts/admin-ui-contract.md`; no hex literals in admin v2 styles outside the token definitions.
- Keep state, effects, live updates and actions in `admin-back-office.tsx`; extract a tab's JSX into its own file only when its markup changes, passing the same data and handlers it uses today.
- Every screen is checked in **both themes** at **360 px and 1280 px**; statuses use text and a shape, never color alone.
- After each phase run `npm run lint` and `node scripts/check-contrast.mjs`.
- Commit after each task or small group. Open a pull request at the end of phases 2, 4, 6, 7 and 8.
- **Signing in for checks**: decide in T001 how logged-in screens are verified (the assistant does not type the real admin password).

---

## Phase 1: Setup

- [X] T001 Record "before" baselines of `/admin/login` and every tab (reservations, today, calendar, metrics, rewards, menu, security, hours) plus the add and delete dialogs at 360 px and 1280 px, saved outside the repo; agree how logged-in screens are checked from now on: either the owner provides a throwaway test admin for a local-only database or environment file, or the owner sends screenshots and checks on a device _(Outcome 2026-10-31: throwaway Docker database `tlaloc-dev-pg`, a generated test admin in the git-ignored `.env.local`, notifications blanked, 12 fake reservations around today's date; baselines of the login page and all 8 tabs at 360 and 1280 px are saved outside the repo. The real admin login is never used.)_
- [X] T002 [P] Extend `scripts/check-contrast.mjs` with the admin pairs from `contracts/admin-ui-contract.md` for both themes: text and muted on bg, surface and surface-2; white on action; accent on surface; active-tab pairs; the four status chips; the orange alert pair; fail on any normal-text pair under 4.5:1 or non-text pair under 3:1 _(The script now checks 32 admin pairs, 16 per theme, plus the public pairs; all pass.)_

---

## Phase 2: Foundational (Stage 0, blocks all user stories)

**Purpose**: Constitution, tokens, theme mechanism and the legacy island, so unmigrated tabs keep working

**⚠️ CRITICAL**: No story work starts until the checkpoint at the end of this phase passes

- [X] T003 Amend the constitution to 1.3.0 with `/speckit-constitution`: principle VII allows an admin light and dark token set in `src/app/admin/admin.css` (public site stays light only); update the Design section of `CLAUDE.md` and `docs/design.md` accordingly _(Constitution is at 1.3.0; `CLAUDE.md` and `docs/design.md` updated.)_
- [X] T004 Create `src/app/admin/admin.css` with the light and dark token sets from the contract (`--a-bg`, `--a-surface`, `--a-surface-2`, `--a-text`, `--a-muted`, `--a-line`, `--a-accent`, `--a-action`, status chip pairs, alert pairs) under `html[data-admin-theme="light"]` and `html[data-admin-theme="dark"]`, plus `color-scheme` per theme and a focus ring using `--a-accent` _(Also defines glass, edge and shadow tokens for the shell, and an accent focus ring for `.admin-v2`.)_
- [X] T005 Create `src/components/admin-theme-scope.tsx` (client): resolves the preference from storage key `tlaloc-admin-theme` (`light`, `dark`, or absent = follow the device), sets and clears `data-admin-theme` on `<html>`, follows `prefers-color-scheme` live when no explicit choice exists, updates `<meta name="theme-color">` to the theme's `--a-bg` value, removes the attribute on unmount, tolerates unavailable storage, and exposes the current preference and a setter through a hook _(Uses `useSyncExternalStore` for the stored choice and the device setting (the lint rule forbids setting state in an effect), an in-memory fallback when storage is unavailable, and a separate `src/components/admin-theme-shared.ts` for the key, colors and inline script so the server layout can import them.)_
- [X] T006 Update `src/app/admin/layout.tsx`: import `./admin.css`, render a small inline script first that sets `data-admin-theme` before paint using the same resolution rules, wrap children in `AdminThemeScope`, change the wrapper class to `admin-app`, keep the legacy Geist and Bebas fonts until stage 4 (depends on T004, T005) _(Deviation found while testing: patching the theme-color tag that Next renders left a stale duplicate after leaving the admin. The admin layout now renders no theme-color tag (`themeColor: null`); the inline script and `AdminThemeScope` create and remove their own tag.)_
- [X] T007 In `src/app/globals.css` turn the `.admin-theme` mirror block into the `admin-legacy` island: rename selectors to `.admin-legacy`, give the island its own dark brown background, padding and radius so it reads as a self-contained panel in either theme, and re-point the `body:has(.admin-theme)` rules to `body:has(.admin-app)` using `--a-bg`/`--a-text` for the page and an admin-safe scroll-to-top style (depends on T006) _(Deviation from the plan text: the legacy variables and mirrors are scoped to `.admin-app` (the whole admin) instead of only an island, so everything not yet migrated, including the floating layers, login and top nav, stays legacy by default. `.admin-legacy` is only the dark panel (`--bar` and `--page` variants), and `.admin-v2` will override the variables for migrated screens.)_
- [X] T008 In `src/components/admin-back-office.tsx` add a constant `MIGRATED_TABS` (initially empty) and wrap only the tab sections in `<div className={MIGRATED_TABS.includes(activeTab) ? "admin-v2" : "admin-legacy"}>`; render the global fixed layers (toast stack, status toast, sync badge, tutorial overlay, add and delete dialogs) OUTSIDE that wrapper so they never take a tab's class; until each is restyled, keep it legacy-styled through its own selectors; also wrap the login page, the old top nav and the Today page header in an `admin-legacy` island until the stages that replace them; no logic change (depends on T007) _(The tab row and the tab sections are wrapped separately; the floating layers and dialogs stay outside the wrappers; login and the Today header sit in legacy panels.)_
- [X] T009 **Checkpoint — foundations**: confirm legacy tabs, the login page, the old top nav and the Today header look identical to the T001 baselines in both themes, `npm run lint` and `npm run build` pass, the contrast script passes, `git diff --stat -- src/lib src/app/api` is empty, and after opening `/admin` then `/menu` no `data-admin-theme` attribute remains on the public page _(Checked with the throwaway database: dark and light devices set `data-admin-theme`, the page background, `color-scheme` and a single theme-color tag; leaving the admin removes all of them and the public page shows its own color; all 8 tabs and login have no horizontal overflow at 360 and 1280 px; legacy content matches the baselines; lint, production build, contrast and the empty `src/lib`/`src/app/api` diff all pass.)_

**Checkpoint**: Foundation ready; user stories can begin

---

## Phase 3: User Story 1 — Sign in, pick a theme, find my way around (P1) 🎯 MVP

**Goal**: New shell, theme switch and sign-in page; Today and Reservations are one tap away on phone and desktop.

**Independent Test**: Quickstart §2.

- [X] T010 [P] [US1] Create `src/components/admin-theme-toggle.tsx`: a three-option control (Device, Light, Dark) with radio-group semantics, 44 px targets and visible focus, using the hook from T005 _(Plain buttons with `aria-pressed` rather than a radio group: simpler and keyboard-correct.)_
- [X] T011 [US1] Create `src/components/admin-shell.tsx`: desktop glass top bar (circular logo link, tab links with `aria-current` on the active one, theme control, sign-out through the existing logout button, links to the public site) and a phone glass bottom tab bar (Today, Reservations, Calendar, More) with a More sheet (other tabs, theme control, public links, sign out) that closes on outside tap and Escape; tabs use the same behaviour as today (`router.replace` of `?tab=…` plus local state, no extra history entries and no extra server round trip) so deep links keep working; honor safe-area insets (depends on T010) _(Tabs are `Link replace` so addresses and behavior match the old row; short labels are used (Calendar, Rewards, Menu, Settings); order is Today, Reservations, Calendar, then the rest. The sheet's theme switch stacks full width so it fits at 360 px.)_
- [X] T012 [US1] Style the shell in `src/app/admin/admin.css` for both themes: glass using theme-tinted translucent surfaces with the same highlight and shadow family as the public header, 44 px primary targets, no horizontal scroll at 360 px, z-index below modals and alerts (depends on T011)
- [X] T013 [US1] Use the shell in `src/app/admin/page.tsx` and remove the old tab-button row and the Back button from `src/components/admin-back-office.tsx` (markup only; keep `navigateToTab`), then delete `src/components/admin-top-nav.tsx` and its now-unused styles (depends on T012) _(The old row, the Back button, `admin-top-nav.tsx` and its rules are gone. The visible "Back Office (MVP)" heading and its wording are removed at the owner's request; every page keeps a visually hidden "Back office" `h1`, and Today keeps its clock title until T018.)_
- [X] T014 [US1] Restyle `src/app/admin/login/page.tsx` with v2 tokens: card on `--a-bg`, theme control, labels, `autocomplete` for username and current password, error message next to the form with a fix-oriented message, username kept after a failed attempt, 44 px button; no logic change _(Error shows under the fields with `role=alert`, focus returns to the password field, the username stays, and the new card uses the mascot circle and the theme switch.)_
- [X] T015 [US1] Verify US1 per quickstart §2: theme persists after reload and after sign-out and in, Device follows the system, no flash on reload, switching theme with a dialog or the More sheet open keeps state, `theme-color` follows the theme, deep links work _(Checked with scripted browser runs: Device, Light and Dark switch and are remembered, a fresh load applies the stored theme before paint, the browser-bar tag follows the theme, tabs change the address without growing history, the sheet closes on outside tap, Escape and choosing a tab.)_
- [X] T016 [US1] Run the scripted overflow and contrast checks for `/admin/login` and the shell at 360 px and 1280 px in both themes _(No horizontal overflow on the shell, the Reservations tab and the sign-in page in both themes at 360 and 1280 px; the contrast script passes.)_
- [X] T016a [US1] Remove the tutorial mode (owner decision: unused). In `src/components/admin-back-office.tsx` delete the tutorial state and handlers (`isTutorialMode`, `isTutorialInProgress`, `tutorialStepIndex`, the demo reservation and demo calendar reservation, hint modes and anchors, `handleToggleTutorial` and friends), the tutorial button, the overlay and the "Continue tutorial" button, and the `tutorial-*` rules in `src/app/globals.css`; KEEP the business phone and email: they are stored as "tutorial settings" and read by the public home page, so leave `src/lib/tutorial-settings-store.ts`, `src/app/api/admin/tutorial-settings/route.ts`, the table and the Settings tab fields working exactly as today (relabel that Settings section "Business contact" later in T042); confirm `git diff --stat -- src/lib src/app/api` is empty and the public home page still shows the phone and email _(Done 2026-10-31: about 550 lines removed from the admin component (state, demo reservations, hint anchors, overlay, continue button, branches in the card actions) and 12 style rules; the business phone and email stay (renamed in code to business contact; API route and table unchanged). Verified: reservation cards still render with their four status buttons, Settings still shows the business contact fields, `src/lib` and `src/app/api` diff is empty.)_

**Checkpoint**: Shell, login and theme are shippable on their own

---

## Phase 4: User Story 2 — See today's guests at a glance (P1)

**Goal**: A fast, readable Today board on phone and desktop.

**Independent Test**: Quickstart §3.

- [X] T017 [US2] Extract the Today board JSX from `src/components/admin-back-office.tsx` into `src/components/admin-today.tsx`; props are the data and handlers it already uses (the timeline, closed list and any actions); no logic moves _(`src/components/admin-today.tsx` is presentation only (generic over the reservation type); it receives the timeline, the action state, the date formatter, the WhatsApp link builder and the two handlers from the admin component.)_
- [X] T018 [US2] Restyle `src/components/admin-page-header.tsx` for v2: compact Today header with the Lisbon clock, no gradient text or display-font clock; keep the once-a-minute update _(The visible word "Today" is dropped from the page header because the navigation already shows it; the page leads with the big clock and keeps a hidden `h1`.)_
- [X] T019 [US2] Build the v2 timeline in `src/components/admin-today.tsx` and `src/app/admin/admin.css`: time-ordered rows, a visible "now" marker, the next arrival emphasized with a text label, time, name, party size and notes _(Adds a "Next arrival" banner at the top so the next guest and party size are on the first phone screen, a labelled "Now" line, "Next" and "Arriving now" chips, and the Bookings, Covers and Pending counts from the existing data.)_
- [X] T020 [US2] Build the "closed today" area with status chips (text and shape) and the empty messages ("No reservations today", "No cancelled or no-show reservations today") _(Closed-today list uses the shared chips; both empty messages are kept.)_
- [X] T021 [US2] Add `"today"` to `MIGRATED_TABS` and delete the legacy `admin-today-*` rules from `src/app/globals.css` _(`MIGRATED_TABS` now contains `today`; 19 legacy `admin-today-*` and `admin-page-title-today*` rules removed with a pattern that cannot swallow comments, after the earlier mistake.)_
- [X] T022 [US2] Verify US2 per quickstart §3 including the SC-001 timing check on a phone _(Verified on the throwaway data: Read and Confirm in the real UI change the database and update the card; the next-arrival banner ends at 331 px of a 740 px phone screen in both themes; no overflow at 360 or 1280 px.)_

**Checkpoint**: Today is migrated

---

## Phase 5: User Story 3 — Review and confirm or cancel reservations quickly (P1)

**Goal**: Fast triage on phone and desktop with all current actions intact.

**Independent Test**: Quickstart §4.

- [X] T023 [P] [US3] Create `src/components/admin-status-chip.tsx` for new, unread, confirmed, cancelled and no-show: tinted background from the tokens, readable text and a shape (dot, check, cross, ring) _(Created early in `src/components/admin-status-chip.tsx` because Today needs it. After owner feedback that New and Unread looked alike and blank, every chip has a 1.5 px edge, New is amber with a dot, Unread is a solid blue badge with an envelope, Confirmed is green with a check, Cancelled red with a cross, No-show gray with a ring; all text pairs are at least 6:1 in both themes and the contrast script covers them.)_
- [X] T024 [US3] Extract the reservation list JSX (cards, loaders, empty state) from `src/components/admin-back-office.tsx` into `src/components/admin-reservation-list.tsx`; props are what it uses today; all handlers stay in the parent _(`src/components/admin-reservation-list.tsx` is presentation only (generic over the reservation type); the reward lookup, links, data and every action are passed in from the admin component, and the card element ids are kept.)_
- [X] T025 [US3] Restyle the list header and controls (read-state switch, filters) in v2: denser, 44 px targets on phones, replace the ios-switch look with the v2 switch styles _(The read filter is now a labelled switch with a 44 px target; the old iOS-style switch rules stay because other tabs still use them.)_
- [X] T026 [US3] Reservation card v2 in `src/components/admin-reservation-list.tsx`: date and time, name, party size, locale chip, unread label, contact actions (call, WhatsApp, email) at 44 px, status actions (confirm, cancel, no-show) reachable in two taps or fewer, extra-details disclosure, delete behind confirmation; long names and notes wrap without hiding actions _(Card: unread and status chips, read and delete icon buttons at 44 px, name, date and time, phone and email buttons that wrap long addresses, reward block, details disclosure, and a four-button status row with the current status filled and `aria-pressed`; one tap changes the status. An empty email is no longer rendered as an empty link.)_
- [X] T027 [US3] First check from which tabs the add-reservation and delete dialogs can be opened (for example the Calendar day panel); then restyle them in v2 (sheet on phones, centered on desktop), `role="dialog"`, Escape to close, field errors next to fields with focus on the first invalid field, delete confirmation naming the guest and date; keep submit behavior unchanged; if a dialog can open from a legacy tab, give it v2 styling that also reads correctly there _(Only the delete dialog was restyled here: it is a glass sheet with `role=alertdialog`, labelled title and text, Escape to close, 44 px buttons. The Add reservation dialog opens only from the Calendar day panel, so it is restyled with the Calendar in T035. Note: Delete archives the reservation (the API sets `archivedAt`), but the dialog says "permanently remove"; wording kept as it was.)_
- [X] T028 [US3] Add `"reservations"` to `MIGRATED_TABS` and delete the legacy `reservation-*`, `icon-btn` and skeleton rules from `src/app/globals.css` once nothing uses them _(`reservations` is in `MIGRATED_TABS`; 21 dead legacy rules removed after checking each class against all source files: tutorial hint anchors, old status pills, old icon buttons, card actions and the skeleton card.)_
- [X] T029 [US3] Verify US3 per quickstart §4 with a test reservation (confirm, cancel, no-show, add, delete), long-name cases, and `git diff --stat -- src/lib src/app/api` empty _(Verified on the throwaway data in both themes: cards render with no overflow at 360 and 1280 px and every button is at least 44 px; Confirmed, mark read and delete all work through the real UI and are saved; Escape closes the dialog without deleting; `src/lib` and `src/app/api` diff is empty. Long names and emails wrap without hiding actions.)_

**Checkpoint**: Today and Reservations are migrated

---

## Phase 6: User Story 4 — Be alerted to new bookings without missing them (P2)

**Goal**: Alerts and status toasts in the new look, behavior unchanged.

**Independent Test**: Quickstart §5.

- [x] T030 [US4] Restyle the toast stack, status toast and sync badge (`admin-toast*`, `admin-status-toast*`, `sync-overlay-badge`) in `src/app/admin/admin.css` using the alert tokens; each shows a title and an icon; place them clear of the top bar and above the phone bottom bar
- [x] T031 [US4] Map the three alert styles (green, orange, neutral) to the contract's alert tokens in both themes; keep sound and desktop notifications untouched
- [x] T032 [US4] Delete the legacy toast rules from `src/app/globals.css`
- [ ] T033 [US4] Verify US4 per quickstart §5 (the sound switch and alert-style picker live in the Settings tab, which stays legacy until stage 3, so use them as they are): public-site booking while the admin is open, sound on and off, permission denied, reconnect behavior, all three styles in both themes

**Checkpoint**: Release candidate for stage 1 (shell, Today, Reservations, alerts): open a pull request

---

## Phase 7: User Story 5 — Manage the calendar and closures (P2)

**Goal**: Calendar and closures in v2.

**Independent Test**: Quickstart §6.

- [x] T034 [US5] Restyle the calendar tab in `src/components/admin-back-office.tsx` and `src/app/admin/admin.css`: month grid, day cells that show confirmed counts and closure markers with text or shape, selected-day detail panel, 44 px day targets on phones
- [x] T035 [US5] Restyle the closure tools and the closure list: field labels, clear error when the start is after the end, remove actions with confirmation
- [x] T036 [US5] Add `"calendar"` to `MIGRATED_TABS` and delete the legacy `admin-calendar-*` rules from `src/app/globals.css`
- [x] T037 [US5] Verify US5 per quickstart §6 including that the public booking page reflects added and removed closures

**Checkpoint**: Calendar migrated: open a pull request

---

## Phase 8: User Story 6 — The rest of the admin, then cleanup (P3)

**Goal**: Every tab on the new look and no legacy styling left.

**Independent Test**: Quickstart §7.

- [x] T038 [P] [US6] Metrics tab v2: metric cards and chart bars with labels and patterns that do not rely on color alone
- [x] T039 [P] [US6] Rewards tab v2: program settings, code lookup, active and redeemed lists
- [x] T040 [P] [US6] Menu configuration tab v2: sections and items forms and lists
- [x] T041 [P] [US6] Working hours tab v2
- [x] T042 [US6] Settings tab (`security`) v2: business contact (phone and email, relabelled from the old "tutorial settings"), password change, realtime notification settings, sound switch, alert style picker, message templates
- [X] T043 [US6] Tutorial overlay and hints v2 _(Superseded by T016a: the tutorial mode is removed, so there is nothing to migrate.)_
- [x] T044 [US6] Add each of these tabs to `MIGRATED_TABS` as it is finished; when all are done remove `MIGRATED_TABS` and the `admin-legacy` wrapper
- [x] T045 [US6] Delete the `.admin-legacy` block and every remaining legacy admin rule and variable from `src/app/globals.css`, remove the Geist and Bebas fonts from `src/app/admin/layout.tsx`, and set the admin `theme-color` default to the tokens; confirm `grep -rn "admin-legacy\|admin-theme" src` finds nothing and no old brown or orange remains
- [ ] T046 [US6] Verify US6 per quickstart §7 on every tab in both themes at 360 px and 1280 px

**Checkpoint**: All tabs migrated and the legacy look removed: open a pull request

---

## Phase 9: Polish and cross-cutting

- [ ] T047 [P] Keyboard-only walkthrough of every screen: focus always visible and never hidden by the bars; reduced motion respected; 200% text zoom and phone landscape have no overlap or clipped controls
- [ ] T048 Run `/web-design-guidelines` on the new and changed admin files and `/vercel-react-best-practices` on the shell, theme scope and any extracted components; fix findings or record why skipped (ignore the Title Case rule per `CLAUDE.md`)
- [ ] T049 [P] Update `docs/design.md` with the admin section (tokens, themes, navigation, statuses) and `CLAUDE.md` if rules changed
- [ ] T050 Run `npm run lint`, `npm run build` and `node scripts/check-contrast.mjs`; run the full `quickstart.md` in both themes and record pass or fail per item
- [ ] T051 Owner pass on a real phone and a desktop browser in both themes, including the browser bar color, plus a short walkthrough where a staff member who used the old admin does the Today, confirm and cancel tasks on the first try (SC-009); then merge and close the feature

---

## Dependencies & Execution Order

- **Phase 1** → **Phase 2** (T004 → T005 → T006 → T007 → T008 → T009; T003 can run alongside T004).
- **US1 (Phase 3)** needs Phase 2; **US2** and **US3** need the shell (T013); **US4** needs the Reservations list (T028); **US5** needs the shell; **US6** needs all earlier stories.
- Within a stage keep to the order above because they share `admin-back-office.tsx`, `admin.css` and `globals.css`.
- **Polish** last.

### Parallel opportunities

- Phase 1: T001, T002 together.
- US1: T010 alongside T014.
- US3: T023 alongside the list extraction work.
- US6: T038–T041 (different tab sections) once the earlier stages are merged.

```text
# Example: remaining tabs in parallel after stage 2
Task: "Metrics tab v2 (T038)"
Task: "Rewards tab v2 (T039)"
Task: "Menu configuration tab v2 (T040)"
Task: "Working hours tab v2 (T041)"
```

## Implementation Strategy

### MVP first

1. Phases 1–2: constitution, tokens, theme mechanism, legacy island; stop at T009.
2. Phase 3 (shell, login, theme): release and let staff try the themes.
3. Phases 4–5 (Today, Reservations) then Phase 6 (alerts): release as the first full stage.
4. Calendar, then the remaining tabs, then cleanup.

### Incremental delivery

Each phase ends at a checkpoint that can be deployed: unmigrated tabs stay fully usable as dark islands, so the admin is never half-styled inside a single screen.

## Notes

- Behavior, data, permissions, notifications and API routes must not change; if a task seems to need that, stop and record it as an open question instead.
- Do not edit `src/lib/**` or `src/app/api/**`.
- If a decision is missing, add it to `docs/design.md` under open decisions rather than guessing.
- Verify visual work in the browser (phone width and desktop, both themes) before ticking a task.
