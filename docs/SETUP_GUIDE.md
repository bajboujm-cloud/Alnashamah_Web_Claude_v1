# Al Nashamah — Beginner Setup Guide

You don't need to understand the code — Claude Code writes it. This guide tells you what to install,
which (free) accounts you need now, and what gets added later when you go live.

## 1. The big picture

**Now (planning, design, building) — everything runs on your laptop, costs nothing:**

```
 Your laptop                                               GitHub (free, private repo)
 ┌──────────────────────────────────────────────┐  push   ┌───────────────────────────┐
 │ Claude Code ──writes──► code in this folder  │ ──────► │ stores the code + history │
 │                                              │ ◄────── │ runs automatic checks:    │
 │ pnpm dev  → website at http://localhost:3000 │  pull   │ tests, security, updates  │
 │ Docker    → database (PostgreSQL)            │         └───────────────────────────┘
 │           → test email inbox (Mailpit :8025) │
 │ fake payment page, OTP codes shown on screen │
 └──────────────────────────────────────────────┘
```

**Later (go-live, after the trade licence)** — the same code is switched to online services just by
adding keys: Vercel (hosting on alnashamah.ae), Neon (online database), Vercel Blob (photos/invoices),
payment gateway, Twilio (SMS codes), Resend (email). Nothing has to be rewritten.

| Environment      | When    | Where                                                    |
| ---------------- | ------- | -------------------------------------------------------- |
| Local / testing  | **now** | your laptop only                                         |
| Production       | later   | Vercel + Neon on alnashamah.ae                           |
| Staging / backup | later   | Vercel preview per change + Neon database copy & backups |

## 2. Install on your laptop (all free)

1. **Git** — https://git-scm.com/downloads
2. **Node.js LTS (22+)** — https://nodejs.org, then in a terminal: `corepack enable` (gives you `pnpm`)
3. **Docker Desktop** — https://www.docker.com/products/docker-desktop (free for small businesses
   under 250 staff and USD 10m revenue). Runs the local database and test email inbox.
4. **VS Code** — https://code.visualstudio.com (optional extensions: ESLint, Prettier,
   Tailwind CSS IntelliSense, Claude Code)
