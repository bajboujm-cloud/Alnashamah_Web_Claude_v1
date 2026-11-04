import "server-only";
import { and, asc, eq, inArray, ne } from "drizzle-orm";
import { connection } from "next/server";
import { db, schema as s } from "@/server/db";

/**
 * Read-only catalogue queries for the public site. Stock and prices must always be fresh,
 * so every query waits for a real request (`connection()`) instead of being baked in at build time.
 */

const optionOrder = [asc(s.breedOptions.sortOrder), asc(s.breedOptions.createdAt)];

export async function getVisibleCategories() {
  await connection();
  return db.query.categories.findMany({
    where: ne(s.categories.status, "hidden"),
    orderBy: [asc(s.categories.sortOrder)],
  });
}

export async function getCategoryWithBreeds(slug: string) {
  await connection();
  return db.query.categories.findFirst({
    where: and(eq(s.categories.slug, slug), ne(s.categories.status, "hidden")),
    with: {
      breeds: {
        orderBy: [asc(s.breeds.sortOrder)],
        with: { options: { orderBy: optionOrder } },
      },
    },
  });
}

export async function getBreed(categorySlug: string, breedSlug: string) {
  const category = await getCategoryWithBreeds(categorySlug);
  if (!category || category.status !== "active") return null;
  const breed = category.breeds.find((b) => b.slug === breedSlug);
  return breed ? { category, breed } : null;
}

/** Breeds from active categories, for the home page. */
export async function getFeaturedBreeds(limit = 8) {
  await connection();
  const rows = await db.query.breeds.findMany({
    with: { category: true, options: { orderBy: optionOrder } },
    orderBy: [asc(s.breeds.sortOrder)],
  });
  return rows
    .filter((b) => b.category.status === "active")
    .sort((a, b) => a.category.sortOrder - b.category.sortOrder || a.sortOrder - b.sortOrder)
    .slice(0, limit);
}

export async function getPackagingOptions() {
  await connection();
  return db.query.packagingOptions.findMany({ orderBy: [asc(s.packagingOptions.sortOrder)] });
}

export async function getSeasonalCollections() {
  await connection();
  return db.query.seasonalCollections.findMany({
    orderBy: [asc(s.seasonalCollections.sortOrder)],
  });
}

export async function getSeasonalCollection(slug: string) {
  await connection();
  const collection = await db.query.seasonalCollections.findFirst({
    where: eq(s.seasonalCollections.slug, slug),
  });
  if (!collection) return null;
  const links = await db
    .select({ breedId: s.seasonalCollectionBreeds.breedId })
    .from(s.seasonalCollectionBreeds)
    .where(eq(s.seasonalCollectionBreeds.collectionId, collection.id));
  const breeds = links.length
    ? await db.query.breeds.findMany({
        where: inArray(
          s.breeds.id,
          links.map((l) => l.breedId),
        ),
        with: { category: true, options: { orderBy: optionOrder } },
      })
    : [];
  return {
    collection,
    breeds: breeds
      .filter((b) => b.category.status === "active")
      .sort((a, b) => a.category.sortOrder - b.category.sortOrder || a.sortOrder - b.sortOrder),
  };
}

export type CategoryWithBreeds = NonNullable<Awaited<ReturnType<typeof getCategoryWithBreeds>>>;
export type BreedWithOptions = CategoryWithBreeds["breeds"][number];
export type FeaturedBreed = Awaited<ReturnType<typeof getFeaturedBreeds>>[number];
