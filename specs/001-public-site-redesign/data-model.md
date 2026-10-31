# Data Model: Public Site Redesign

**No database or API changes.** No Prisma migration is needed, and reservation, menu, hours
and reward data are untouched (constitution principles IV and V).

The feature does introduce two non-database "entities" the implementation must keep coherent.

## Design tokens

Single definition of look, held as CSS custom properties in `src/app/globals.css` and
described in `docs/design.md`. Full list and usage rules: [contracts/design-tokens.md](./contracts/design-tokens.md).

| Group | Examples | Rule |
|---|---|---|
| Color | `--paper`, `--teal`, `--chile`, `--cyan`, `--lime`, `--agave`, `--muted` | Only these appear in public styles; every text/background pair must pass AA |
| Type | `--font-display`, `--font-body`, type scale steps | Two families; scale defined once |
| Space / shape | spacing steps, radii | No one-off values in public styles |
| Theme scope | public (default), admin (frozen legacy values) | Admin theme must reproduce today's look |

## Message keys

| Change | Keys |
|---|---|
| Remove (unused) | `Home.title`, `Home.body`, `Home.qrTitle`, `Home.qrBody`, `Home.reservationTitle`, `Home.reservationBody`, `Home.seoTitle`, `Home.seoBody`, `Home.discountBanner*` |
| Keep, review wording | hero, SEO block, FAQ, hours, gallery, nav, footer, menu and reservation namespaces |

Rule: any key added or removed must be changed in both `messages/en.json` and
`messages/pt.json` in the same commit; both files must have identical key sets.
