# Al Nashamah — Beginner Setup Guide

This guide covers what to install, what to subscribe to, and how the pieces connect. You don't need
to understand the code. Claude Code writes it, and your job is to create the accounts and paste in keys.

## 1. The big picture

```
 Your computer (local)            GitHub (code + checks)            Vercel (hosting)
 ┌──────────────────┐  git push   ┌────────────────────┐  auto      ┌─────────────────────┐
 │ VS Code          │ ──────────► │ Repository         │ ─deploy──► │ Preview (each PR)   │
 │ Claude Code      │             │ Actions: CI, CodeQL│            │ Production (main)   │
 │ Node.js / pnpm   │ ◄────────── │ Dependabot, secrets│            └─────────┬───────────┘
 └──────────────────┘  git pull   └────────────────────┘                      │ uses
                                                                              ▼
          Neon (database)   Vercel Blob (images, PDFs)   Stripe (payments)   Twilio (SMS OTP)
          Resend (email)    Cloudflare Turnstile (bot check)   Upstash (rate limit)   Sentry (errors)
```

- **Local**: you run the site on your computer at `http://localhost:3000` for testing.
- **GitHub**: stores the code. Every change goes into a pull request (PR), and GitHub runs the
  automatic checks on it: tests, security scanning and dependency updates.
- **Vercel**: hosts the site. Each PR gets a private preview link, and merging into `main` publishes
  to production.
- **Your three environments**:

| Environment | Where | Database | Payments |
|---|---|---|---|
| Local (testing) | your computer | Neon branch `dev` | Stripe test mode |
| Preview / staging (backup) | Vercel Preview, one per PR | Neon branch per PR (automatic) | Stripe test mode |
| Production | Vercel Production (`main`) | Neon `main` + point-in-time restore | Stripe live mode |

  A Neon "branch" is an instant copy of the database, so testing never touches real customer data.
  Neon's point-in-time restore is your database backup. Turn it on in the paid plan.

## 2. Install on your computer (one time)

1. **Git**: https://git-scm.com/downloads
2. **Node.js LTS** (version 22 or newer): https://nodejs.org. Then open a terminal and run `corepack enable` so that `pnpm` is available.
3. **VS Code**: https://code.visualstudio.com. Optionally add the extensions *ESLint*, *Prettier*,
   *Tailwind CSS IntelliSense* and *Claude Code*.
4. **Claude Code**: follow https://code.claude.com/docs (native installer). Log in with your Claude account.
   You can also work from the browser at https://claude.ai/code, which needs no install.
5. **GitHub CLI** (`gh`): https://cli.github.com. Then run `gh auth login`. The Software Factory needs it.
6. **Vercel CLI** (optional): `npm i -g vercel`, then `vercel login`, then `vercel link`. After that, `vercel env pull .env.local`
   copies all your keys to your computer automatically.
7. **Python 3.10+**: needed by the Software Factory scripts. macOS and Linux usually have it already.

## 3. Accounts to create

| Service | Why | Plan to start | Approx. cost |
|---|---|---|---|
| **Claude** (Pro or Max) | Claude Code writes the app | Max is recommended for long build sessions | Pro ~$20/mo, Max from ~$100/mo |
| **GitHub** | code, CI, security scanning | Free (private repos included) | $0 |
| **Vercel** | hosting | Hobby to test. **Pro is required for a commercial store** | Pro ~$20/user/mo |
| **Neon** | Postgres database | Free to build. Launch plan for backups | $0 → ~$19/mo |
| **Vercel Blob** | images + invoices | included in Vercel, usage-based | small |
| **Stripe** (UAE) | online payments, Apple Pay/Google Pay | needs a UAE trade licence | ~2.9% + AED 1 per card payment |
| **Twilio** | SMS/WhatsApp OTP (Verify) | pay as you go | per verification; UAE SMS is relatively expensive |
| **Resend** | sending invoice emails | Free up to 3,000/mo | $0 → $20/mo |
| **Cloudflare** | Turnstile bot check (and DNS if you like) | Free | $0 |
| **Upstash** | rate limiting (Redis) | Free tier | $0 |
| **Sentry** | error alerts | Free developer plan | $0 |
| **Domain** | e.g. `alnashamah.ae` (.ae from an accredited registrar) or `.com` | yearly | ~$15–60/yr |

Stripe alternatives used in the UAE include Tap Payments, Telr, Network International (N-Genius) and
Checkout.com. The app is built so the gateway can be swapped. **Tabby / Tamara** (pay in 4) can be
added later, and they increase conversion for higher-priced orders like Eid sheep.

