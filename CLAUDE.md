# Tláloc

Restaurant platform: landing site, QR menu, reservations (v1 + v2), admin back office.
Next.js 16 App Router · React 19 · TypeScript · Prisma 7/PostgreSQL · next-intl (en, pt).

## Commands
- `npm run dev` — dev server
- `npm run lint`, `npm run build` — required before merge
- `npm run prisma:migrate` — create/apply migrations

## Layout
- `src/app/[locale]/**` public pages; `src/app/admin/**` back office; `src/app/api/**` routes
- `src/lib/*-store.ts` DB access; other `src/lib` modules hold business rules
- `src/components/` UI; `messages/{en,pt}.json` translations; `prisma/` schema + migrations

## Design
- Redesign is split: `001-public-site-redesign` (in progress), then `002-admin-redesign`.
  Until 002, the admin stays on its frozen look (`.admin-theme`, `src/app/admin/layout.tsx`).
- Use the `frontend-design` skill (`.claude/skills/frontend-design`) for UI work. Tokens live in `src/app/globals.css`; see constitution VII.
- After building or changing UI, audit it with `web-design-guidelines` (a11y/UX) and
  `vercel-react-best-practices` (React/Next.js performance).
- Copy conflict: `web-design-guidelines` asks for Title Case headings/buttons; our copy
  is sentence case and bilingual (en/pt). Follow the design spec for copy style and
  ignore that rule.

## Spec-driven development (Spec Kit)
- Principles: `.specify/memory/constitution.md` — read before planning or implementing.
- Workflow skills: `/speckit-specify`, `/speckit-clarify`, `/speckit-plan`, `/speckit-tasks`,
  `/speckit-analyze`, `/speckit-implement`, `/speckit-converge`.
- Feature artifacts live in `specs/<NNN-feature>/`. Don't write code for a feature
  without an approved spec and plan.