5. **Claude Code** — https://code.claude.com/docs (native installer), sign in with your Claude account.
6. **GitHub CLI** — https://cli.github.com, then `gh auth login` (needed by the Software Factory).
7. **Python 3.10+** — needed by the Software Factory scripts (macOS/Linux usually have it; Windows:
   https://www.python.org). On Windows, using **WSL2** (Ubuntu) is recommended for all of the above.

## 3. Accounts

| Now                                                             | Cost               |
| --------------------------------------------------------------- | ------------------ |
| **Claude** (Pro works; Max gives more build time)               | your existing plan |
| **GitHub** — the repo `bajboujm-cloud/Alnashamah_Web_Claude_v1` | free               |

Nothing else is needed now. The app uses free local stand-ins: the OTP code is printed on screen,
emails land in the local Mailpit inbox, and payments go through a fake "Pay / Fail" page.

| Later, at go-live (not now)                                      | Notes                                                   |
| ---------------------------------------------------------------- | ------------------------------------------------------- |
| Vercel Pro                                                       | required for a commercial site (~USD 20/month)          |
| Neon                                                             | free tier may be enough at first; paid plan for backups |
| Payment gateway (Stripe UAE, Tap, Telr, N-Genius) + Tabby/Tamara | needs trade licence, Emirates ID, IBAN, TRN             |
| Twilio Verify                                                    | pay per SMS code; UAE sender ID registration            |
| Resend                                                           | free up to 3,000 emails/month                           |
| Cloudflare Turnstile, Upstash, Sentry                            | free tiers                                              |
| alnashamah.ae DNS                                                | you own it already — point it to Vercel at go-live      |

## 4. First run on your laptop (Windows)

Phases 0–1 are already built and on GitHub; you don't need to paste any prompt.

1. Install the three programs (once):
   - **Node.js 22 LTS** — https://nodejs.org → "Windows Installer (.msi)" → Next, Next, Finish.
   - **Git** — https://git-scm.com/download/win (if not installed already).
   - **Docker Desktop** — https://www.docker.com/products/docker-desktop → install, restart the laptop
     if asked, then open Docker Desktop and wait until it says _Engine running_.
2. **Close PowerShell and open a new one** (normal, not "as Administrator") so it sees Node.js. Check:
   ```powershell
   node -v          # should print v22.x
   ```
3. Run, one line at a time:
   ```powershell
   Set-ExecutionPolicy -Scope CurrentUser RemoteSigned   # answer Y — lets pnpm run in PowerShell
   npm install -g pnpm@10
   cd $HOME
   mkdir Projects; cd Projects
   git clone https://github.com/bajboujm-cloud/Alnashamah_Web_Claude_v1.git
   cd Alnashamah_Web_Claude_v1
   git checkout ccr-74fd4369-jq71o5      # until this work is merged into main
   pnpm install
   copy .env.example .env.local
   pnpm db:setup                          # database in Docker + starting catalogue
   pnpm dev
   ```
   Keep the project in your user folder (e.g. `C:\Users\<you>\Projects`), never in `C:\Windows\System32`.
4. Open in your browser:
   - http://localhost:3000/ar — the store in Arabic
   - http://localhost:3000/en — the store in English
   - http://localhost:8025 — test email inbox (used from Phase 5)
5. To stop: press `Ctrl + C` in PowerShell. Next time only `pnpm dev` is needed (with Docker Desktop open).
6. To get new updates later (Docker Desktop open): `git pull`, then `pnpm install`, `pnpm db:migrate` and `pnpm db:seed`.

### The admin panel (edit prices, photos, descriptions, stock)

1. **Create your owner account once** (Docker Desktop open, in the project folder):
   ```powershell
   pnpm admin:create --email you@alnashamah.ae --name "Mohammad"
   ```
   It prints a **temporary password** — copy it.
2. Install **Google Authenticator** or **Microsoft Authenticator** on your phone (free).
3. Run `pnpm dev` and open **http://localhost:3000/ar/admin** (or `/en/admin`).
4. Sign in with your email and the temporary password. The first time, a **QR code** appears: in the
   authenticator app tap **+ → Scan QR code**, then type the 6-digit code it shows.
   Every later sign-in asks for the current 6-digit code from the app.
5. Go to **My account** and change the temporary password.

What you can do there:

| Screen                                       | What for                                                                                                                                                                                                               |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Breeds & stock                               | One-tap switches to put a breed or a size in / out of stock; **Edit** a breed for its photo, names, descriptions and its sizes (age, weight after slaughter, price in AED), add a 4th / 5th size, add or delete breeds |
| Categories                                   | Names, illustration, status (Active / Coming soon / Hidden), add new categories                                                                                                                                        |
| Seasonal                                     | Eid Al-Adha / Qurban: show on website on/off, dates, illustration, which breeds are included                                                                                                                           |
| Cutting options · Order includes · Packaging | Names, prices, photos, on/off                                                                                                                                                                                          |
| Business settings                            | Company name, TRN, licence, address, phones, WhatsApp, VAT                                                                                                                                                             |
| Staff                                        | Add staff with a role (Owner, Manager, Order staff, Content editor); reset a password; disable                                                                                                                         |
| Activity log                                 | Who changed what and when                                                                                                                                                                                              |

Forgot your password or lost your phone? Run
`pnpm admin:create --email you@alnashamah.ae --reset` — it prints a new temporary password and you scan a new QR code.

## 5. GitHub settings (free, one time)

On github.com → your repo → **Settings**:

- **Branches → Add rule for `main`**: require a pull request, require status checks to pass,
  block force pushes.
- **Code security**: turn on **Dependabot alerts** and **Dependabot security updates** (free).
  (CodeQL and secret push-protection are paid for private repos, so the project uses free tools instead —
  gitleaks for leaked passwords/keys and Semgrep for security bugs — run by GitHub Actions.)
- **Actions → General**: allow GitHub Actions (private repos get 2,000 free minutes/month).

## 6. Daily workflow

1. `git pull`, open Docker Desktop, `claude` in the project folder.
2. Ask for a change, or let the Software Factory do it: create a GitHub issue describing the feature,
   add the label `factory`, then in Claude Code run `/factory run`. It writes a spec, builds, runs the
   checks, gets code/security/UI/UX reviews, and merges small safe changes. Anything risky (login,
   payments, invoices, database changes) comes back to you labelled `factory:needs-human`.
3. Test on http://localhost:3000. Happy → merge the pull request on GitHub.

## 7. Mobile-number login — is it safe?

Yes, it's the normal choice in the UAE, with these protections built in:

| Risk                                                  | Protection                                                        |
| ----------------------------------------------------- | ----------------------------------------------------------------- |
| Bots triggering thousands of paid SMS ("SMS pumping") | bot check, rate limits, UAE/GCC-only numbers, Twilio fraud guard  |
| Guessing the code                                     | 6 digits, 5-minute expiry, 5 tries, then temporary lock           |
| SIM swap / old numbers given to someone else          | optional verified email as backup; re-check before changing phone |
| SMS not arriving                                      | WhatsApp or email code fallback                                   |

Admin/staff use **email + password + authenticator app** instead, because they control prices and orders.

## 8. What to prepare (no rush)

- [ ] Age / weight / price for each option of each breed
- [ ] One good photo per breed (Naeemi, Najdi, Herri, Somali, Local sheep; Local, Somali, Kashmiri goats)
- [ ] Final cutting options (+ photos if possible)
- [ ] Delivery fees per emirate and time slots
- [ ] Company legal name, licence no., TRN, address, phones, WhatsApp, email @alnashamah.ae
- [ ] Refund / cancellation policy and Eid Al-Adha booking rules
- [ ] Payment gateway choice once the trade licence is issued
