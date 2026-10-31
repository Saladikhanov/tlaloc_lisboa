# Feature Specification: Admin Back Office Redesign

**Feature Branch**: `002-admin-redesign`

**Created**: 2026-10-31

**Status**: Draft

**Input**: User description: "Redesign the admin back office (/admin and /admin/login) as a calm, neutral, denser work tool with a switchable light and dark theme, on the shared design tokens from docs/design.md. It must work equally well on a phone and on a desktop. Staff priorities are (1) seeing today's guests (the Today tab) and (2) confirming or cancelling new reservations (the Reservations tab, including live notifications and sounds). Release in stages: shell plus Today and Reservations first, then Calendar and closures, then the remaining tabs. Behavior, data, permissions, notifications and API routes must not change."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sign in, pick a theme, find my way around (Priority: P1)

A staff member opens the back office on their phone or on the counter computer, signs in,
and sees a calm, neutral workspace. They can switch between a light and a dark theme (the
first visit follows the device setting), and the choice is remembered on that device. A
clear navigation shows where they are and lets them reach Today and Reservations in one tap.

**Why this priority**: Everything else lives inside this shell. Staff use the admin in very
different conditions (bright counter, dim bar, phone in a pocket), so readable themes and fast
navigation are the foundation.

**Independent Test**: Open `/admin/login` and `/admin` on a 360 px phone and on a desktop,
sign in, switch themes, reload, and move between tabs.

**Acceptance Scenarios**:

1. **Given** a device set to dark mode, **When** a staff member opens the admin for the first
   time, **Then** it appears in the dark theme; **When** they switch to light, **Then** the whole
   admin changes at once and the choice is kept after reload and after signing out and in.
2. **Given** the sign-in page, **When** the password is wrong, **Then** an error appears next to
   the form saying what to fix, without clearing the username.
3. **Given** a phone-sized screen, **When** the admin is open, **Then** the navigation fits without
   horizontal scrolling and Today and Reservations are reachable in one tap.
4. **Given** either theme, **When** any screen is viewed, **Then** text and controls meet the
   accessibility contrast baseline and show a visible keyboard focus.

---

### User Story 2 - See today's guests at a glance (Priority: P1)

During service, a staff member opens Today and immediately sees who is coming, when and with how
many people, ordered by time, with a clear marker for the current time and the next arrival
standing out. Cancelled and no-show bookings are kept out of the live list but remain visible
in a separate "closed today" area.

**Why this priority**: It is the screen staff look at most while working, often one-handed on a
phone.

**Independent Test**: With a mix of reservations today (past, upcoming, cancelled, no-show),
open Today on a phone and on a desktop and answer "who is next and how many are they?" without
scrolling past the first screen.

**Acceptance Scenarios**:

1. **Given** reservations earlier and later than now, **When** Today is open, **Then** they appear
   in time order with a visible "now" marker between past and upcoming ones.
2. **Given** the next upcoming reservation, **When** Today is open, **Then** it is visually
   distinguished and shows time, name, party size and any note or special request.
3. **Given** cancelled or no-show reservations today, **When** Today is open, **Then** they are not
   in the live list and appear in the closed area with their status shown as text.
4. **Given** no reservations today, **When** Today is open, **Then** a clear empty message says so.

---

### User Story 3 - Review and confirm or cancel reservations quickly (Priority: P1)

A staff member sees new reservation requests clearly marked as unread or new, can read the guest's
details, contact the guest, and confirm, cancel or mark a no-show in as few taps as possible. They can also
add a reservation by hand and delete one after a confirmation step.

**Why this priority**: Confirming new requests is the second main daily job and directly affects
guests waiting for an answer.

**Independent Test**: Create several new requests, then confirm one, cancel one and mark one no-show
on a phone, then add a manual reservation and delete another.

**Acceptance Scenarios**:

1. **Given** unread or new reservations, **When** Reservations is open, **Then** they are easy to tell
   apart from handled ones by both a visible label and styling, not color alone.
2. **Given** a new reservation, **When** the staff member taps confirm, **Then** the status changes, the
   change is acknowledged on screen, and the guest notification behaves exactly as before.
3. **Given** a reservation, **When** the staff member taps cancel or delete, **Then** a confirmation step
   names the guest and date before anything is removed.