Have these business documents ready, because the payment gateway and SMS sender ID need them:
trade licence, Emirates ID of the owner, bank account (IBAN), **TRN** (VAT registration), the
website's terms and privacy pages (Claude drafts them), and a company email on your domain.

## 4. How to connect everything (step by step)

1. **GitHub**: the repo `bajboujm-cloud/Alnashamah_Web_Claude_v1` already exists. In *Settings*, do these:
   - *Branches → Add rule for `main`*: require pull request, require status checks, block force pushes.
   - *Code security*: enable **Dependabot alerts + security updates**, **Secret scanning** with
     **Push protection**, and **Code scanning (CodeQL)**.
   - *Actions → General*: allow GitHub Actions.
2. **Vercel**: *Add New → Project → Import Git Repository*, then pick the repo. The framework is detected as Next.js.
3. **Neon**: in Vercel, open *Storage / Marketplace → Neon → Connect to project*. This creates the database
   and sets `DATABASE_URL` for you. Turn on **"Create a database branch for each preview deployment"**.
4. **Blob**: in Vercel, open *Storage → Create → Blob → Connect to project*. This sets `BLOB_READ_WRITE_TOKEN`.
5. **Stripe**: in *Developers → API keys*, copy the test keys. Add a webhook endpoint
   `https://<your-domain>/api/webhooks/stripe` and copy its signing secret. Turn on Apple Pay/Google Pay.
6. **Twilio**: create a **Verify Service**, turn on *Fraud Guard*, and restrict *Geo permissions* to UAE (+GCC).
   Copy the Account SID, Auth Token and Verify Service SID. For WhatsApp OTP, connect a WhatsApp sender.
7. **Resend**: add your domain, then add the DNS records it shows (SPF/DKIM) at your domain registrar,
   and create an API key.
8. **Cloudflare Turnstile**: add your site to get a site key and secret key. **Upstash**: create a Redis database
   and copy the REST URL and token. **Sentry**: create a Next.js project and copy the DSN.
9. **Put the keys in Vercel**: go to *Project → Settings → Environment Variables*. Add each key, using test keys for
   *Preview + Development* and live keys for *Production*. Then on your computer run
   `vercel env pull .env.local`. **Never paste keys into chat, issues, or committed files.**
10. **Domain**: in Vercel, open *Project → Domains → Add* and follow the DNS instructions.

## 5. Daily workflow

1. Open the project folder in VS Code and start `claude` in the terminal. On the web, open claude.ai/code.
2. The first time, paste the prompt from `docs/MASTER_PROMPT.md`. Claude builds Phase 0–1 and tells
   you what to test.
3. Run locally with `pnpm install`, then `pnpm dev`, then open http://localhost:3000 (and `/ar` for Arabic).
4. Claude opens a pull request. GitHub runs the checks, and Vercel posts a **preview link**. Test there.
5. When you're happy, click **Merge**. Vercel deploys to production automatically.
6. For later features, create a GitHub issue describing the feature, add the label `factory`, and in
   Claude Code run `/factory run`. The Software Factory then runs its stages:
   - intake: accept / ask / reject
   - spec
   - build
   - checks
   - reviewers: code, security, UI, UX
   - approver

   It merges small safe changes. Anything risky (payments, login, invoices, database changes) is
   handed back to you as `factory:needs-human` for your decision.

## 6. About login with a mobile number

Mobile login is common in the UAE and is a good choice here. Its known risks and the protections
built into the plan:

| Risk | Protection |
|---|---|
| **SMS pumping fraud**: bots trigger thousands of paid SMS | Cloudflare Turnstile, rate limits, country allow-list, Twilio Fraud Guard |
| **Code guessing** | 6-digit code, 5-minute expiry, max 5 tries, temporary lock |
| **SIM swap / recycled numbers** | optional verified email as backup factor; re-verify for sensitive changes |
| **SMS delivery issues** | WhatsApp OTP fallback, email code fallback |

**Admin and staff accounts** use email, password and an authenticator app (or a passkey), never SMS
alone, because they control prices and orders.

## 7. What you need to send to Claude / prepare

- [ ] The **competitor website URL**, so it can be analysed and compared
- [ ] Breed list per category, with photos (good, real photos sell livestock)
- [ ] Sizes per breed: live weight range, price
- [ ] Cutting options + prices, extras (head, offal, skin…), packaging prices
- [ ] Delivery fees per emirate, delivery days/time slots, order cut-off time
- [ ] Company legal name, licence no., TRN, address, phone, WhatsApp, email
- [ ] Refund/cancellation policy, Eid pre-booking rules
- [ ] Chosen payment gateway + merchant account approval
- [ ] Domain name
- [ ] Logo files in vector/PNG (transparent): full, horizontal, icon-only, reverse (ivory)
