import Image from "next/image";
import Link from "next/link";
import { pick, type Locale } from "@/i18n/config";

type Category = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  illustrationUrl: string | null;
  status: "active" | "coming_soon" | "hidden";
};

/** Side-scrolling row of categories right under the header, on phones only. */
export function CategoryStrip({
  locale,
  categories,
  soonLabel,
  label,
}: {
  locale: Locale;
  categories: Category[];
  soonLabel: string;
  label: string;
}) {
  if (!categories.length) return null;
  return (
    <nav
      aria-label={label}
      className="flex gap-2.5 overflow-x-auto border-b border-line bg-ivory px-4 py-2.5 md:hidden"
      data-testid="category-strip"
    >
      {categories.map((c) => (
        <Link key={c.id} href={`/${locale}/${c.slug}`} className="w-20 shrink-0 text-center">
          <span className="relative block aspect-[4/3] w-full overflow-hidden border border-line bg-white">
            {c.illustrationUrl ? (
              <Image
                src={c.illustrationUrl}
                alt=""
                fill
                sizes="80px"
                className={c.illustrationUrl.endsWith(".svg") ? "object-contain p-1" : "object-cover"}
              />
            ) : null}
          </span>
          <span className="mt-1 block text-xs font-semibold text-green">
            {pick(locale, c.nameEn, c.nameAr)}
          </span>
          {c.status === "coming_soon" ? (
            <span className="block text-[10px] leading-none text-gold-deep">{soonLabel}</span>
          ) : null}
        </Link>
      ))}
    </nav>
  );
}
