import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { deleteAddress, signOutTo } from "@/app/actions/customer";
import { AccountProfile } from "@/components/AccountProfile";
import { Container } from "@/components/Container";
import { SectionHeading } from "@/components/SectionHeading";
import { hasLocale, pick } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { formatPhone } from "@/lib/phone";
import { savedAddresses } from "@/server/checkout";
import { readCustomer } from "@/server/customer/session";

export async function generateMetadata({ params }: PageProps<"/[lang]/account">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = await getDictionary(lang);
  return { title: t.account.title, robots: { index: false, follow: false } };
}

/** Member account: details, saved addresses, sign out (here or everywhere). */
export default async function AccountPage({ params }: PageProps<"/[lang]/account">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const me = await readCustomer();
  if (!me || me.kind !== "member") redirect(`/${lang}/account/login`);
  const [t, addresses] = await Promise.all([getDictionary(lang), savedAddresses(me.id)]);
  const a = t.account;
  const box = "border border-line bg-white p-4 sm:p-6";

  return (
    <Container className="max-w-3xl py-8 sm:py-12">
      <SectionHeading as="h1" title={a.title} />
      <div className="space-y-6">
        <section className={box}>
          <h2 className="font-display mb-1 text-xl text-green">{a.details}</h2>
          <p className="mb-4 text-sm text-muted">
            {a.phone}:{" "}
            <span dir="ltr" data-testid="account-phone">
              {formatPhone(me.phone)}
            </span>
          </p>
          <AccountProfile
            t={a}
            tc={t.checkout}
            initial={{ name: me.name, email: me.email ?? "", emailInvoices: me.emailInvoices }}
          />
        </section>

        <section className={box} data-testid="account-addresses">
          <h2 className="font-display mb-4 text-xl text-green">{a.addresses}</h2>
          {addresses.length ? (
            <ul className="space-y-2">
              {addresses.map((ad) => (
                <li
                  key={ad.id}
                  className="flex items-center justify-between gap-3 border border-line p-3 text-sm"
                  data-testid="saved-address"
                >
                  <span className="min-w-0">
                    <span className="font-semibold">{pick(lang, ad.zone.nameEn, ad.zone.nameAr)}</span> —{" "}
                    {ad.area}
                    {lang === "ar" ? "، " : ", "}
                    {ad.street}
                    {ad.landmark ? ` · ${ad.landmark}` : ""}
                  </span>
                  <form action={deleteAddress.bind(null, ad.id)}>
                    <button type="submit" className="min-h-11 shrink-0 px-2 text-danger underline">
                      {a.deleteAddress}
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">{a.noAddresses}</p>
          )}
        </section>

        <section className={box}>
          <h2 className="font-display mb-2 text-xl text-green">{a.orders}</h2>
          <p className="text-sm text-muted">{a.ordersSoon}</p>
        </section>

        <div className="flex flex-wrap gap-3">
          <form action={signOutTo.bind(null, lang, false)}>
            <button
              type="submit"
              className="min-h-12 rounded-brand border border-green px-5 font-semibold text-green"
              data-testid="sign-out"
            >
              {a.signOut}
            </button>
          </form>
          <form action={signOutTo.bind(null, lang, true)}>
            <button
              type="submit"
              className="min-h-12 rounded-brand border border-line px-5 text-sm text-charcoal"
              data-testid="sign-out-all"
            >
              {a.signOutAll}
            </button>
          </form>
        </div>
      </div>
    </Container>
  );
}
