import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { isSeasonVisible } from "@/lib/availability";
import { siteUrl } from "@/lib/site";
import { getCategoryWithBreeds, getSeasonalCollections, getVisibleCategories } from "@/server/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paths = ["", "/livestock"];
  const categories = await getVisibleCategories();
  for (const c of categories) {
    paths.push(`/${c.slug}`);
    if (c.status !== "active") continue;
    const full = await getCategoryWithBreeds(c.slug);
    for (const b of full?.breeds ?? []) paths.push(`/${c.slug}/${b.slug}`);
  }
  for (const s of await getSeasonalCollections()) if (isSeasonVisible(s)) paths.push(`/seasonal/${s.slug}`);

  return paths.map((p) => ({
    url: `${siteUrl}/ar${p}`,
    alternates: { languages: Object.fromEntries(locales.map((l) => [l, `${siteUrl}/${l}${p}`])) },
  }));
}
