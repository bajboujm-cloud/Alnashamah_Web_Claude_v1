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
  packagingSeed,
  seasonalSeed,
  settingsSeed,
} from "./seed-data";

const { db, sql } = createDb(DATABASE_URL, { max: 1 });

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

  // Give every breed that has no options yet 3 empty placeholder options.
  const allBreeds = await db.select().from(s.breeds);
  for (const breed of allBreeds) {
    const existing = await db
      .select({ id: s.breedOptions.id })
      .from(s.breedOptions)
      .where(eq(s.breedOptions.breedId, breed.id))
      .limit(1);
    if (existing.length) continue;
    await db.insert(s.breedOptions).values(
      Array.from({ length: OPTIONS_PER_BREED }, (_, i) => ({
        breedId: breed.id,
        labelEn: `Option ${i + 1}`,
        labelAr: `الخيار ${i + 1}`,
        sortOrder: i + 1,
      })),
    );
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
