# Feature Specification: Public Site Redesign

**Feature Branch**: `001-public-site-redesign`

**Created**: 2026-10-31

**Status**: Draft

**Input**: User description: "Redesign the public site (landing, menu, reservation flow) so it no longer looks AI-generated. Replace the brownish brand colors. Direction: 'Daylight + Lluvia' as defined in docs/design.md."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Landing page that feels like Tláloc (Priority: P1)

A first-time visitor, often on a phone and often arriving from a search for tacos or
margaritas in Lisbon, opens the landing page. Within seconds they understand it is a
Mexican restaurant in Alcântara, see real food, see whether it is open now, and can book
a table or open the menu. The page looks specific to this restaurant, not like a template.

**Why this priority**: The landing page is the first impression and the main search
entry point. The new look and color identity are established here and reused everywhere.

**Independent Test**: Open `/en` and `/pt` on a phone-sized screen and a desktop screen.
Confirm the new palette, imagery and copy are in place and that "Book a table" and the
menu are reachable without scrolling past more than one screen of content.

**Acceptance Scenarios**:

1. **Given** a visitor on a phone, **When** the landing page loads, **Then** the first
   screen shows the restaurant name, a real dish photo, the open/closed status, and a
   primary "Book a table" action.
2. **Given** any public page, **When** viewed, **Then** no brown/dark-brown page
   background or orange/gold accent from the old brand appears.
