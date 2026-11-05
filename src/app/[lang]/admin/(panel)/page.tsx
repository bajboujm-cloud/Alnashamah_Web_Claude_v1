import Link from "next/link";
import { notFound } from "next/navigation";
import { PageTitle } from "@/components/admin/PageTitle";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { isBreedInStock, isSeasonVisible } from "@/lib/availability";
import { requireStaff } from "@/server/auth/staff";
import { adminBreedsByCategory } from "@/server/admin-data";
import { getSeasonalCollections } from "@/server/catalog";

export default async function Dashboard({ params, searchParams }: PageProps<"/[lang]/admin">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const user = await requireStaff(lang, "dashboard.view");
  const { denied } = await searchParams;
  const t = (await getDictionary(lang)).admin;
  const [cats, seasons] = await Promise.all([adminBreedsByCategory(), getSeasonalCollections()]);

  const breeds = cats.filter((c) => c.status !== "hidden").flatMap((c) => c.breeds);
  const inStock = breeds.filter(isBreedInStock).length;
  const noPrice = breeds.flatMap((b) => b.options).filter((o) => o.priceFils == null).length;
  const cards = [
    { label: t.dashboard.inStock, value: inStock, href: "breeds" },
    { label: t.dashboard.outOfStock, value: breeds.length - inStock, href: "breeds" },
    { label: t.dashboard.noPrice, value: noPrice, href: "breeds" },
    {
      label: t.dashboard.seasonOn,
      value: seasons.filter((x) => isSeasonVisible(x)).length,
      href: "seasonal",
    },
  ];

  return (
    <>
      <PageTitle title={`${t.dashboard.welcome}${lang === "ar" ? "،" : ","} ${user.name}`} />
      {denied ? (
        <p role="alert" className="mb-6 rounded-brand border border-danger/40 px-3 py-2 text-sm text-danger">
          {t.msg.denied}
        </p>
      ) : null}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c, i) => (
          <Link
            key={c.label}
            href={`/${lang}/admin/${c.href}`}
            className={`p-4 ${i % 2 ? "bg-green text-ivory" : "border border-line bg-white text-green"}`}
          >
            <div className="h-0.5 w-10 bg-gold" />
            <p className="mt-3 font-serif text-3xl">{c.value}</p>
            <p className="mt-1 text-sm opacity-80">{c.label}</p>
          </Link>
        ))}
      </div>
      <p className="mt-8 rounded-brand border border-line bg-white p-4 text-sm text-muted">
        {t.dashboard.ordersSoon}
      </p>
    </>
  );
}
