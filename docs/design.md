# Tláloc Design Direction

Status: **v1 implemented** (2026-10-31). Scope: public site (landing, menu, reservation flow).
The admin back office stays plain and consistent, and only adopts the new tokens.

## Why we're changing
The current look is a near-black brown base (`#130800`, cards `#2a1505`/`#3a1f0b`) with
orange/gold accents, Bebas Neue + Pacifico, and a dark page that dulls our bright daylight
photos. The goal is a site that looks made for this restaurant, not a template.

## Concept: "Daylight + Lluvia"
A light, photo-first site (our photos are bright: pale wood, black slate, green salsa,
watermelon-pink margarita) anchored by deep rain-teal. Tláloc is the rain god, and the
mascot fish's cyan is the brand color. Chile red is the single hot accent. The mascot is
the one memorable element; everything else stays quiet.

## Palette (contrast verified against WCAG 2.1)

| Token | Hex | Role |
|---|---|---|
| `--paper` | `#FBFBF8` | page background |
| `--teal` | `#0A2B36` | text, nav, footer, reservation band |
| `--teal-mid` | `#12404F` | raised surfaces on teal |
| `--cyan` | `#27A9D8` | mascot blue; accents **on teal only** |
| `--chile` | `#D62F25` | primary action, the one hot accent |
| `--lime` | `#C9E265` | small highlights, status, focus accents on teal |
| `--agave` | `#1F6B4A` | secondary, vegetarian marker |
| `--muted` | `#4F6168` | secondary text on paper |

Verified pairs: teal on paper 14.4 · paper on teal 14.4 · muted on paper 6.3 ·
white on chile 4.9 · chile on paper 4.7 · cyan on teal 5.5 · lime on teal 10.3 ·
agave on paper 6.2.

Rules from the check:
- Never use cyan as text or a line on `--paper` (2.6:1, fails). Use it on teal or as a large fill.
- Chile on teal is large text only (3.0:1). Don't use it for small text there.
- Muted text on teal fails (2.3:1). On teal, use paper at full or ~80% opacity.
- Re-run contrast whenever a hex changes.

## Typography
- Replace Bebas Neue + Pacifico (template cliché). **Decided 2026-10-31:** Bricolage Grotesque
  (headings, `--font-display`) + Figtree (body, `--font-body`), loaded in `src/app/layout.tsx`
  and exposed on `<html>`. The admin keeps Geist + Bebas via `src/app/admin/layout.tsx`.
- Two families at most: one characterful grotesk for headings, one clean text sans.
  Fallback if Bricolage ever disappoints with the wordmark: Familjen Grotesk for headings.
- Must support Portuguese diacritics (á, ã, ç, õ) and the accent in "Tláloc".
- Body line length under 80 characters; sentence case for headings and buttons.

## Layout and imagery
- Real photography full-bleed; no stock, no gradient washes.
- The hero opens with a real dish photo and the name, not a stat row.
- No identical rounded-card grid, no emoji, no tracked ALL-CAPS eyebrow above every heading.
- Numbering only for real sequences (e.g. reservation steps).
- Motion: one orchestrated moment at most; motion that answers a user action is fine.
  Respect `prefers-reduced-motion`.
- Mascot: used large and sparingly, with a job (closed-today, booking confirmed, empty states).

## Shape and the glass layer
- Page content is square: blocks and photos have no radius; buttons and inputs use 2px.
- The glass layer is the exception and is rounded: the floating header (16px), its circular
  logo, the pill language switch, the rounded menu button and the mobile menu sheet.
- The floating controls (Jump to, scroll to top, the jump sheet) use the same glass, radius and
  shadow as the header.
- The header is light liquid glass (about 72% white over a strong blur) with teal text; the
  active page is shown with a chile underline, not color alone.

## Copy
- Plain, specific, bilingual (en/pt) with the same meaning in both.
- Remove leftover dev/SEO-filler copy from `messages/*.json` as part of the redesign
  (e.g. `Home.title`/`body` about "one project: QR menu, reservations…", the emoji discount banner).
- Buttons name the action ("Book a table"); errors say how to fix the problem.

## Quality floor
Responsive down to small phones, visible `:focus-visible`, AA contrast, reduced motion,
no layout shift from images. After building, audit with `web-design-guidelines` and
`vercel-react-best-practices`.

## Decisions made while building
- **Mascot:** shown as a circle (the file has a black square behind it, no transparency), in the
  header, the closed-state status, the success modal and the not-found and error pages.
- **Color fields:** lime for the landing hero, booking and status pages; teal for the visit band
  and footer; chile red only for the main action; menu category bands rotate lime, chile, teal, cyan.
- **Taco progress bar:** kept on the booking page with its original looping bob and sway; it only
  animates when the visitor allows motion.
- **Photos:** the two gallery photos with children are approved by the parents.

## Open decisions
- **High-resolution mascot:** the 512 px app icon is a blurry upscale of a 200 px file; a vector or
  large transparent version would fix the icons and allow a cleaner mascot everywhere.
- **Hero photo:** the five existing photos work; a dedicated hero shot is optional.
- **Admin back office:** redesigned in feature 002 on the same tokens (it keeps its legacy look until then).