4. **Given** the manual reservation form, **When** a required field is missing, **Then** an error appears
   next to that field and focus moves to the first one.
5. **Given** a very long guest name or note, **When** shown, **Then** the card stays readable without
   horizontal scrolling or hidden action buttons.

---

### User Story 4 - Be alerted to new bookings without missing them (Priority: P2)

While the admin is open, a new reservation produces a visible notification, an optional sound
and, if allowed, a desktop notification. Staff can choose the notification style and turn sounds
on or off. Alerts remain clear in both themes.

**Why this priority**: Timely alerts keep response times short, but the core viewing and confirming
flows come first.

**Independent Test**: With the admin open, create a reservation from the public site and check the
on-screen alert, the sound and the highlighted card in both themes; change the alert style and sound
setting and repeat.

**Acceptance Scenarios**:

1. **Given** the admin is open, **When** a reservation arrives, **Then** a notification appears without
   covering the main navigation or the confirm action, and the new card is highlighted.
2. **Given** sounds are turned off in settings, **When** a reservation arrives, **Then** no sound plays.
3. **Given** desktop notification permission is denied, **When** a reservation arrives, **Then** the on-screen
   alert still works and no error is shown.
4. **Given** each of the three alert styles, **When** shown, **Then** they stay distinguishable and
   readable in both themes and do not rely on color alone.

---

### User Story 5 - Manage the calendar and closures (Priority: P2)

A staff member views the confirmed calendar, opens a day, and blocks or unblocks time windows
so the public booking page stops offering those times. Days with closures and busy days are easy to
see.

**Why this priority**: Closures protect the restaurant from overbooking, but they are used less often than the
daily lists.

**Independent Test**: Block a time window on a future day, check it appears in the calendar, and check the public
booking page no longer offers those times; remove it and check they return.

**Acceptance Scenarios**:

1. **Given** the calendar, **When** a day has confirmed reservations or closures, **Then** that is visible on the
   day without opening it.
2. **Given** the closure form, **When** a start time is after the end time, **Then** a clear error says how to fix it.
3. **Given** a closure is removed, **When** the public booking page is checked, **Then** the times return as before.

---

### User Story 6 - Use the rest of the admin in the same look (Priority: P3)

The remaining areas (metrics, rewards, menu, working hours, security, tutorial and notification settings) adopt the same
look, themes and navigation, so the admin feels like one product. When this is done, the old dark brown admin styling no
longer exists anywhere.

**Why this priority**: Important for consistency and for removing the old look, but used less often than the main jobs.

**Independent Test**: Visit every admin tab in both themes on a phone and a desktop and confirm none shows the old
brown/orange look.

**Acceptance Scenarios**:

1. **Given** any admin tab, **When** viewed in either theme, **Then** it uses the same colors, type and components as the
   migrated screens.
2. **Given** the first rollout stages are live, **When** a tab is not yet migrated, **Then** it still works completely and
   is clearly readable, as a self-contained dark area, until it is migrated.
3. **Given** all tabs are migrated, **When** the legacy admin look is removed, **Then** no screen changes behavior and
   nothing falls back to old colors.

---

### Edge Cases

- A day with many reservations (50 or more) and a day with none.
- Very long guest names, notes and email addresses; many guests in one booking.
- Reservations at the same minute; reservations after midnight service end.
- New reservation arrives while the staff member is editing, scrolling or has a dialog open.
- Notification permission denied or never asked; sounds blocked by the browser until first tap.
- Connection loss and reconnection while live alerts are active; session expiry while a dialog is open.
- Switching theme while a dialog or the tutorial overlay is open.
- Phone in landscape, 200% text zoom, and very small phones.
- A status change or save that fails: the screen must say so and keep the previous state.
- Color-blind staff: statuses must be readable without relying on color.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The admin MUST offer a light theme and a dark theme; the first visit follows the device setting, staff can
  switch at any time, and the choice is remembered per device.
- **FR-002**: Both themes MUST use the shared design tokens (no ad-hoc colors) with a neutral, calm palette in which status
  colors stand out; the public site MUST stay light only and unchanged.
- **FR-003**: Every admin screen MUST be fully usable on a 360 px phone and on a desktop, without horizontal scrolling,
  with touch targets of at least 44 px for primary actions.
