# Al Nashamah (النشامى) — Livestock Trading · alnashamah.ae

Bilingual (Arabic / English) web store for ordering sheep and goats in the UAE — cattle and camels later,
plus seasonal Eid Al-Adha / Qurban — to be extended into a mobile app.

**Status:** Phase 0 (foundation) and Phase 1 (public catalogue) are built. See `docs/MASTER_PROMPT.md` §11.

## Run it on your laptop

Requires Node.js 22+, Docker Desktop. Full beginner steps (Windows): `docs/SETUP_GUIDE.md` §4.

```bash
corepack enable
pnpm install
cp .env.example .env.local   # Windows: copy .env.example .env.local
pnpm db:setup                # database + starting catalogue
pnpm dev                     # http://localhost:3000
```

## Documents

| File                                     | What it is                                                     |
| ---------------------------------------- | -------------------------------------------------------------- |
| `docs/MASTER_PROMPT.md`                  | The full product spec Claude builds from (kept up to date)     |
| `docs/SETUP_GUIDE.md`                    | What to install, free accounts, how everything connects        |
| `docs/COMPETITOR_ANALYSIS.md`            | Review of zabehaty.com and what we do better                   |
| `AGENTS.md`                              | Technical guide: commands, project map, rules                  |
| `.claude/skills/nashamah-brand/SKILL.md` | Brand rules (colours, fonts, RTL, logo) used for every UI task |
| `docs/brand/`                            | Brand kit PDF and original logo                                |
