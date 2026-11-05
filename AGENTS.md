# Al Nashamah — guide for AI agents and developers

Bilingual (Arabic default, English) livestock store for the UAE. Product spec: `docs/MASTER_PROMPT.md`.
Brand rules: `.claude/skills/nashamah-brand/SKILL.md` — load it before any UI work.

## Stack

Next.js 16 (App Router, `src/proxy.ts` instead of middleware) · React 19 · TypeScript strict · Tailwind CSS 4
(brand tokens in `src/app/globals.css`) · PostgreSQL + Drizzle ORM · Vitest · Playwright.
Cache Components are **off** on purpose: stock and prices must always be live, so catalogue queries in
`src/server/catalog.ts` call `connection()` and render per request.

## Fresh checkout setup (laptop)

Needs Node.js 22+, pnpm (`corepack enable`) and Docker Desktop running.

```bash
pnpm install
cp .env.example .env.local    # defaults work as-is
pnpm db:setup                 # starts Postgres + Mailpit in Docker, applies migrations, seeds the catalogue
pnpm dev                      # http://localhost:3000  (use --port <n> for another port)
pnpm admin:create --email you@example.com --name "Your Name"   # first owner account (prints a password)
```

Admin panel: `/ar/admin` or `/en/admin` — email + password + authenticator-app code (TOTP).

Only one `next dev` can run per folder. The e2e tests reuse a dev server already running on port 3000.

## Validation commands (same as CI)

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test                 # unit tests (tests/unit)
pnpm exec drizzle-kit check
pnpm build
pnpm e2e                  # browser tests (tests/e2e), desktop + phone, needs the database
```

## Project map

- `src/app/[lang]/…` — pages; every page is under `/ar` or `/en`. `src/proxy.ts` redirects bare URLs.
- `src/i18n/` — locales and dictionaries (`ar.json` and `en.json` must have identical keys — a unit test enforces it).
- `src/server/db/schema.ts` — database schema. After changing it run `pnpm db:generate --name <change>` and commit
  the new file in `drizzle/`. Never edit an applied migration.
- `src/server/catalog.ts` — read-only queries for the public site.
- `src/lib/availability.ts` — stock rules (breed off ⇒ all its options out of stock; out-of-stock items are shown
  with a label, never hidden). Reuse these everywhere (pages, admin, checkout, API).
- `scripts/seed.ts` + `scripts/seed-data.ts` — starting catalogue. The seed only adds missing rows and never
  overwrites admin edits.
- `src/app/[lang]/admin/` — admin panel. `(auth)` = sign-in pages, `(panel)` = signed-in screens,
  `_actions/` = Server Actions. **Every page calls `requireStaff(lang, permission)` and every action calls
  `authorize(permission)`** (`src/server/auth/staff.ts`); roles → permissions in `src/server/auth/permissions.ts`.
  Every change is written with `audit()`.
- `src/server/auth/` — staff passwords (scrypt), authenticator codes (TOTP, secret encrypted with `AUTH_SECRET`),
  database-backed sessions (only a SHA-256 of the cookie token is stored), lockout after 5 failures.
- `src/server/storage/` — uploads (real file type checked from the bytes, 5 MB max), saved under `STORAGE_DIR`
  and served by `src/app/files/[...key]/route.ts`. Vercel Blob replaces this at go-live.
- `src/app/[lang]/(site)/` — the public shop pages (header/footer layout).
- `public/brand/` — logo files (do not redraw or recolour; see the brand skill). `public/illustrations/` — category art.

## Rules

- Every customer-facing text in both languages; use logical CSS (`ms-`, `pe-`, `start-`), never left/right.
- Money is integer fils (`price_fils`); `null` price = "Price coming soon". Use `formatAed`.
- Never trust prices or stock from the browser; recompute on the server.
- No secrets in git. New settings go in `.env.example` with a comment.
- Phase-by-phase plan and what is still a placeholder: `docs/MASTER_PROMPT.md` §11.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
