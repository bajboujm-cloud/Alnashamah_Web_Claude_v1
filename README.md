# Al Nashamah (النشامى) — Livestock Trading Web App · alnashamah.ae

Bilingual (English / Arabic) web app for ordering sheep and goats in the UAE (cattle and camels later,
plus seasonal Eid Al-Adha / Qurban), to be extended into a mobile app.

| File | What it is |
|---|---|
| `docs/MASTER_PROMPT.md` | Ready-made prompt to paste into Claude Code to build the app |
| `docs/SETUP_GUIDE.md` | What to install, which accounts you need (none paid for now), how it connects |
| `docs/COMPETITOR_ANALYSIS.md` | Review of zabehaty.com and what we do better |
| `.claude/skills/nashamah-brand/SKILL.md` | Brand/taste skill (colors, fonts, RTL, logo rules) used by Claude |
| `docs/brand/` | Brand kit PDF and transparent logo |

Stack: Next.js + React + TypeScript · PostgreSQL (Docker locally → Neon later) · local storage → Vercel Blob ·
mock payments → payment gateway · console OTP → Twilio · Mailpit → Resend. Testing runs on the owner's laptop only.
