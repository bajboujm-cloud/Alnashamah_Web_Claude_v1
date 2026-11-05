import { eq, inArray } from "drizzle-orm";
import { createDb } from "../src/server/db/client";
import * as s from "../src/server/db/schema";
import { DATABASE_URL } from "./load-env";
import {
  OPTIONS_PER_BREED,
  breedSeed,
  categorySeed,
  cuttingSeed,
  deliveryZoneSeed,
  extrasSeed,
  optionLabels,
  packagingSeed,
  samplePricing,
  seasonalSeed,
  settingsSeed,
} from "./seed-data";

const { db, sql } = createDb(DATABASE_URL, { max: 1 });

/** Labels the seed itself gives to empty rows — rows still carrying them (and nothing else) are untouched. */
const PLACEHOLDER_LABELS = new Set([
  ...optionLabels.map(([en]) => en),
  ...Array.from({ length: 10 }, (_, i) => `Option ${i + 1}`),
]);

async function main() {
  await db.insert(s.categories).values(categorySeed).onConflictDoNothing();
  const cats = await db.select().from(s.categories);
  const catId = (slug: string) => {
    const c = cats.find((x) => x.slug === slug);
    if (!c) throw new Error(`Missing category ${slug}`);
    return c.id;
  };

  for (const [categorySlug, list] of Object.entries(breedSeed)) {
    const categoryId = catId(categorySlug);
    await db
      .insert(s.breeds)
      .values(list.map((b, i) => ({ ...b, categoryId, sortOrder: i + 1 })))
      .onConflictDoNothing();
  }

  // Options: a breed gets the starting rows when it has none, or when it still has only the untouched
  // empty placeholders from an earlier seed. Rows edited in the admin are never replaced.
  const allBreeds = await db.query.breeds.findMany({ with: { category: true, options: true } });
  for (const breed of allBreeds) {
    const untouched = breed.options.every(
      (o) =>
        o.priceFils == null &&
        o.ageMinMonths == null &&
        o.ageMaxMonths == null &&
        o.weightMinKg == null &&
        o.weightMaxKg == null &&
        o.isAvailable &&
        PLACEHOLDER_LABELS.has(o.labelEn ?? ""),
    );
    if (!untouched) continue;

    const sample = samplePricing[`${breed.category.slug}/${breed.slug}`] ?? [];
    // Already seeded and nothing new to apply: keep the rows (and their ids) as they are.
    const hasOldLabels = breed.options.some((o) => o.labelEn?.startsWith("Option "));
    if (breed.options.length && !sample.length && !hasOldLabels) continue;
    const count = Math.max(OPTIONS_PER_BREED, sample.length);
    const rows = Array.from({ length: count }, (_, i) => ({
      breedId: breed.id,
      labelEn: optionLabels[i]?.[0] ?? `Option ${i + 1}`,
      labelAr: optionLabels[i]?.[1] ?? `الخيار ${i + 1}`,
      sortOrder: i + 1,
      ...sample[i],
    }));

    await db.transaction(async (tx) => {
      if (breed.options.length) await tx.delete(s.breedOptions).where(eq(s.breedOptions.breedId, breed.id));
      await tx.insert(s.breedOptions).values(rows);
    });
  }

  await db.insert(s.cuttingOptions).values(cuttingSeed).onConflictDoNothing();
  const cuts = await db.select().from(s.cuttingOptions);
  const livestock = cats.filter((c) => c.slug === "sheep" || c.slug === "goats");
  await db
    .insert(s.cuttingOptionCategories)
    .values(cuts.flatMap((cut) => livestock.map((c) => ({ cuttingOptionId: cut.id, categoryId: c.id }))))
    .onConflictDoNothing();

  await db.insert(s.extras).values(extrasSeed).onConflictDoNothing();
  await db.insert(s.packagingOptions).values(packagingSeed).onConflictDoNothing();
  await db.insert(s.deliveryZones).values(deliveryZoneSeed).onConflictDoNothing();

  for (const { categories: catSlugs, ...collection } of seasonalSeed) {
    await db.insert(s.seasonalCollections).values(collection).onConflictDoNothing();
    const [row] = await db
      .select()
      .from(s.seasonalCollections)
      .where(eq(s.seasonalCollections.slug, collection.slug));
    const eligible = await db
      .select({ id: s.breeds.id })
      .from(s.breeds)
      .where(inArray(s.breeds.categoryId, catSlugs.map(catId)));
    if (eligible.length) {
      await db
        .insert(s.seasonalCollectionBreeds)
        .values(eligible.map((b) => ({ collectionId: row.id, breedId: b.id })))
        .onConflictDoNothing();
    }
  }

  await db
    .insert(s.settings)
    .values(Object.entries(settingsSeed).map(([key, value]) => ({ key, value })))
    .onConflictDoNothing();

  const [{ count }] = await sql`select count(*)::int as count from breeds`;
  console.log(`✓ Seed complete — ${cats.length} categories, ${count} breeds`);
}

try {
  await main();
} finally {
  await sql.end();
}
