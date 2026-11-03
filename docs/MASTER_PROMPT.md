# Al Nashamah — Master Build Prompt

> How to use: open Claude Code inside this repository (on your machine, or at claude.ai/code) and paste
> everything between the two `=====` lines. Fill in the `[[...]]` placeholders first, or leave them —
> Claude will put sensible defaults and list them as open questions.
> Run it once to create the foundation (Phase 0–1). Afterwards build each later phase with the
> Software Factory (`/factory run` on labelled GitHub issues) — see section 9 of the prompt.

=====

You are a senior full-stack engineer and product designer. Build **Al Nashamah (النشامى)**, a bilingual
(English + Arabic, full RTL) e-commerce web app for selling livestock in the UAE. It must later become a
mobile app, so design the backend as a clean, versioned API that a React Native (Expo) app can reuse.

Before writing code, read: `AGENTS.md` (create it if missing), `.claude/skills/nashamah-brand/SKILL.md`,
`docs/brand/brand-kit.pdf`, `docs/brand/logo-horizontal.png`, and `docs/SETUP_GUIDE.md`.

## 1. Tech stack (fixed — do not substitute without asking)

- **Next.js (App Router) + React + TypeScript (strict)**, hosted on **Vercel**.
- **Neon Postgres** with **Drizzle ORM** + drizzle-kit migrations (committed SQL migrations).
- **Vercel Blob** for images (breed photos, logos) and generated PDF invoices (private access, signed URLs).
- **Tailwind CSS** + shadcn/ui (Radix) themed with brand tokens; logical (RTL-safe) utilities only.
- **next-intl** for i18n with `/en` and `/ar` routes; Arabic is default for `ar-*` browsers.
- **Better Auth** (phone-number OTP plugin + email OTP/magic link + admin plugin), sessions in Neon.
- **Twilio Verify** for SMS / WhatsApp OTP (handles UAE sender-ID rules and SMS-pumping fraud guard).
- **Payments: [[Stripe | Tap Payments | Telr | Network International N-Genius]]** — default Stripe
  (Checkout / Payment Element with cards, Apple Pay, Google Pay). Keep a `PaymentProvider` interface so
  another UAE gateway or Tabby/Tamara (BNPL) can be added later.
- **Resend** + React Email for transactional email; **@react-pdf/renderer** for bilingual PDF invoices
  (embed Noto Kufi Arabic / Noto Sans Arabic fonts so Arabic shapes correctly).
- **Zod** for all input validation (shared between client and server), **TanStack Query** on the client.
- **Vitest** (unit), **Playwright** (e2e in EN and AR), **ESLint + Prettier**, **Sentry** (errors).
- Cloudflare **Turnstile** (bot check) on OTP request and checkout; **Upstash Redis** rate limiting.

## 2. Environments

- `local` — your machine: `.env.local`, Neon branch `dev`, Stripe test mode, Twilio test credentials.
- `preview/staging` — every pull request gets a Vercel Preview deployment connected to a Neon
  branch created per PR (Neon ↔ Vercel integration). This doubles as the testing/backup environment.
- `production` — `main` branch on Vercel, Neon `main` branch (point-in-time restore enabled),
  Stripe live mode.
- Provide `.env.example` listing every variable with a comment; never commit secrets.
- Seed script (`pnpm db:seed`) with demo categories, breeds, sizes, cutting and packaging options.

## 3. Catalogue model (all admin-editable, bilingual)

`Category` (Sheep / غنم, Goats / ماعز; future: camels, cattle…) → `Breed` (e.g. Naeimi نعيمي,
Najdi نجدي, Harri حري, Barbari, Omani, Somali, Australian, Syrian/Awassi — exact list from admin)
→ `Size` (3–4 per breed, e.g. Small / Medium / Large / Extra-large).

- Category: name_en, name_ar, slug, image, sort order, `is_active` toggle.
- Breed: name_en/ar, description_en/ar, origin_en/ar, images (Blob), sort order, `is_active` toggle,
  optional "badge" (Best seller, Local, Imported).
- Size: label_en/ar, live weight range (kg, min–max), approximate meat yield (kg), price (AED, stored as
  integer fils), compare-at price (optional), stock quantity or "unlimited", `is_active` toggle.
- **One-tap availability toggle** (switch icon) on every breed and size in the admin list; toggling is
  instant (optimistic UI), audited, and unavailable items show "Sold out / نفدت الكمية" to customers
  instead of disappearing.
- `CuttingOption` (to be provided later — build the table and admin UI now with placeholders such as
  Whole carcass, Halves, Quarters, Medium pieces, Small pieces, Mandi cut, Kabsa cut, Minced portion):
  name_en/ar, description, extra price (default 0), `is_active`, sort order, and which categories it applies to.
