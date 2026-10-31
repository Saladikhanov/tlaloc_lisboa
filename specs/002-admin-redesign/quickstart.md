# Quickstart: Validate the Admin Redesign

Prerequisites: `npm install`, `npm run dev`, and a signed-in admin session at <http://localhost:3000/admin>. For checks that sign in, use the throwaway Docker database and the generated test admin from `.env.local` (never the real admin login or database). Repeat checks in **both themes** and at **360 px and desktop** width.

## 1. Automated checks (every stage)

```bash
npm run lint
npm run build
node scripts/check-contrast.mjs        # includes the admin pairs in both themes
git diff --stat -- src/lib src/app/api # must be empty
```

## 2. Shell, theme and sign-in (US1)

1. Open `/admin/login` and `/admin`. First visit follows the device setting; switch to Light and Dark with the switch; reload;
   the choice is kept; choose Device and confirm it follows the system again.
2. Wrong password: the error appears next to the form and the username stays.
3. 360 px: no horizontal scroll; bottom bar shows Today, Reservations, Calendar, More; More lists the other tabs, the switch,
   public-site links and sign out. Desktop: top bar with all tabs.
4. Deep links `/admin?tab=today` and `?tab=calendar` open the right tab. Switching tabs replaces the address (no history spam), so browser back leaves the admin, as it does today.
5. Leave the admin for `/menu` and confirm the public page is light and unaffected (no admin theme attribute left behind).

## 3. Today (US2)

1. With reservations earlier and later than now: time order, a "now" marker, the next arrival stands out with time, name,
   party size and notes.
2. Cancelled and no-show appear in the closed area with the status written out; with none today, an empty message shows.
3. On a phone, the next guest and party size are readable on the first screen (SC-001).

## 4. Reservations (US3)

1. New or unread items show a text label and styling, not color alone.
2. Confirm, cancel and no-show work in 2 taps or fewer and show on-screen acknowledgement; guest notifications behave as before.
3. Delete asks for confirmation naming the guest and date; add-reservation shows field errors and moves focus to the first one.
4. A very long guest name or note does not hide the action buttons or scroll sideways.

## 5. Live alerts (US4)

1. Create a reservation from the public site while the admin is open: on-screen alert, optional sound, highlighted card.
2. Sound off: no sound. Desktop permission denied: the on-screen alert still works with no error.
3. Each of the three alert styles is readable in both themes and shows a title and icon.

## 6. Calendar and closures (US5)

1. Days with confirmed reservations or closures are visible without opening them.
2. A closure with start after end shows a clear error; removing a closure returns the times to the public booking page.

## 7. Remaining tabs and cleanup (US6)

1. Metrics, rewards, menu, hours and settings (including business contact) look like the migrated screens in both themes; there is no tutorial mode any more.
2. After cleanup: `grep -n "admin-legacy\\|admin-theme" src` finds nothing; no screen uses the old brown or orange.

## 8. Accessibility and device pass

1. Keyboard-only walkthrough of every screen; focus is always visible and never hidden by the bars.
2. Reduced motion is respected; 200% text zoom and phone landscape have no overlap or clipped controls.
3. Run `/web-design-guidelines` and `/vercel-react-best-practices` on the changed files.
4. Owner checks on a real phone and a desktop browser, in both themes.
