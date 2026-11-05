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
      className={`group relative flex flex-col border border-line bg-white p-3 transition-colors sm:p-5 hover:border-gold ${soon ? "opacity-80" : ""}`}
      data-testid="category-card"
    >
      <div className="mb-2 h-0.5 w-10 bg-gold sm:mb-4 sm:w-16" aria-hidden />
      {category.illustrationUrl ? (
        // 3:2 box. Illustrations (SVG) are shown whole; photos fill the box edge to edge.
        <div className="relative aspect-[3/2] w-full overflow-hidden">
          <Image
            src={category.illustrationUrl}
            alt=""
            fill
            sizes="(max-width: 1024px) 50vw, 25vw"
            className={`${category.illustrationUrl.endsWith(".svg") ? "object-contain" : "object-cover"} ${soon ? "opacity-50" : ""}`}
          />
        </div>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-1 sm:mt-4 sm:gap-2">
        <h3 className="font-display text-lg text-green sm:text-xl">{name}</h3>
        {soon ? <ComingSoonBadge label={comingSoonLabel} /> : null}
      </div>
      <p className="mt-1 hidden text-sm text-muted sm:block">
        {pick(locale, category.descriptionEn, category.descriptionAr)}
      </p>
    </Link>
  );
}