3. **Given** the landing page, **When** read in full, **Then** no placeholder or
   developer-facing copy remains (for example text about "one project: QR menu,
   reservations, and SEO website") and no emoji appear in the promotional banner.
4. **Given** the page is opened in Portuguese, **When** compared with English, **Then**
   every section has equivalent content and equal polish.

---

### User Story 2 - Readable, scannable menu (Priority: P1)

A guest at a table scans the QR code, or a visitor browses the menu beforehand. They
find dishes quickly, read names, descriptions and prices comfortably, and can tell which
dishes are vegetarian, all in the new visual style.

**Why this priority**: The QR menu is used in the restaurant every day; it must stay fast
and legible while adopting the new identity.

**Independent Test**: Open `/en/menu` and `/pt/menu` on a small phone. Jump between
sections, read a long dish description, and identify vegetarian dishes.

**Acceptance Scenarios**:

1. **Given** the menu, **When** a guest jumps to a section using quick navigation, **Then**
   the section heading is fully visible and not hidden behind fixed bars.
2. **Given** a dish with a long name or description, **When** displayed, **Then** the text
   wraps cleanly without overflow or truncating the price.
3. **Given** a vegetarian dish, **When** displayed, **Then** it is clearly marked and the
   marker does not rely on color alone.

---

### User Story 3 - Confident table booking (Priority: P1)

A guest books a table in a few steps: date, time, party size and contact details. The
flow looks consistent with the rest of the site, makes unavailable days and times
obvious, and ends with a clear confirmation.

**Why this priority**: Reservations are the main business action. A restyle must not make
booking harder or break any existing booking rule.

**Independent Test**: Complete a booking end to end in both languages on a phone,
including trying a fully booked day and an unavailable time, and submitting with a
missing required field.

**Acceptance Scenarios**:

1. **Given** the booking calendar, **When** a day is fully booked or closed, **Then** it is
   visibly disabled in a way that is clear without relying on color alone.
2. **Given** a missing or invalid field, **When** the guest submits, **Then** the error
   appears next to the field, says how to fix it, and focus moves to the first error.
3. **Given** a successful booking, **When** it is confirmed, **Then** the confirmation
   states the date, time and party size, and the guest knows what happens next.
4. **Given** the booking flow, **When** completed, **Then** availability rules, opening
   hours, closures and notifications behave exactly as before the redesign.

---

### User Story 4 - Consistent identity everywhere (Priority: P2)

A visitor moves between pages and sees one coherent brand: the same colors, typefaces,
spacing, buttons and navigation, on the landing page, menu, booking, footer and the
"closed" and error states. The mascot appears in a few purposeful places.

**Why this priority**: Consistency is what removes the template feel, but it depends on
the three page stories above existing first.

**Independent Test**: Visit every public page and state (closed today, booking
confirmed, empty states, not found) and compare against the design document.

**Acceptance Scenarios**:

1. **Given** any public page, **When** inspected, **Then** colors and type come from the
   shared design definition rather than one-off values.
2. **Given** the mascot, **When** it appears, **Then** it has a clear purpose (for example
   closed today or booking confirmed) and is not repeated decoratively.
3. **Given** the admin back office, **When** opened, **Then** it keeps its plain utility
   layout and is not restyled as a marketing page.

---

### User Story 5 - Accessible and fast on a phone (Priority: P2)

Every guest, including those using a keyboard, a screen reader, large text, or a slow
mobile connection, can use the public pages.

**Why this priority**: Most guests are on phones, and accessibility is a stated baseline
in the constitution. It is verified last, once the visuals are in place.

**Independent Test**: Keyboard-only walkthrough of all public pages; contrast check of
every text and background pair; reduced-motion setting enabled; throttled-connection load
of the landing page.

**Acceptance Scenarios**:

1. **Given** keyboard-only use, **When** tabbing through any page, **Then** the focused
   element is always visible and nothing is hidden behind fixed bars.
2. **Given** every text and background pair, **When** measured, **Then** normal text meets
   4.5:1 contrast and large text meets 3:1.
3. **Given** a system reduced-motion setting, **When** pages load, **Then** non-essential
   animation is off.
4. **Given** photos on the landing page, **When** loading, **Then** content does not jump
   around as images arrive.

---

### Edge Cases

- A very long dish name, a very long guest name, or a very long note in the booking form.
- A day with no available slots, a closed weekday, and a same-day booking too close to now.
- The restaurant is currently closed while the visitor is on the landing page.
- Portuguese text is longer than English and must not break buttons or the navigation.
- Very small phones, landscape orientation, and 200% text zoom.
- Slow connections where photos arrive late; page must stay usable and readable.
- A dish or section with no description or no photo.
- Visitor has JavaScript animations disabled or reduced motion enabled.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The public site MUST adopt the palette and direction defined in
  `docs/design.md`, and MUST NOT show the previous brown backgrounds or orange/gold brand
  accents on any public page.
- **FR-002**: The landing page MUST show, on its first screen on a phone, the restaurant
  name, real dish photography, current open/closed status, and a primary booking action.
- **FR-003**: Placeholder or developer-facing copy MUST be removed from all public pages
  in both languages, and the promotional banner MUST NOT use emoji.
- **FR-004**: All redesigned pages MUST be fully available in English and Portuguese with
  equivalent content.
- **FR-005**: The menu MUST remain navigable by section, keep dish names, descriptions,
  prices and vegetarian markers legible, and handle long text without overflow.
- **FR-006**: The booking flow MUST keep all existing behavior: opening hours, closures,
  fully booked days, same-day cutoff, validation, notifications and rewards.
- **FR-007**: Booking errors MUST appear next to the relevant field with a fix-oriented
  message, and the booking confirmation MUST state date, time and party size.
- **FR-008**: Disabled or unavailable states (closed or fully booked days, unavailable
  times) MUST be distinguishable without relying on color alone.
- **FR-009**: Colors, typefaces and spacing MUST be defined once in a shared design
  definition and reused by all public pages; one-off values are not allowed.
- **FR-010**: The mascot MUST appear only in purposeful places (such as closed-today and
  booking-confirmed states) and MUST NOT be used as repeated decoration.
- **FR-011**: The design MUST avoid the generic patterns listed in `docs/design.md`:
  identical rounded-card grids, tracked all-caps eyebrows above every heading, numbering
  on non-sequential content, and fade-up animation on every section.
- **FR-012**: All text and background combinations MUST meet WCAG 2.1 AA contrast, with
  cyan not used for text on light backgrounds.
- **FR-013**: All interactive elements MUST have a visible keyboard focus state, and
  fixed bars MUST NOT cover the focused element.
- **FR-014**: Non-essential motion MUST be disabled when the visitor has reduced motion
  turned on.
- **FR-015**: Images MUST NOT cause visible layout shift while loading.
- **FR-016**: Page titles, descriptions, social preview image and structured search
  content MUST continue to work for both languages after the redesign.
- **FR-017**: The admin back office MUST remain functionally unchanged and visually plain;
  it may adopt shared colors but MUST NOT be restyled as a public page.

### Key Entities *(include if feature involves data)*

- **Design definition**: The single source for colors, typefaces, spacing and component
  styles, described in `docs/design.md` and used by every public page.
- **Public page**: Landing, menu and booking pages, plus their closed, confirmation,
  empty, error and not-found states, each in English and Portuguese.
- **Brand assets**: Logo and wordmark, mascot, and the dish photography used on pages.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On a phone, a first-time visitor can start a booking from the landing page
  in no more than 2 taps and under 10 seconds.
- **SC-002**: A guest can complete a booking in under 2 minutes on a phone, using no more
  steps and no more taps than the current flow. (Real-world completion rate is monitored
  after launch; it is not a pre-release gate because there is no baseline.)
- **SC-003**: 100% of text and background pairs on public pages meet AA contrast.
- **SC-004**: 0 pages show the old brown backgrounds or orange/gold brand accents.
- **SC-005**: 0 leftover placeholder or developer-facing strings remain in either language.
- **SC-006**: Every public page is fully usable with keyboard only, with a visible focus
  indicator on every interactive element.
- **SC-007**: The landing page shows its main content in under 3 seconds on a mid-range
  phone over a Slow 4G connection (browser developer-tools throttling), with no visible
  content jumping.
- **SC-008**: In a review against `docs/design.md`, all listed generic patterns are
  absent, and the owner approves the look on landing, menu and booking pages.
- **SC-009**: Zero regressions in booking rules: every existing availability, closure and
  validation scenario still behaves as before.

## Assumptions

- Scope is the public pages only: landing, menu and booking (`/reserve`; `/reserve-v2`
  only redirects to it). The admin back office keeps its current layout and behavior.
- The direction, palette and rules in `docs/design.md` (draft v1) are accepted as the
  brief; final typefaces are chosen during planning after testing with real copy.
- The mascot remains the main brand mark, shown purposefully, alongside the TLÁLOC
  wordmark; the exact logo lockup is decided in planning.
- The five existing gallery photos are the minimum imagery; a new hero photo is welcome
  but not required to ship.
- Existing business rules, data, notifications and routes do not change; this is a visual
  and copy change only.
- Both languages (English and Portuguese) ship together.
- There is no automated test suite yet, so acceptance is checked manually on a phone and
  desktop, plus the accessibility and design audits named in the constitution.