- **FR-004**: The sign-in page MUST show errors next to the form with a fix-oriented message and keep the username.
- **FR-005**: The admin navigation MUST show the current section and make Today and Reservations reachable in one tap.
- **FR-006**: Today MUST list today's active reservations in time order with a "now" marker, visually distinguish the next
  arrival, and show time, name, party size and notes.
- **FR-007**: Today MUST keep cancelled and no-show reservations out of the live list and show them in a separate closed area
  with the status written out.
- **FR-008**: Reservations MUST show unread/new items with a text label as well as styling, and keep all current actions:
  contact, confirm, cancel, no-show, archive or clean, add manually, and delete after confirmation.
- **FR-009**: Status changes and destructive actions MUST give on-screen acknowledgement and MUST ask for confirmation
  before deleting.
- **FR-010**: Forms MUST show errors next to the field, move focus to the first invalid field, and never lose entered data on
  an error.
- **FR-011**: Live alerts (on-screen notification, optional sound, optional desktop notification, selectable alert style)
  MUST keep working exactly as today and remain readable in both themes without relying on color alone.
- **FR-012**: The Calendar tab MUST show confirmed reservations and closures per day and keep creating and removing
  closures working as before.
- **FR-013**: Metrics, rewards, menu, working hours, security, tutorial and notification settings MUST adopt the same look
  and themes in the final stage.
- **FR-014**: Behavior, data, permissions, notifications and API routes MUST NOT change; guests' public booking experience
  MUST be unaffected.
- **FR-015**: Un-migrated tabs MUST keep working and stay readable until migrated; when all tabs are migrated, the legacy
  admin styling MUST be fully removed.
- **FR-016**: All text and controls MUST meet WCAG 2.1 AA contrast in both themes, show visible keyboard focus, and respect
  the reduced-motion setting.
- **FR-017**: Statuses (new, confirmed, cancelled, no-show, unread) MUST be identifiable by text or icon as well as color.
- **FR-018**: Switching theme MUST take effect immediately without losing the current screen state, open dialog or entered data.

### Key Entities *(include if feature involves data)*

- **Admin theme preference**: The staff member's light or dark choice on a device, with "follow the device" as the default.
- **Reservation**: A guest booking with date, time, party size, contact details, notes and a status (new, confirmed,
  cancelled, no-show) plus read/unread state; unchanged by this feature.
- **Closure**: A blocked time window on a date that hides times from the public booking page; unchanged.
- **Alert settings**: Sound on/off and alert style (three options); unchanged in meaning, restyled.
- **Design tokens (admin set)**: Light and dark values for the shared colors, type, spacing and status colors used across the admin.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A staff member can tell who the next guest is and how many people they are within 5 seconds of opening Today on a phone.
- **SC-002**: A new reservation can be confirmed or cancelled in no more than 2 taps from the Reservations list.
- **SC-003**: 100% of text and control pairs meet AA contrast in both themes on every migrated screen.
- **SC-004**: No migrated screen has horizontal scrolling at 360 px, at 200% text zoom, or in phone landscape.
- **SC-005**: Switching theme takes effect in under 1 second and is still applied after reload.
- **SC-006**: A reservation created on the public site is announced in the open admin (alert, optional sound, highlighted card)
  within the same time as before this change.
- **SC-007**: Zero changes to reservation, availability, notification or permission behavior: every existing admin action gives
  the same result as before.
- **SC-008**: When the final stage ships, 0 admin screens use the old brown or orange styling.
- **SC-009**: Staff who used the old admin complete the Today, confirm and cancel tasks without help in a short walkthrough on
  their first try.

## Assumptions

- The admin stays English only and has a single staff role, as today.
- The design tokens and glass style from feature 001 are available; the admin gets its own light and dark token values and a
  denser, calmer layout rather than the public site's large lime fields.
- The theme choice is remembered on the device; no new account setting or data storage is needed.
- During the staged rollout, tabs that are not yet migrated appear as self-contained dark areas that remain fully usable; each
  stage is shippable on its own.
- The constitution's design principle will be amended to mention the admin's dark token set when planning starts.
- Existing behaviors (live alerts, tutorial mode, three alert styles, manual reservations, closures) are kept, only restyled.
- Real-device checks (phone and desktop browsers) are part of acceptance because there is no automated test suite.
