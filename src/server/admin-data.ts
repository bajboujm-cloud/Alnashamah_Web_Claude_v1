import "server-only";
import { asc } from "drizzle-orm";
import { connection } from "next/server";
import { db, schema as s } from "@/server/db";

/** Queries for the admin panel (includes hidden items). */

export async function adminCategories() {
  await connection();
  return db.query.categories.findMany({
    orderBy: [asc(s.categories.sortOrder)],
    with: { breeds: { columns: { id: true } } },
  });
}

export async function adminBreedsByCategory() {
  await connection();
  return db.query.categories.findMany({
    orderBy: [asc(s.categories.sortOrder)],
    with: {
      breeds: {
        orderBy: [asc(s.breeds.sortOrder)],
        with: { options: { orderBy: [asc(s.breedOptions.sortOrder), asc(s.breedOptions.createdAt)] } },
      },
    },
  });
}

export async function adminBreed(id: string) {
  await connection();
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  return db.query.breeds.findFirst({
    where: (b, { eq }) => eq(b.id, id),
    with: { options: { orderBy: [asc(s.breedOptions.sortOrder), asc(s.breedOptions.createdAt)] } },
  });
}