- `SlaughterExtras` (optional add-ons, admin-managed): keep head, keep offal (liver/heart/kidney),
  keep tripe/stomach, keep skin, remove fat, vacuum-pack — each with price and toggle.
- `PackagingOption`: Normal bag (كيس عادي), Carton box with bag (كرتون مع كيس), Foam box with ice
  (صندوق فلين مع ثلج) — name_en/ar, description, price, image, `is_active`.
- Every price, weight and description is editable from the admin panel. Price changes never alter
  existing orders: order lines store a **snapshot** of names and prices.

## 4. Customer flow

1. Home: hero, categories, featured breeds, how-it-works (choose → cut → pack → deliver), trust
   section (halal, licensed slaughterhouse, weight guarantee), occasions (Eid al-Adha / Udhiyah,
   Aqiqah, Sadaqah, weddings, Ramadan), FAQ, WhatsApp button.
2. Category → Breed list (photo, from-price, availability) → Breed detail with size picker (weight,
   price, availability).
3. **Step-by-step order builder** (stepper, back/next, summary always visible):
   category → breed → size → cutting option → extras → packaging → quantity → occasion/notes
   (e.g. "Udhiyah on behalf of …", Aqiqah name) → add to cart.
4. Cart: edit lines, quantity, remove, promo/coupon code, price breakdown.
5. Account step: **Log in / Sign up with mobile number (OTP)** or **Continue as guest**.
   Guests give name + mobile (verified by OTP — needed for delivery calls) and an *optional* email
   with a checkbox "Email me the invoice".
6. Delivery: saved addresses for members; address form (Emirate dropdown: Abu Dhabi, Dubai, Sharjah,
   Ajman, Umm Al Quwain, Ras Al Khaimah, Fujairah; area, street/building/villa, landmark, Google Maps
   pin with "use my location"), delivery date + time slot (admin-managed slots, cut-off times,
   blackout dates, per-slot capacity), delivery fee per emirate/zone, optional free-delivery threshold.
   Option: "Pick up from shop" if enabled by admin.
7. Review & pay: full summary with **UAE VAT 5%** shown, accept terms, pay online. Cash/card on
   delivery is an admin toggle (default off).
8. Confirmation page + email + SMS/WhatsApp message with order number and invoice link.
9. Order tracking page (members and guests via order number + mobile): Received → Confirmed →
   Slaughtering → Cutting & packing → Out for delivery → Delivered (or Cancelled / Refunded).

## 5. Payments, invoices and email

- Create the order as `pending_payment` **before** redirecting to payment; confirm only from the
  verified payment webhook (signature check, idempotent), never from the browser redirect.
- Totals are always recomputed on the server from the database; never trust client prices.
- On payment success generate a **bilingual Tax Invoice PDF** matching the brand kit invoice
  template (green header bar, "INVOICE | فاتورة", gold hairlines): company legal name, address,
  **TRN** [[company TRN]], invoice number (sequential, gap-free per year), date, customer, delivery
  address, lines (breed, size, weight range, cutting, extras, packaging), subtotal, delivery,
  discount, VAT 5%, total in AED. Store it in Vercel Blob (private) and link it from the account.
- Email the invoice (attachment + secure link) to logged-in users with an email, or to guests who
  ticked "email me the invoice". Always allow downloading the PDF from the confirmation page.
- Refunds (full/partial) from the admin panel via the payment provider; credit-note PDF.

## 6. Authentication and security

- Primary login: **mobile number + one-time code** (SMS, WhatsApp fallback) via Twilio Verify.
  Phone numbers in E.164, default country +971.
- Risks of phone login and the required mitigations — implement all:
  - SMS pumping / toll fraud → Turnstile on "send code", per-number + per-IP rate limits, allow-list
    of countries (UAE + GCC by default), Twilio Fraud Guard on.
  - OTP brute force → 6-digit codes, 5-minute expiry, max 5 attempts, lockout with back-off.
  - SIM swap / number recycling → users can add a verified email as a second factor and recovery
    method; sensitive actions (change phone, view all invoices after long inactivity) re-verify.
  - Session safety → httpOnly, Secure, SameSite cookies; rotate on login; logout everywhere.
- **Admin/staff accounts never use SMS-only login**: email + password + TOTP (authenticator app) or
  passkey, role-based access (owner, manager, order-staff, content-editor), audit log of every change.
- OWASP Top 10: CSRF protection, strict CSP and security headers, input validation with Zod,
  parameterised queries (Drizzle), no secrets in client bundles, signed URLs for invoices, PII minimised,
  UAE PDPL-friendly privacy policy, cookie consent, data export/delete on request.

