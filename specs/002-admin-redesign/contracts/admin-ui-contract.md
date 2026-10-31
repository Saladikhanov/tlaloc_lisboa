# Contract: Admin UI

No API or data contract changes. The contract here is the set of rules the admin interface relies on:
how the theme is chosen, which tokens exist, how tabs are addressed, and how statuses look.

## 1. Theme selection

- Attribute: `data-admin-theme="light"` or `data-admin-theme="dark"` on `<html>`, present only on admin routes
  (set before first paint, removed when leaving the admin).
- Preference storage key: `tlaloc-admin-theme` with `"light"` or `"dark"`; absent means follow the device.
- Native controls follow the theme (`color-scheme: light` or `dark` under the same attribute).
- `<meta name="theme-color">` is set to the theme's `--a-bg` value and updated on switch.
- The switch offers three options: Device, Light, Dark (default Device). It is reachable from the shell on every
  screen and on the sign-in page.

## 2. Tokens (values verified for WCAG 2.1 contrast)

| Token | Light | Dark | Use |
|---|---|---|---|
| `--a-bg` | `#F4F6F5` | `#0B1417` | page background |
| `--a-surface` | `#FFFFFF` | `#121D21` | cards, panels |
| `--a-surface-2` | `#ECF0EF` | `#1A282D` | raised or inset areas |
| `--a-text` | `#0A2B36` | `#EAF1F1` | body text |
| `--a-muted` | `#4F6168` | `#9DB0B5` | secondary text |
| `--a-line` | `rgba(10,43,54,.18)` | `rgba(255,255,255,.14)` | dividers, outlines |
| `--a-accent` | `#0A2B36` | `#C9E265` | active tab, links, focus ring |
| `--a-action` | `#D62F25` | `#D62F25` | the one hot color: main action, destructive confirm (label `#FFFFFF`) |

Contrast checks (text pairs need 4.5:1, large text and non-text need 3:1):

| Pair | Light | Dark |
|---|---|---|
| text on bg / surface / surface-2 | 13.7 / 14.9 / 13.0 | 16.3 / 15.0 / 13.3 |
| muted on bg / surface / surface-2 | 6.0 / 6.5 / 5.6 | 8.3 / 7.6 / 6.7 |
| white on action | 4.9 | 4.9 |
| action against bg (non-text) | 4.5 | 3.8 |
| accent on surface | 14.9 | 11.9 |
| active tab (paper on teal / dark on lime) | 14.4 | 12.9 |

## 3. Status chips (text and shape always present)

| Status | Light (background / text) | Dark (background / text) | Shape |
|---|---|---|---|
| New or unread | `#DDF0FA` / `#0A2B36` (12.7) | `#12384A` / `#BEE6F7` (9.4) | filled dot |
| Confirmed | `#D9EFE3` / `#134D35` (8.1) | `#14402E` / `#BFE8D2` (8.7) | check mark |
| Cancelled | `#FBE0DE` / `#8E1F18` (7.1) | `#4A1B18` / `#F6C6C2` (9.4) | cross |
| No-show | `#E8E8E4` / `#3D4A4F` (7.5) | `#2A3539` / `#C9D4D6` (8.3) | ring |

## 4. Alert styles (the three existing options)

| Style | Maps to | Light | Dark |
|---|---|---|---|
| Green | Confirmed chip tokens | as above | as above |
| Orange | Warning pair | `#FBE9CC` / `#6B3F00` (7.6) | `#4A3410` / `#F6DCB0` (8.8) |
| Neutral | Surface-2 and text | `--a-surface-2` / `--a-text` | `--a-surface-2` / `--a-text` |

Alerts never rely on color alone: each carries a text title and an icon. Sound and desktop notifications are unchanged.

## 5. Navigation

- Tabs and addresses are unchanged: `/admin?tab=reservations|today|calendar|metrics|rewards|menu|security|hours`.
- Desktop: top glass bar with all tabs.
- Phone: bottom glass tab bar with Today, Reservations, Calendar and More; More opens a sheet with Metrics, Rewards, Menu, Hours,
  Settings, the theme switch, links to the public site and sign out.
- Primary actions are at least 44 px high on phones; the shell never causes horizontal scrolling at 360 px.

## 6. Migration states

- `admin-v2`: uses `--a-*` tokens and the new components.
- `admin-legacy`: a self-contained island that keeps today's dark brown variables, fonts and rules until its tab is migrated; it is
  readable in either theme. Removed in the final stage together with the legacy rules and fonts.

## 7. Enforcement

- `scripts/check-contrast.mjs` gains the admin pairs for both themes and fails on any miss.
- Review rule: no hex literal in admin v2 styles outside the token definitions.
- After every task touching the admin component: `git diff --stat -- src/lib src/app/api` must be empty.
