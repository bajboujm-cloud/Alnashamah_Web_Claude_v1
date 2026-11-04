# Al Nashamah — Master Build Prompt

> This is the living spec Claude Code works from — you don't need to paste it. It is kept up to date
> with every decision. **Status: Phase 0 and Phase 1 are built** (see §11).
> Later phases are built one GitHub issue at a time with the Software Factory (section 10).

=====

You are a senior full-stack engineer and product designer. Build **Al Nashamah (النشامى)**, a bilingual
(English + Arabic, full RTL) web app for ordering livestock in the UAE. Domain: **alnashamah.ae**.
It will become a mobile app later, so expose the business logic through a clean, versioned API
(`/api/v1/...`) that a React Native (Expo) app can reuse.

Read first: `AGENTS.md` (create it if missing), `.claude/skills/nashamah-brand/SKILL.md`,
`docs/brand/brand-kit.pdf`, `public/brand/` (web logo files), `docs/COMPETITOR_ANALYSIS.md`,
`docs/SETUP_GUIDE.md`.

## 0. Budget rule — this phase is 100% free and runs only on my laptop

We are in planning/design/implementation. **No paid subscriptions and nothing deployed online.**
The testing environment is my laptop only. Every external service sits behind an interface with a
free **local** implementation now and a **production** implementation that is switched on later by
environment variables only (no code changes):

