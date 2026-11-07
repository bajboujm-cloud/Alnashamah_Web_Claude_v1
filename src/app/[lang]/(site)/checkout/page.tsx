import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { signOut } from "@/app/actions/customer";
import { CheckoutForm } from "@/components/CheckoutForm";
import { Container } from "@/components/Container";
import { PhoneSignIn } from "@/components/PhoneSignIn";
import { SectionHeading } from "@/components/SectionHeading";
import { WithPhone } from "@/components/WithPhone";
import { hasLocale, pick } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { addDays, BOOKING_DAYS, dubaiToday, isBookable } from "@/lib/delivery";
import { formatDay } from "@/lib/dates";
import { formatAed } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { getCheckout, getDeliverySetup, savedAddresses } from "@/server/checkout";
import { readCustomer } from "@/server/customer/session";

export async function generateMetadata({ params }: PageProps<"/[lang]/checkout">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = await getDictionary(lang);
  return { title: t.checkout.title, robots: { index: false, follow: false } };
}

export default async function CheckoutPage({ params }: PageProps<"/[lang]/checkout">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const [t, customer, setup] = await Promise.all([getDictionary(lang), readCustomer(), getDeliverySetup()]);
  const checkout = await getCheckout(customer);
  const { cart } = checkout;
  if (!cart.lines.length || !cart.canCheckout) redirect(`/${lang}/cart`);
  const c = t.checkout;

  const zoneName = (z: { nameEn: string; nameAr: string }) => pick(lang, z.nameEn, z.nameAr);
  const describe = (a: {
    zone: { nameEn: string; nameAr: string };
    area: string;
    street: string;
    landmark: string;
  }) =>
    `${zoneName(a.zone)} — ${a.area}${lang === "ar" ? "، " : ", "}${a.street}${a.landmark ? ` · ${a.landmark}` : ""}`;
  const pickupAddress = pick(lang, setup.pickup.addressEn, setup.pickup.addressAr);

  // Dates: from today (Dubai) for BOOKING_DAYS days; default = first day the first slot is still open.
  const now = new Date();
  const today = dubaiToday(now);
  const blackouts = new Set(setup.blackouts.map((b) => b.date));
  const firstSlot = setup.slots[0];
  let firstDate = today;
  for (let i = 0; i <= BOOKING_DAYS && firstSlot; i++) {
    const d = addDays(today, i);
    if (isBookable(d, firstSlot, now, blackouts)) {
      firstDate = d;
      break;
    }
  }
  const saved = customer?.kind === "member" ? await savedAddresses(customer.id) : [];
  const current = checkout.address;

  return (
    <Container className="py-8 sm:py-12">
      <SectionHeading as="h1" title={c.title} label={c.label} />
      <div className="grid items-start gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-8">
          {!customer ? (
            <section className="border border-line bg-white p-4 sm:p-6">
              <h2 className="font-display mb-4 text-xl text-green">{c.stepWho}</h2>
              <PhoneSignIn
                lang={lang}
                t={t.signIn}
                allowGuest
                turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || undefined}
              />
            </section>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 border border-line bg-white px-4 py-3 text-sm">
                <span data-testid="signed-in-as">
                  <WithPhone
                    text={customer.kind === "member" ? c.signedInAs : c.guestAs}
                    phone={formatPhone(customer.phone)}
                  />
                </span>
                <form action={signOut}>
                  <button type="submit" className="min-h-11 text-gold-deep underline">
                    {c.signOut}
                  </button>
                </form>
              </div>
              <section className="border border-line bg-white p-4 sm:p-6">
                <CheckoutForm
                  t={c}
                  isMember={customer.kind === "member"}
                  zones={setup.zones.map((z) => ({ id: z.id, label: zoneName(z) }))}
                  slots={setup.slots.map((s) => ({ id: s.id, label: pick(lang, s.nameEn, s.nameAr) }))}
                  savedAddresses={saved.map((a) => ({ id: a.id, label: describe(a) }))}
                  pickup={{ enabled: setup.pickup.enabled, address: pickupAddress }}
                  minDate={today}
                  maxDate={addDays(today, BOOKING_DAYS)}
                  blackoutNote={
                    setup.blackouts.length
                      ? `${c.noDeliveryOn} ${setup.blackouts
                          .slice(0, 5)
                          .map((b) => formatDay(b.date, lang))
                          .join(lang === "ar" ? "، " : ", ")}`
                      : null
                  }
                  initial={{
                    name: customer.name,
                    email: customer.email ?? "",
                    emailInvoices: customer.emailInvoices,
                    fulfilment: checkout.fulfilment,
                    addressChoice: current?.isSaved ? current.id : saved[0] && !current ? saved[0].id : "new",
                    zoneId: current && !current.isSaved ? current.zoneId : "",
                    area: current && !current.isSaved ? current.area : "",
                    street: current && !current.isSaved ? current.street : "",
                    landmark: current && !current.isSaved ? current.landmark : "",
                    saveAddress: customer.kind === "member",
                    date: checkout.deliveryDate ?? firstDate,
                    slotId: checkout.slot?.id ?? firstSlot?.id ?? "",
                  }}
                />
              </section>

              {checkout.ready ? (
                <section
                  id="review"
                  className="scroll-mt-24 border border-line border-t-4 border-t-gold bg-white p-4 sm:p-6"
                  data-testid="review"
                >
                  <h2 className="font-display mb-4 text-xl text-green">{c.stepReview}</h2>
                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="text-xs font-semibold text-muted">
                        {checkout.fulfilment === "pickup" ? c.pickupAt : c.deliverTo}
                      </dt>
                      <dd data-testid="review-address">
                        {checkout.fulfilment === "pickup"
                          ? pickupAddress || c.pickupTbc
                          : current
                            ? describe(current)
                            : ""}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-muted">{c.when}</dt>
                      <dd data-testid="review-when">
                        {checkout.deliveryDate ? formatDay(checkout.deliveryDate, lang) : ""} ·{" "}
                        {checkout.slot ? pick(lang, checkout.slot.nameEn, checkout.slot.nameAr) : ""}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-muted">{c.contact}</dt>
                      <dd>
                        {customer.name} · <span dir="ltr">{formatPhone(customer.phone)}</span>
                        {customer.email ? ` · ${customer.email}` : ""}
                      </dd>
                    </div>
                  </dl>
                  <label className="mt-5 flex min-h-11 items-center gap-3 text-sm">
                    <input type="checkbox" className="h-5 w-5 accent-green" disabled />
                    {c.acceptTerms}
                  </label>
                  <button
                    type="button"
                    disabled
                    className="mt-3 min-h-12 w-full rounded-brand bg-gold px-5 font-semibold text-green-900 opacity-60"
                    data-testid="pay"
                  >
                    {c.pay}
                  </button>
                  <p className="mt-2 text-xs text-muted">{c.paySoon}</p>
                </section>
              ) : null}
            </>
          )}
        </div>

        <aside
          className="border border-line border-t-4 border-t-gold bg-white p-5 lg:sticky lg:top-4"
          data-testid="checkout-summary"
        >
          <h2 className="font-display mb-4 text-lg text-green">{t.cart.summary}</h2>
          <ul className="mb-4 space-y-2 text-sm">
            {cart.lines.map((l) => (
              <li key={l.item.id} className="flex justify-between gap-3">
                <span className="min-w-0">
                  {l.breed ? pick(lang, l.breed.nameEn, l.breed.nameAr) : ""}
                  {l.option ? ` · ${pick(lang, l.option.labelEn ?? "", l.option.labelAr ?? "")}` : ""}
                  {l.item.quantity > 1 ? ` × ${l.item.quantity}` : ""}
                </span>
                <span className="shrink-0">{formatAed(l.lineFils, lang)}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 border-t border-line pt-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">{c.items}</dt>
              <dd>{formatAed(checkout.totals.itemsFils, lang)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">{c.deliveryFee}</dt>
              <dd data-testid="summary-delivery">
                {checkout.fulfilment === "pickup"
                  ? c.pickupFree
                  : checkout.feeTbc
                    ? c.deliveryTbc
                    : formatAed(checkout.totals.deliveryFils, lang)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">
                {t.cart.vat} ({cart.vatPercent}%)
              </dt>
              <dd>{formatAed(checkout.totals.vatFils, lang)}</dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-line pt-3 text-base font-semibold text-green">
              <dt>{t.cart.total}</dt>
              <dd data-testid="checkout-total">{formatAed(checkout.totals.totalFils, lang)}</dd>
            </div>
          </dl>
          {cart.includesVat ? <p className="mt-1 text-xs text-muted">{t.cart.vatIncluded}</p> : null}
          {checkout.fulfilment === "delivery" && checkout.feeTbc ? (
            <p
              className="mt-3 rounded-brand bg-gold/10 px-3 py-2 text-xs text-charcoal"
              data-testid="fee-note"
            >
              {c.deliveryTbcNote}
            </p>
          ) : null}
          <Link href={`/${lang}/cart`} className="mt-4 inline-block text-sm text-gold-deep underline">
            {c.backToCart}
          </Link>
        </aside>
      </div>
    </Container>
  );
}
