# Data Model: Admin Back Office Redesign

**No database, API or server change.** No Prisma migration; reservations, closures, menu, hours, rewards and
settings are untouched (constitution principles IV and V).

The feature adds one small piece of client-side state and a token set.

## Theme preference (browser storage, per device)

| Field | Value |
|---|---|
| Key | `tlaloc-admin-theme` |
| Values | `"light"`, `"dark"`; key absent means "follow the device" |
| Scope | One browser profile on one device; never sent to the server |
| Validation | Any other stored value is ignored and treated as absent |
| Failure | If storage is unavailable, follow the device and let the switch work for the current session |

State rules:
- Absent → resolved theme = device setting, and it updates live if the device setting changes.
- `"light"` or `"dark"` → resolved theme is fixed until the staff member changes it.
- The resolved theme is written to the `data-admin-theme` attribute on `<html>` only while on admin routes.

## Admin design tokens

Semantic CSS custom properties with a light and a dark value set; names, values and verified contrast are in
[contracts/admin-ui-contract.md](./contracts/admin-ui-contract.md).

| Group | Examples |
|---|---|
| Surfaces | `--a-bg`, `--a-surface`, `--a-surface-2` |
| Text and lines | `--a-text`, `--a-muted`, `--a-line` |
| Accent and action | `--a-accent`, `--a-action` (the one hot color) |
| Status chips | `--a-new-*`, `--a-confirmed-*`, `--a-cancelled-*`, `--a-noshow-*` (background and text) |
| Alert styles | `--a-alert-green-*`, `--a-alert-orange-*`, `--a-alert-neutral-*` |

## Unchanged entities

Reservation (and statuses new, confirmed, cancelled, no-show; read/unread), closure, alert settings, working hours,
menu, rewards: no change to fields, rules or permissions.
