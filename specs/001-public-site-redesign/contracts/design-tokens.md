# Contract: Design Tokens (UI contract)

The site exposes no new API. The contract here is the set of CSS custom properties that
public components rely on. Names are stable; values may be tuned in `docs/design.md`.

## Color tokens (defined on `:root`)

| Token | Value | Allowed use |
|---|---|---|
| `--paper` | `#FBFBF8` | Page background, cards on teal text color |
| `--teal` | `#0A2B36` | Body text on paper; nav, footer, booking band background |
| `--teal-mid` | `#12404F` | Raised surfaces on teal |
| `--cyan` | `#27A9D8` | Accents on teal; large decorative fills. **Never text or lines on paper** |
| `--chile` | `#D62F25` | Primary actions, the one hot accent. On teal: large text only |
| `--lime` | `#C9E265` | Small highlights and focus accents on teal |
| `--agave` | `#1F6B4A` | Secondary accents, vegetarian marker (with an icon or label, not color alone) |
| `--muted` | `#4F6168` | Secondary text on paper only |

## Verified pairs (WCAG 2.1 contrast)

| Foreground / background | Ratio | Use |
|---|---|---|
| teal / paper | 14.35 | body text |
| paper / teal | 14.35 | text on dark bands |
| muted / paper | 6.25 | secondary text |
| white / chile | 4.89 | button label |
| chile / paper | 4.72 | links, accent text |
| cyan / teal | 5.49 | accents on dark |
| lime / teal | 10.31 | highlights on dark |
| agave / paper | 6.21 | secondary accents |

Forbidden: cyan on paper (2.61), muted on teal (2.30), chile on teal for small text (3.04).

## Typography tokens

- `--font-display`: Bricolage Grotesque (headings).
- `--font-body`: Figtree (all other text).
- Body line length under 80 characters; sentence case; Portuguese diacritics supported.

## Theme scope

- Default (`:root`): public theme.
- Admin: a scoped wrapper class restores the pre-redesign variable values and page
  background so `/admin` and `/admin/login` look exactly as before.

## Enforcement

- `scripts/check-contrast.mjs` fails if any declared pair under 4.5:1 is used for normal text.
- Review rule: no hex literals in public styles outside the token definitions.
