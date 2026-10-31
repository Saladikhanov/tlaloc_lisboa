# Research: Public Site Redesign

## R1. Keeping the admin unaffected

- **Finding**: Admin and public pages share `src/app/globals.css` and the same `:root`
  variables; `body` has a hardcoded brown gradient and `padding-top: 70px`. A palette change
  in `:root` would restyle the admin. The admin has no layout file of its own.
- **Decision**: Introduce the new tokens in `:root`. Add a scoped admin theme (a wrapper
  class applied from the admin pages) that re-declares today's variable values and
  background. Move the `body` background into a token so each theme sets it.
- **Rationale**: Smallest change that guarantees FR-017; admin can be redesigned later as
  its own feature.
- **Alternatives**: Split admin styles into a separate stylesheet (larger, riskier refactor
  of a 4,942-line component's styling); duplicate the whole app layout (violates simplicity).

## R2. Typefaces

- **Finding**: Four families load on every page (Geist, Geist Mono, Bebas Neue, Pacifico).
  Bebas + Pacifico is a template cliché. Needs Portuguese diacritics and "Tláloc" accent.
- **Decision**: Bricolage Grotesque for headings, Figtree for body, both via `next/font/google`
  (self-hosted at build). Drop the other four.
- **Rationale**: Bricolage is expressive without being a novelty face and pairs with the
  slab-like TLÁLOC wordmark by contrast; Figtree is friendly and highly legible at small sizes;
  two families instead of four reduces font weight on mobile.
- **Verification step**: confirm latin-ext coverage at build time and view the real hero and
  a Portuguese menu line in the browser before locking in. **Fallback**: Familjen Grotesk
  (headings) with the same body face.
- **Alternatives**: Keep Geist for body (lowest risk, but reads as the Vercel/AI default);
  a serif display (risks the "cream + serif" tell listed in the design skill).

## R3. Palette and contrast

- **Decision**: Palette from `docs/design.md`; verified pairs recorded there. Cyan only on
  teal or as large fills; chile on teal large text only; muted text not used on teal.
- **Method**: `scripts/check-contrast.mjs` computes WCAG ratios for every declared
  foreground/background pairing and fails on any normal-text pair under 4.5:1. Run before each slice merges.
- **Alternatives**: Manual spot checks only (error-prone across ~257 color literals).

## R4. Hero and imagery

- **Finding**: Hero stacks three copies of `backgroundTlaloc.webp` (base, blur-top, blur-band)
  plus a scrim, then a separate hero image. The photo is 4030×2683, bright daylight.
- **Decision**: One full-bleed `next/image` hero from the existing photo set with `priority`,
  explicit dimensions and responsive `sizes`; text placed over a calm area or beside the photo.
  Remove the blur layers and scrim.
- **Rationale**: Simpler, faster (fewer image layers), and shows the food honestly.
- **Open**: a dedicated hero reshoot is optional; the five existing photos are enough to ship.

## R5. Copy cleanup

- **Finding**: `Home.title/body`, `qrTitle/qrBody`, `reservationTitle/Body`, `seoTitle/Body`
  and the discount banner keys are not rendered anywhere (no `t("title")` etc. in public
  code; the banner JSX is commented out).
- **Decision**: Delete those keys from both `messages/en.json` and `messages/pt.json` and the
  commented banner block; keep SEO block and FAQ copy (used for search) but review wording.
- **Rationale**: Satisfies FR-003 and SC-005 with zero visual risk.

## R6. Other brown surfaces

- **Finding**: `manifest.ts` uses `#130800` for `theme_color` and `background_color`;
  `og_image.jpg`, favicons and app icons may carry the old palette.
- **Decision**: Update manifest colors to the new tokens; review the OG image and icons and
  regenerate if they use brown. Add a `theme-color` viewport value matching the page.
- **Rationale**: Covers FR-001/FR-016 outside CSS (browser chrome, link previews, installs).

## R7. Motion and accessibility

- **Finding**: `framer-motion` is installed; usage in public components should be reviewed.
- **Decision**: Keep at most one orchestrated entrance on the landing page; interaction
  feedback only elsewhere; gate everything on `prefers-reduced-motion`.
- **Rationale**: Matches `frontend-design` guidance and FR-014.

## R8. Dead code

- **Finding**: `src/app/page.module.css` is the create-next-app starter and is unused.
- **Decision**: Delete it during Slice 0.

All "NEEDS CLARIFICATION" items are resolved; the only deferred choice is the visual
confirmation of the font pairing (R2), tracked as a checkpoint in Slice 0.
