---
name: nashamah-brand
description: Al Nashamah (النشامى) brand and UI taste guide. Load before building or reviewing any page, component, email, PDF invoice or app screen for the Al Nashamah livestock store.
---

# Al Nashamah — brand & taste skill

Source of truth: `docs/brand/brand-kit.pdf` (21 pages) and `docs/brand/logo-horizontal.png`.
Brand promise: **"أصالة السوق المحلي، بمعايير تجارة عصرية"** — *A trusted, modern identity for livestock trading in the UAE.*
Values: Trust (الثقة) · Heritage (الأصالة) · Quality (الجودة) · Accessibility (القرب).
The identity draws on sheep/halal trading, **not** generic farm imagery. No cartoon farm clip-art.

## Colors (official, flat — no gradients)

| Token | Name | Hex | Use |
|---|---|---|---|
| `--brand-green` | Royal Green / الأخضر الملكي | `#0F3D32` | primary surfaces, headers, primary buttons, headings |
| `--brand-gold` | Aged Gold / الذهبي المعتّق | `#C9A86B` | thin rules, accents, highlights, active states, prices |
| `--brand-ivory` | Warm Ivory / العاجي الدافئ | `#F5EFE6` | page background, cards on green |
| `--brand-charcoal` | Charcoal / الفحمي | `#1E2A24` | body text, footer, monochrome |
| `--brand-gold-deep` | (logo roof accent) | `#B5852F` | logo only / small icon accents |

Ratio: **70% green + ivory · 20% charcoal · 10% gold** (gold for details only).
Contrast: gold on ivory fails WCAG for body text — use gold only for large text, rules and decoration; body text is charcoal or green.
Errors may use a muted terracotta (`#A4553A`, as on the "don't" crosses in the kit); success uses brand green.

## Typography

- Arabic display / headings: **Noto Kufi Arabic** Bold.
- Arabic body: **Noto Sans Arabic** Regular.
- English display (wordmark-style, "AL NASHAMAH"): serif display — **Georgia** or a close web serif (e.g. *Libre Caslon* / *Noto Serif*), letter-spaced, uppercase.
- English UI/body: clean sans (e.g. **Inter** / *Noto Sans*), small caps labels with wide tracking (e.g. `BRAND ESSENCE / POSITIONING`).
- Section label pattern from the kit: Arabic title bold green, under it a tiny tracked uppercase English label in grey-green, then a thin gold hairline rule.

## Layout & graphic language

- Ivory backgrounds with full-bleed Royal Green bands (hero, header, footer, invoice header bar).
- A thin vertical gold bar on the leading edge of key panels (as on every kit page).
- Thin gold hairline dividers (1px), never thick borders, **no drop shadows**, no heavy outlines (kit rule).
- Pattern: diagonal gold strokes + short green dashes (from the logo's roof line) — only as a subtle background texture.
- Cards: white or green squares, gold short rule at top, generous padding, square or very small radius (≤ 6px).
- Logo: never redraw, stretch, recolor, add shadow, or make tiny; keep clear space = height of "X" around it; keep the final «ى» of النشامى legible. Use reverse (ivory) logo on green, color logo on white/ivory. Icon-only mark for favicon / app icon.

## Bilingual / RTL rules

- Arabic is a first-class language: `dir="rtl"` on `<html>` for `ar`, logical CSS properties (`margin-inline-start`, `ps-*`/`pe-*`), mirrored icons/arrows, never hardcode left/right.
- Arabic text slightly larger line-height (1.7–1.9). Numbers: show Western digits by default (UAE norm), prices as `AED 1,250` / `1,250 د.إ`.
- Every customer-facing string comes from the translation files — no hardcoded copy.

## Voice

Confident, warm, local, trustworthy. Short sentences. Arabic copy should read like a respected local trader, not a machine translation. Mention halal, freshness, weight transparency and on-time delivery.

## Review checklist (UI reviewer must check)

1. Only brand colors (tokens), no gradients, no shadows, no thick borders.
2. Correct fonts per language; Arabic layout fully mirrored.
3. Gold used sparingly and never for small body text.
4. Logo usage follows the rules above.
5. Works at 360px phone width; touch targets ≥ 44px.
6. WCAG AA contrast for all text.
