import Image from "next/image";
import Link from "next/link";
import { pick, type Locale } from "@/i18n/config";
import { ComingSoonBadge } from "./StockBadge";

type Props = {
  locale: Locale;
  comingSoonLabel: string;
  category: {
    slug: string;
    nameEn: string;
    nameAr: string;
    descriptionEn: string;
    descriptionAr: string;
    illustrationUrl: string | null;
    status: "active" | "coming_soon" | "hidden";
  };
};

export function CategoryCard({ locale, category, comingSoonLabel }: Props) {
  const name = pick(locale, category.nameEn, category.nameAr);
  const soon = category.status === "coming_soon";
  return (
    <Link
      href={`/${locale}/${category.slug}`}
      className={`group relative flex flex-col border border-line bg-white p-5 transition-colors hover:border-gold ${soon ? "opacity-80" : ""}`}
      data-testid="category-card"
    >
      <div className="mb-4 h-0.5 w-16 bg-gold" aria-hidden />
      {category.illustrationUrl ? (
        <Image
          src={category.illustrationUrl}
          alt=""
          width={240}
          height={160}
          className={`mx-auto h-auto w-full max-w-[220px] ${soon ? "opacity-50" : ""}`}
        />
      ) : null}
      <div className="mt-4 flex items-center justify-between gap-2">
        <h3 className="font-display text-xl text-green">{name}</h3>
        {soon ? <ComingSoonBadge label={comingSoonLabel} /> : null}
      </div>
      <p className="mt-1 text-sm text-muted">
        {pick(locale, category.descriptionEn, category.descriptionAr)}
      </p>
    </Link>
  );
}
