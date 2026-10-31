# Research: Admin Back Office Redesign

## R1. Theme mechanism and no flash

- **Finding**: The root layout owns `<html>` and is shared with the public site, so a theme attribute must
  be set only on admin routes and cleaned up when leaving them (the admin nav links to public pages).
- **Decision**: Attribute `data-admin-theme="light|dark"` on `<html>`. A tiny inline script rendered first in the
  admin layout resolves the stored choice (or `prefers-color-scheme`) before the first paint. A small client
  component keeps the attribute in sync, removes it on unmount, listens to the device setting when no explicit
  choice exists, and updates `<meta name="theme-color">`.
- **Rationale**: ~20 lines, no dependency, no flash, no impact on public pages.
- **Alternatives**: `next-themes` (extra dependency for one use); cookies read on the server (makes the admin layout
  dynamic per request and still needs a client toggle).

## R2. Storage of the choice

- **Decision**: One browser-storage key per device with values `light`, `dark` or absent (follow the device). Wrapped in
  try/catch; if unavailable, the app follows the device and the switch still works for the session.
- **Rationale**: Matches the spec (remembered per device; no account setting, no data change).

## R3. Token strategy

- **Finding**: No inline style hardcodes a color (118 inline styles are layout only; two use `var(--line)`), so theming is
  achievable in CSS alone. Admin rules in `globals.css` use legacy variables and many literals.
- **Decision**: New semantic tokens `--a-*` (surfaces, text, lines, accent, action, status chips, alert styles) with a light and
  a dark set, defined in `src/app/admin/admin.css`, derived from the shared palette. Values and verified contrast are in the
  contract. The contrast script gains admin pairs for both themes.
- **Rationale**: Semantic names make the dark set a value swap; a separate file keeps admin CSS off public pages.
- **Alternatives**: Reuse the public tokens directly (the public palette has no dark surfaces); duplicate all rules per theme (huge).

## R4. Migration unit and the "legacy island"

- **Finding**: The admin is one component with tab sections as inline conditionals; the tab buttons row sits inside it; legacy
  rules and the `.admin-theme` mirror block live in `globals.css`.
- **Decision**: A tab is `admin-v2` (new tokens) or `admin-legacy` (a scoped island that keeps today's variables, fonts and
  rules, shown as a self-contained dark panel). The shell wraps each tab accordingly; stage 4 deletes the island and the legacy rules.
- **Rationale**: Each stage ships on its own and nothing is half-themed inside a screen.
- **Alternatives**: Force every tab into the new theme at once (big-bang, high risk); hide the theme switch until all tabs migrate (staff
  would not benefit early).

## R5. Navigation on phone and desktop

- **Finding**: Today is a separate "board" view with its own back button and a large clock; the other tabs are a wrapping row of eight
  buttons, awkward on a phone.
- **Decision**: Desktop: glass top bar with the tabs. Phone: glass bottom tab bar with Today, Reservations, Calendar and More; More opens
  a glass sheet with Metrics, Rewards, Menu, Hours, Settings, the theme switch, public-site links and sign out. Same glass style as the public
  floating controls; safe-area offsets at the bottom; `?tab=` deep links unchanged.
- **Rationale**: Thumb reach on phones, scannable tabs on desktop, one component for both.

## R6. Component splitting

- **Decision**: Keep state, effects, SSE and actions where they are. Extract a tab's JSX into a file only when its markup changes (Today and
  Reservations in stage 1). Do not refactor logic.
- **Rationale**: The constitution forbids behavior change here; fewer moving parts means fewer regressions.

## R7. Status and alert styling

- **Decision**: Chips use a tinted background, readable text and a small shape (dot, ring or icon) per status (new, confirmed, cancelled, no-show,
  unread). The three alert styles (green, orange, neutral) map to confirmed, warning and neutral surface tokens. Sound and desktop notifications are
  not touched.
- **Rationale**: Meets the "not by color alone" requirement and keeps the existing three options meaningful.

## R8. Browser bar color

- **Decision**: The admin sets `theme-color` to the active theme's background and updates it on switch.
- **Rationale**: Consistent with the public site's per-page choice; on newer iOS the bar may tint from content, so confirm on a real phone.

## R9. Verification without a test suite

- **Decision**: Scripted browser checks per stage (no overflow at 360 px and 1280 px, both themes, theme persistence after reload, tab flows and
  deep links), the extended contrast script, lint and build, the two audit skills, and a real-device pass by the owner.
- **Rationale**: Same method that worked for feature 001.

## R10. Behavior guard

- **Decision**: After every task that touches the admin component, confirm `git diff --stat -- src/lib src/app/api` is empty and walk the
  affected flow (confirm, cancel, add, delete, alert).

All "NEEDS CLARIFICATION" items are resolved. Open for tasks: the exact component split for Reservations and the order of legacy-rule deletion.
