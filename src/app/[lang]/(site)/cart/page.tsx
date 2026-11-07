import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BreedPhoto } from "@/components/BreedPhoto";
import { CartQuantity } from "@/components/CartQuantity";
import { Container } from "@/components/Container";
import { SectionHeading } from "@/components/SectionHeading";
import { hasLocale, pick } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { formatAed, formatAge, formatWeight } from "@/lib/format";
import { getCart } from "@/server/cart";

export const metadata: Metadata = { robots: { index: false } };

export default async function CartPage({ params }: PageProps<"/[lang]/cart">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const [t, cart] = await Promise.all([getDictionary(lang), getCart()]);
  const c = t.cart;

  if (!cart.lines.length) {
    return (
      <Container className="py-16 text-center">
        <SectionHeading as="h1" title={c.title} />
        <p className="text-muted">{c.empty}</p>
        <Link
          href={`/${lang}#categories`}
          className="mt-6 inline-block rounded-brand bg-green px-6 py-3 font-semibold text-ivory"
        >
          {c.emptyCta}
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-10">
      <SectionHeading as="h1" title={c.title} />
      <div className="grid items-start gap-8 lg:grid-cols-[1fr_22rem]">
        <ul className="space-y-3">
          {cart.lines.map((l) => {
            const breedName = l.breed ? pick(lang, l.breed.nameEn, l.breed.nameAr) : "—";
            const o = l.option;
            const details = [
              o
                ? `${c.size}: ${pick(lang, o.labelEn, o.labelAr) ?? ""} · ${formatAge(o.ageMinMonths, o.ageMaxMonths, lang) ?? ""} · ${formatWeight(o.weightMinKg, o.weightMaxKg, lang) ?? ""}`
                : null,
              l.cutting ? `${c.cutting}: ${pick(lang, l.cutting.nameEn, l.cutting.nameAr)}` : null,
              l.extras.length
                ? `${c.includes}: ${l.extras.map((e) => pick(lang, e.nameEn, e.nameAr)).join("، ")}`
                : null,
              l.packaging ? `${c.packaging}: ${pick(lang, l.packaging.nameEn, l.packaging.nameAr)}` : null,
              l.item.occasion !== "none"
                ? `${c.occasion}: ${t.order.occasions[l.item.occasion]}${l.item.onBehalfOf ? ` — ${c.onBehalfOf} ${l.item.onBehalfOf}` : ""}`
                : null,
              l.item.notes ? `${c.notes}: ${l.item.notes}` : null,
            ].filter(Boolean);
            return (
              <li
                key={l.item.id}
                className={`flex gap-3 border bg-white p-3 ${l.problem ? "border-danger/50" : "border-line"}`}
                data-testid="cart-line"
                data-problem={l.problem ?? undefined}
              >
                <div className="w-24 shrink-0 sm:w-32">
                  <BreedPhoto
                    src={l.breed?.photoUrl ?? null}
                    alt={breedName}
                    placeholderLabel=""
                    sizes="128px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-display text-lg text-green">{breedName}</p>
                    <p className="font-semibold text-green" data-testid="cart-line-total">
                      {l.problem ? "—" : formatAed(l.lineFils, lang)}
                    </p>
                  </div>
                  <ul className="mt-1 space-y-0.5 text-xs text-muted">
                    {details.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                  {!l.problem && l.item.quantity > 1 ? (
                    <p className="mt-1 text-xs text-muted">
                      {formatAed(l.unitFils, lang)} {c.each}
                    </p>
                  ) : null}
                  {l.problem ? (
                    <p className="mt-1 text-sm font-semibold text-danger" role="alert">
                      {l.problem === "tooYoung" ? c.tooYoungLine : c.unavailableLine}
                    </p>
                  ) : null}
                  <div className="mt-2">
                    <CartQuantity
                      itemId={l.item.id}
                      quantity={l.item.quantity}
                      labels={{ decrease: c.decrease, increase: c.increase, remove: c.remove }}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <aside className="border border-line border-t-4 border-t-gold bg-white p-5 lg:sticky lg:top-4">
          <h2 className="font-display mb-4 text-lg text-green">{c.summary}</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">{c.subtotal}</dt>
              <dd>{formatAed(cart.totals.subtotalFils, lang)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">
                {c.vat} ({cart.vatPercent}%)
              </dt>
              <dd>{formatAed(cart.totals.vatFils, lang)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">{c.delivery}</dt>
              <dd className="text-muted">{c.deliveryTbc}</dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-line pt-3 text-base font-semibold text-green">
              <dt>{c.total}</dt>
              <dd data-testid="cart-total">{formatAed(cart.totals.totalFils, lang)}</dd>
            </div>
          </dl>
          {cart.includesVat ? <p className="mt-1 text-xs text-muted">{c.vatIncluded}</p> : null}
          {!cart.canCheckout ? <p className="mt-4 text-sm text-danger">{c.fixLines}</p> : null}
          <button
            type="button"
            disabled
            className="mt-4 w-full rounded-brand bg-green px-5 py-3 font-semibold text-ivory opacity-60"
          >
            {c.checkout}
          </button>
          <p className="mt-2 text-xs text-muted">{c.checkoutSoon}</p>
          <Link href={`/${lang}#categories`} className="mt-4 inline-block text-sm text-gold-deep underline">
            {c.continueShopping}
          </Link>
        </aside>
      </div>
    </Container>
  );
}