| Concern                                        | Local now (free, on laptop)                                                                           | Production later                                               |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Database                                       | PostgreSQL 16 in Docker (`docker compose up`)                                                         | Neon Postgres                                                  |
| File storage (photos, illustrations, invoices) | `LocalDiskStorage` → `./.storage/`, served by a route                                                 | Vercel Blob                                                    |
| Payments                                       | `MockPaymentProvider`: a fake card page with "Pay / Fail" buttons that calls the same webhook handler | Stripe or a UAE gateway (Tap / Telr / N-Genius) + Tabby/Tamara |
| OTP SMS                                        | `ConsoleOtpProvider`: prints the code in the terminal and shows it on screen in dev only              | Twilio Verify (SMS + WhatsApp)                                 |
| Email                                          | SMTP to **Mailpit** in Docker (inbox at http://localhost:8025)                                        | Resend                                                         |
| Bot check                                      | Cloudflare Turnstile **test keys** (always pass)                                                      | Turnstile real keys                                            |
| Rate limiting                                  | in-memory                                                                                             | Upstash Redis                                                  |
| Hosting                                        | `pnpm dev` / `pnpm build && pnpm start` on localhost                                                  | Vercel                                                         |

Provide `docker-compose.yml` (postgres + mailpit), `.env.example` with every variable explained,
`pnpm setup` (install, start Docker services, migrate, seed) and `pnpm dev`. The app must run with only
Docker Desktop + Node.js installed and **zero accounts**. Never commit secrets.

## 1. Tech stack (fixed)

Next.js (App Router) + React + TypeScript (strict) · Tailwind CSS + shadcn/ui themed with brand tokens,
RTL-safe logical utilities only · next-intl (`/en`, `/ar`; Arabic default for Arabic browsers) ·
PostgreSQL + Drizzle ORM with committed migrations · Better Auth (phone-OTP + email + admin plugins) ·
Zod validation shared client/server · TanStack Query · @react-pdf/renderer with embedded Noto Kufi
Arabic / Noto Sans Arabic for invoices · React Email · Vitest · Playwright (EN + AR) · ESLint + Prettier.

## 2. Catalogue (everything admin-editable, bilingual EN/AR)

### Categories (each has an illustration / vector image)

| Category       | Status at launch                                      |
| -------------- | ----------------------------------------------------- |
| Sheep — غنم    | active                                                |
| Goats — ماعز   | active                                                |
| Cattle — أبقار | created, shown as **"Coming soon / قريباً"** (toggle) |
| Camels — إبل   | created, shown as **"Coming soon / قريباً"** (toggle) |

Fields: name_en/ar, slug, **illustration (SVG/PNG)**, short description, sort order, status
(`active` / `coming_soon` / `hidden`). New categories can be added any time from the admin.

### Seasonal collections (each has its own illustration / vector image)

- **Eid Al-Adha Sacrifice / Qurban — أضحية عيد الأضحى / قربان** (first seasonal option; more can be added,
  e.g. Aqiqah — عقيقة).
- Fields: name_en/ar, description, illustration, on/off toggle, visible-from / visible-until dates,
  pre-booking window, which breeds/age options are eligible (and optional seasonal price override),
  delivery day choice (e.g. Eid day 1 / 2 / 3), "on behalf of" name field, banner on the home page
  while active.

### Breeds (each has ONE photo — photos are per breed, not per age/weight)

| Category | Breeds (EN — AR)                                                             |
| -------- | ---------------------------------------------------------------------------- |
| Sheep    | Naeemi — نعيمي · Najdi — نجدي · Herri — حري · Somali — صومالي · Local — محلي |
| Goats    | Local — محلي · Somali — صومالي · Kashmiri — كشميري                           |

Fields: name_en/ar, description_en/ar (origin, taste, best for), **photo** (uploaded in admin; use a
neutral branded placeholder until provided), sort order, **availability toggle**.

### Age / weight options (per breed)

Each option = **Age range + Weight range + Price** — values are **placeholders for now** (show "—" /
"Price on request" style placeholder in the admin, not fake numbers to customers).

- Fields: label_en/ar (optional, e.g. "Option 1"), age (from–to, months), live weight (from–to, kg),
  price (AED, stored as integer fils), optional compare-at price, sort order, **availability toggle**.
- Seed **3 options per breed**; the admin can add a 4th or 5th option to specific breeds (no hard limit,
  UI designed for 3–5) and delete/reorder options.

### Availability toggles — the most important admin feature

- One-tap switch icon next to every **breed** and every **age/weight option** in the admin list
  (and inside the breed edit page). Instant save with optimistic UI and an undo toast; every change is
  written to an audit log (who/when).
- Turning a **breed off** → the breed card stays visible with an **"Out of stock / نفدت الكمية"**
  label and all its options are unselectable. Turning **one option off** → that row stays visible,
  greyed, with the same label. **Never hide** out-of-stock items. Ordering an unavailable item is
  blocked on the server too (and re-checked at checkout and at payment).
- Same toggle pattern for cutting options, extras and packaging.

### Cutting options — final list will be provided later

Build the table and admin UI now. Seed editable placeholders based on common UAE cuts (owner will
rename/remove): Arabic cut 8 pieces, Arabic cut 4 pieces, Half lengthwise, Fridge cut (medium pieces),
Whole (Ghouzi), Saloona (small pieces), Biryani (large pieces), Hadrami joints, Mufattah.
Fields: name_en/ar, description, optional photo and optional video link, extra price (default 0),
applies-to categories, toggle, sort order.

### "Order includes" extras

Checkboxes per order line: **Head — الرأس · Intestines — المصران · Tripe — الكرش** (admin-editable list,
each with default ticked/unticked, optional price, toggle).

### Packaging (price per animal)

| Option                                | Price  |
| ------------------------------------- | ------ |
| Slaughterhouse bag — كيس المسلخ       | Free   |
| Carton box — كرتون                    | AED 10 |
| Foam box with ice — صندوق فلين مع ثلج | AED 25 |

Admin can edit names, descriptions, photos, prices and toggle each one.

### Delivery — placeholder

Prices and slots are not decided. Build the data model and admin screens (zones per emirate with fee,
time slots with capacity and cut-off, blackout dates, pickup-from-shop toggle) but seed them as
**"To be confirmed"**: fee 0 with a visible "Delivery fee will be confirmed" note in checkout, and a
single generic slot. All seven emirates in the address dropdown.

### Price rules

All totals are computed on the server from the database. Order lines store a **snapshot** of names,
age/weight, and prices so later edits never change past orders. UAE **VAT 5%** configurable in settings
(prices entered VAT-inclusive or exclusive — setting).

## 3. Customer flow

1. **Home**: hero with logo, category tiles with illustrations (Cattle/Camels "Coming soon"), active
   seasonal banner (Eid Al-Adha / Qurban with its illustration), breeds, how-it-works
   (Choose → Cut → Pack → Deliver), trust strip (halal, licensed slaughterhouse, weight guarantee,
   vet-checked), FAQ, WhatsApp button. Language auto-detected, one-tap switch — **no blocking pop-up**.
2. Category → breed cards (photo, "from" price or "Price on request", availability label).
3. **Breed page / order builder** (stepper with a sticky summary):
   age/weight option (radio rows: _age · weight · price_) → cutting (cards with photo) → extras
   (head / intestines / tripe) → packaging (bag free / carton 10 / foam+ice 25) → quantity →
   special instructions (+ "on behalf of" name for Qurban) → Add to cart.
4. Cart → **Log in with mobile number (OTP)** or **Continue as guest** (name + mobile verified by OTP,
   optional email + "Email me the invoice" checkbox).
5. **Delivery address** (required before payment): emirate, area, street/building/villa, landmark,
   map pin (optional, Google Maps later), date/slot (placeholder), saved addresses for members.
6. Review & pay (VAT shown, accept terms) → payment (mock locally).
7. Confirmation page, invoice download, email (Mailpit locally), order tracking:
   Received → Confirmed → Slaughtering → Cutting & packing → Out for delivery → Delivered
   (or Cancelled / Refunded). Guests track with order number + mobile.

## 4. Payments and invoices

- Order created as `pending_payment` before payment; marked paid **only** by the verified webhook
  (signature, idempotent) — the mock provider uses the exact same code path.
- On payment, generate a bilingual **Tax Invoice PDF** following the brand kit invoice page (green top
  bar, "INVOICE | فاتورة", gold hairlines, logo): company details and TRN from settings (placeholders now),
  sequential invoice number, customer, address, lines (category, breed, age, weight, cutting, extras,
  packaging, qty, price), subtotal, delivery, discount, VAT 5%, total AED. Store via the storage
  interface; downloadable from confirmation page and account.
- Email the invoice to members with an email, or to guests who ticked the box.

## 5. Login and security

- Customers: **mobile number + one-time code** (E.164, default +971). Mitigations (implement now, with
  local equivalents): bot check before sending a code; rate limits per number and per IP; country
  allow-list (UAE + GCC); 6-digit code, 5-minute expiry, max 5 attempts then lockout; optional verified
  email as backup/recovery; re-verify for changing phone number; secure httpOnly cookies, session
  rotation, "log out of all devices".
- Admin/staff: **email + password + authenticator app (TOTP)** — never SMS-only. Roles: owner, manager,
  order staff, content editor. Audit log for every catalogue, price, toggle and order change.
- OWASP Top 10: CSRF, strict CSP and security headers, Zod validation, parameterised queries, private
  invoice files behind auth/signed links, minimal PII, privacy policy (UAE PDPL), cookie notice.

## 6. Admin panel (`/admin`, EN/AR, mobile-friendly)

Dashboard (today's orders, revenue, status counts) · Categories (illustrations, coming-soon status) ·
Seasonal collections · Breeds (photo upload, toggle) · Age/weight options per breed (inline table:
age, weight, price, toggle, add row, reorder) · Cutting, extras, packaging (toggle, price) · Orders
(filter, status change with customer notification, print invoice & packing slip, notes, refund) ·
Customers · Delivery zones/slots (placeholder) · Coupons · Pages/FAQ content · Settings (company,
TRN, VAT, phones, WhatsApp, payment methods) · Simple sales report + CSV export.

## 7. Design and quality

Follow `.claude/skills/nashamah-brand/SKILL.md` exactly. Use the logo files in `public/brand/`
(tagline **LIVESTOCK TRADING / لتجارة المواشي**; never "Cattle trading"); icon-only mark and
favicon from it; create simple brand-coloured SVG illustrations for each category and for Eid Al-Adha
(flat, Royal Green / Gold / Ivory line style matching the logo — replaceable in admin).
Mobile-first; WCAG 2.2 AA; Lighthouse ≥ 90; server-rendered pages with localized metadata, hreflang,
sitemap and product structured data (competitor is JS-only — beat them on SEO); PWA manifest.

## 8. Environments

1. **Local (now)** — laptop only, as in section 0.
2. **Production (later)** — Vercel + Neon + Blob + real providers on `alnashamah.ae`.
3. **Staging/backup (later)** — Vercel Preview per pull request + Neon database branch; Neon
   point-in-time restore for backups.
   Document in `AGENTS.md` how to switch each provider by env vars.

## 9. Repository and free GitHub checks

- `AGENTS.md`: setup, `pnpm dev --port <port>`, validation commands
  (`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm e2e`).
- GitHub Actions `ci.yml` on every PR and push to `main`: install, lint, typecheck, unit tests, build,
  Playwright e2e (EN + AR) against a Postgres service container, migration check.
- Free security checks (repo is private, so avoid paid GitHub Advanced Security features):
  **Dependabot** alerts + version updates (npm + actions), `actions/dependency-review-action`,
  **gitleaks** (secret scanning), **Semgrep** OSS (static security analysis), `pnpm audit`,
  Lighthouse CI against the locally built app, plus `SECURITY.md`. (If the repo is ever made public,
  enable GitHub CodeQL and push protection too.)
- Branch protection on `main`: PR required, CI must pass.

## 10. Software Factory

Install **Software Factory v2** by following
https://github.com/zazencodes/zazencodes-season-3/blob/main/src/software-factory-claude-code-v2/INSTALL.md
— `factory/checks.sh` = the same commands as CI; tailor reviewers: security (OTP, sessions, payments
webhook, invoices, PII), UI (nashamah-brand skill, RTL, out-of-stock labels), UX (order stepper, guest
checkout, Arabic copy). The approver must ESCALATE anything touching auth, payments, invoices/VAT,
database migrations, env vars or CI. After Phase 1, create one small GitHub issue per remaining item
(I add the `factory` label when ready).

## 11. Phases

- **Phase 0 ✅** — scaffold, Docker services (Postgres + Mailpit), CI + security checks,
  AGENTS.md, brand tokens/fonts, layout (header, footer, language switch, RTL), schema + seed
  (categories, Eid seasonal, 8 breeds, 3 placeholder options each, cuts, extras, packaging).
- **Phase 1 ✅** — public catalogue EN/AR with out-of-stock labels and coming-soon categories.
  Each service adapter (storage, OTP, email, payment) is built in the phase that first needs it,
  with its free local implementation.
- **Phase 2** — admin: staff login (TOTP), catalogue CRUD, photo/illustration upload, one-tap toggles,
  audit log.
- **Phase 3** — order builder (age/weight, cutting, extras, packaging, notes), cart.
- **Phase 4** — customer phone-OTP login, guest checkout, addresses, delivery placeholder.
- **Phase 5** — mock payment + webhook, orders, VAT, PDF invoice, emails.
- **Phase 6** — order tracking, admin order management, coupons, Eid Al-Adha collection, reports.
- **Phase 7** — SEO, PWA, accessibility/performance/security hardening, go-live checklist and
  production provider switch-over guide.
- **Phase 8 (later)** — Expo mobile app reusing the API, translations and brand tokens.

Rules: small commits, tests with every feature, bilingual from day one, never commit secrets, ask me
before any business decision (prices, policies, legal text, gateway). At the end of each phase list
exactly what I should click/test on my laptop and what you need from me.

## Inputs still to come from the owner

Age/weight/price per breed · breed photos · final cutting options · delivery fees and slots ·
company legal name, licence, TRN, address, phones, WhatsApp, email · refund/cancellation policy ·
payment gateway (after trade licence).

=====
