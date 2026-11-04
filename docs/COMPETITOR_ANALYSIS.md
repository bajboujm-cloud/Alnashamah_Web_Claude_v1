# Competitor analysis — zabehaty.com (ذبيحتي)

Reviewed 2026-11-04 by rendering the live site in a headless browser (the site is a JavaScript-only app,
so a plain fetch shows nothing). Screenshot of a product page: `docs/competitor/zabehaty-product-page.jpg`.
Not seen: login/sign-up, cart, checkout and payment screens (these need an account and an address).

## What they are

A **marketplace**, not a single trader. Alongside livestock (الذبائح) it sells butcher-shop meat from ~20
different butchers, poultry, fish, vegetables & fruit, spices, organic goods, "productive families"
products, gift wrapping, plus **donations** to UAE charities (Sharjah Charity, Dubai Charity, Emirates
Food Bank, Beit Al Khair, Dar Al Ber, IACAD…) and an **Aqiqah & Nudhur** section.
Operator: *Zabehaty Fresh Trading – Sole Proprietorship LLC*. iOS + Android apps.

## Livestock section

- Tabs per species: **Sheep (خروف) · Goat (تيس) · Cattle (أبقار) · Camel (جمل)**, then breed chips
  (sheep: Naeemi, Najdi, Somali, Kashmiri/Indian).
- One product per species+breed. Prices seen (AED): Somali sheep 735 (was 750), Kashmiri sheep 780
  (was 800), Naeemi 1,143, Najdi 1,143, Omani goat 750, Somali goat 735, Kashmiri goat 770,
  Local goat 774 (was 860), cow 4,550, calf 4,050, camel 4,600–6,600. Many "offer" bundles
  (e.g. Naeemi sheep + chicken carton).

## Product page (order builder) — same idea as ours

1. **Available weight** (الوزن المتاح): radio list, each row = weight + age + price,
   e.g. *10–13 kg · 12–15 months · AED 735*; *9–11 kg · 3–6 months · AED 780*.
   → Confirms your "age + weight range + price" model.
2. **Cutting** (طريقة التقطيع), 10 options, each with a **photo and a video icon**: Arabic cut 8 pieces,
   Arabic cut 4 pieces, Arabic half lengthwise, Fridge cut (medium pieces), Whole (Ghouzi),
   Saloona (small pieces), Biryani (large pieces), Hadrami joints, Awlaqi joints, Mufattah.
3. **Packaging** (طريقة التغليف): Eco-friendly carton without ice (free), Foam box with ice (AED 20).
4. **Order includes** (يشمل الطلب على): Head, Intestines (المصران), Tripe (الكرش) — checkboxes,
   ticked by default.
5. **Special instructions** free-text box, quantity stepper, price, Add to cart.
6. **Tamara** ("4 payments of 184") and **Tabby** BNPL banners on every product.

## Other features

- Delivery **address picker in the header** ("اختر العنوان") — address first, so zone/fees are known.
- Language chooser pop-up (Arabic/English).
- **Wallet**, notifications, offers page, articles/blog, "register as a store", FAQ, terms, privacy.
- Social: Facebook, Instagram, X, Snapchat, WhatsApp.

## Weaknesses we can beat

| Their weakness | Al Nashamah answer |
|---|---|
| Cluttered marketplace (vegetables, spices, 20 butchers) — livestock is one tab among many | Focused, premium livestock brand; 3 clicks from home to cart |
| JavaScript-only pages — search engines and slow phones see an empty page ("Zabehaty") | Server-rendered bilingual pages, good Google ranking for "خروف نعيمي دبي" etc. |
| Language pop-up blocks every first visit | Auto-detect language, one-tap switch in header |
| Sold-out products simply vanish; no stock status | Clear **Out of stock / نفدت الكمية** label with one-tap toggle |
| Generic product photos; no breed explanation | Real photo + short story per breed (origin, taste, best for) |
| Visible bugs (wallet "0 undefined"), footer email on another company's domain, © 2024 | Polished, consistent, tested in both languages |
| No visible halal/slaughterhouse/weight guarantee | Trust strip: licensed slaughterhouse, halal, weight guarantee, vet-checked |

## What we copy (good ideas) — now in the master prompt

Age+weight+price rows · cutting options with photos (and optional video) · head / intestines / tripe
checkboxes · special-instructions box · address-first delivery zone · Tabby/Tamara (later) · Eid &
Aqiqah sections · iOS/Android app (phase 8) · WhatsApp button.

## Later ideas (not in v1)

Wallet/credit & loyalty points · charity donation of a sacrifice through licensed UAE charities ·
bundles/offers (sheep + extras) · blog/articles for SEO · push notifications in the app.
