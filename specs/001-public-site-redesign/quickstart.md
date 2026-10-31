# Quickstart: Validate the Public Site Redesign

Prerequisites: `npm install`, `.env` with a working `DATABASE_URL` (booking and hours need
the database), then `npm run dev` and open <http://localhost:3000>.

## 1. Automated checks

```bash
npm run lint
npm run build
node scripts/check-contrast.mjs     # exits non-zero on any failing pair
```

Expected: all three succeed (SC-003).

## 2. Look and brand (US1, US4; SC-004, SC-008)

1. Open `/en` and `/pt` at 360 px and at desktop width.
2. No brown page background and no orange/gold accents on any public page.
3. First phone screen shows name, real dish photo, open/closed status, "Book a table".
4. Compare against [docs/design.md](../../docs/design.md): none of the listed generic patterns.

## 3. Menu (US2)

1. `/en/menu` and `/pt/menu` at 360 px.
2. Use quick-find to jump to a section; heading is fully visible below fixed bars.
3. Find a long dish name/description: wraps, price intact. Vegetarian marker readable
   without color.

## 4. Booking (US3; SC-001, SC-002, SC-009)

Complete these in both languages on a phone-size screen:

1. Happy path: pick an open day and slot, fill details, submit; confirmation shows date,
   time, party size. Also time it from the landing page: booking starts in at most 2 taps
   and under 10 seconds, and the full booking uses no more steps or taps than before (SC-001, SC-002).
2. Fully booked day and closed weekday are disabled and distinguishable without color.
3. Same-day booking: slots closer than the cutoff are not offered.
4. Submit with a missing required field: error next to the field, focus on the first error.
5. Compare against the pre-redesign build: availability, hours, closures and notifications
   behave identically (no logic files changed; `git diff --stat` should show none under
   `src/lib` or `src/app/api`).

## 5. Admin unchanged (FR-017)

Open `/admin/login` and the logged-in `/admin` screen (use the local `.env` admin credentials)
before and after: top nav, tabs, calendar, tables, buttons, toasts, layout and colors identical.

## 6. Accessibility and performance (US5; SC-006, SC-007)

1. Keyboard only through every public page: focus always visible, nothing hidden behind bars.
2. Turn on reduced motion in the OS: no non-essential animation.
3. 200% text zoom and landscape: no overlap or clipped controls.
4. Mobile load of `/en` with DevTools Slow 4G + 4x CPU slowdown: main content under 3 s, no
   layout jump from images/fonts. Also check landscape orientation and 200% text zoom on
   landing, menu and booking, and a very long guest name and note in the booking form.
5. Run `/web-design-guidelines` and `/vercel-react-best-practices` on changed files; resolve
   or record each finding.

## 7. Copy and metadata

1. `messages/en.json` and `messages/pt.json` have identical key sets; removed placeholder
   keys are gone from both (SC-005).
2. Page titles, descriptions and the social preview image render for both languages (FR-016).
3. Installed-app/browser chrome colors match the new palette (manifest and `theme-color`).