## 7. Admin panel (`/admin`, bilingual, mobile-friendly)

- Dashboard: today's orders, revenue, orders by status, low stock, upcoming delivery slots.
- Catalogue CRUD for categories, breeds, sizes, cutting options, extras, packaging (drag to reorder,
  image upload to Blob, EN/AR fields side by side, availability toggles).
- Orders: list/filter/search, detail, change status (sends customer notification), print packing slip
  and invoice, assign driver, refunds, internal notes.
- Customers: list, order history, block/unblock.
- Delivery: zones/emirates with fees, time slots, capacity, cut-off, holidays/blackout dates,
  Eid pre-booking window.
- Promotions: coupon codes (percent/fixed, expiry, usage limits, minimum order).
- Content: homepage banners, FAQ, terms, privacy, about — EN/AR.
- Settings: company info, TRN, VAT rate, contact numbers, WhatsApp number, payment methods on/off.
- Reports: sales by day/breed/size, CSV export.

## 8. Design and quality bar

- Follow `.claude/skills/nashamah-brand/SKILL.md` exactly (colors, fonts, no gradients/shadows,
  gold hairlines, RTL). Mobile-first; looks like a premium local brand, not a template.
- Accessibility WCAG 2.2 AA; Lighthouse ≥ 90 on performance, accessibility, best practices, SEO.
- SEO: localized metadata, `hreflang`, sitemap, Open Graph images, product structured data.
- PWA manifest + icons (from the icon-only mark) so it can be "installed" before the native app.
- Analytics: Vercel Analytics + privacy-friendly events (view breed, add to cart, checkout, purchase).

## 9. Repository, CI and the Software Factory

- Create/maintain `AGENTS.md` with: fresh-checkout setup, `pnpm dev --port <port>`, and validation
  commands (`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm e2e`).
- GitHub Actions `ci.yml` on every PR: install, lint, typecheck, unit tests, build, Playwright e2e
  (EN + AR), `drizzle-kit check`. Add **CodeQL**, **Dependabot** (npm + actions, weekly),
  **dependency-review**, Lighthouse CI on the preview URL, and a `SECURITY.md`.
- Assume branch protection on `main`: PR required, CI green required, no force push.
- Install the **Software Factory v2** by following
  https://github.com/zazencodes/zazencodes-season-3/blob/main/src/software-factory-claude-code-v2/INSTALL.md
  — fill `factory/checks.sh` with the same commands as CI, tailor the reviewer agents
  (security: auth/OTP/payments/webhooks/PII; ui: the nashamah-brand skill + RTL; ux: the order stepper,
  guest checkout, Arabic copy), add `.claude/skills/nashamah-brand` to the reviewers' reading list, and
  make the approver ESCALATE anything touching auth, payments, invoices/VAT, migrations or env vars.
- After Phase 0–1 below, create one GitHub issue per remaining phase item (labelled `factory` only
  when I confirm), small enough for one PR each.

## 10. Delivery plan

- **Phase 0** — repo scaffold, tooling, CI, AGENTS.md, brand tokens, fonts, layout shell (header,
  footer, language switch, RTL), `.env.example`, Neon + Drizzle schema + seed, Vercel deploy.
- **Phase 1** — public catalogue (categories, breeds, sizes, availability) EN/AR.
- **Phase 2** — admin panel: auth for staff, catalogue CRUD, toggles, image upload.
- **Phase 3** — order builder (cutting, extras, packaging), cart.
- **Phase 4** — customer auth (phone OTP), guest checkout, addresses, delivery slots/zones.
- **Phase 5** — payments + webhook, orders, VAT, PDF invoice, email/SMS notifications.
- **Phase 6** — order tracking, admin order management, refunds, coupons, reports.
- **Phase 7** — SEO, PWA, analytics, performance and security hardening, launch checklist.
- **Phase 8 (later)** — Expo mobile app reusing the API and translations; push notifications.

Work rules: small commits with clear messages, never commit secrets, write tests with each feature,
keep everything bilingual from day one, and stop to ask me when a decision is a business decision
(prices, policies, legal text, gateway choice). At the end of each phase, list what I must test and
what you need from me.

## Open inputs from the owner (ask if still missing)

- [[Competitor website URL to analyse]]
- [[Final list of breeds, sizes, weights, prices]]  ·  [[Cutting options and prices]]
- [[Packaging prices]]  ·  [[Delivery fees per emirate, time slots, cut-off times]]
- [[Company legal name, trade licence, TRN, address, phone, WhatsApp, email domain]]
- [[Payment gateway choice and merchant account]]  ·  [[Domain name]]

=====
