import postgres from "postgres";

try {
  process.loadEnvFile(".env.local");
} catch {
  // optional
}

/** Direct database access so tests can flip stock toggles (the admin panel arrives in Phase 2). */
export const sql = postgres(
  process.env.DATABASE_URL ?? "postgres://nashamah:nashamah@localhost:5433/nashamah",
  { max: 1, onnotice: () => {} },
);

export async function setBreedAvailable(category: string, breed: string, available: boolean) {
  await sql`update breeds set is_available = ${available}
    where slug = ${breed} and category_id = (select id from categories where slug = ${category})`;
}

export async function setOptionAvailable(
  category: string,
  breed: string,
  sortOrder: number,
  available: boolean,
) {
  await sql`update breed_options set is_available = ${available}
    where sort_order = ${sortOrder} and breed_id = (
      select b.id from breeds b join categories c on c.id = b.category_id
      where b.slug = ${breed} and c.slug = ${category})`;
}
