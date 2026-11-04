import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Money is always stored as integer fils (1 AED = 100 fils) to avoid rounding errors.
 * A `null` price means "not decided yet" and is shown to customers as "Price coming soon".
 * Every customer-facing text has an English (`_en`) and an Arabic (`_ar`) column.
 */

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

const kg = (name: string) => numeric(name, { precision: 6, scale: 1, mode: "number" });

export const categoryStatus = pgEnum("category_status", ["active", "coming_soon", "hidden"]);

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  descriptionEn: text("description_en").notNull().default(""),
  descriptionAr: text("description_ar").notNull().default(""),
  /** Illustration / vector image shown on the category tile. */
  illustrationUrl: text("illustration_url"),
  status: categoryStatus("status").notNull().default("active"),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
});

export const breeds = pgTable(
  "breeds",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    slug: text("slug").notNull(),
    nameEn: text("name_en").notNull(),
    nameAr: text("name_ar").notNull(),
    descriptionEn: text("description_en").notNull().default(""),
    descriptionAr: text("description_ar").notNull().default(""),
    /** One photo per breed (not per age/weight option). Null = branded placeholder. */
    photoUrl: text("photo_url"),
    /** One-tap toggle. Off = whole breed shown as "Out of stock", never hidden. */
    isAvailable: boolean("is_available").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [uniqueIndex("breeds_category_slug_idx").on(t.categoryId, t.slug)],
);

/** Age + live-weight range + price. Usually 3 per breed, some breeds 4–5. */
export const breedOptions = pgTable(
  "breed_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    breedId: uuid("breed_id")
      .notNull()
      .references(() => breeds.id, { onDelete: "cascade" }),
    labelEn: text("label_en"),
    labelAr: text("label_ar"),
    ageMinMonths: integer("age_min_months"),
    ageMaxMonths: integer("age_max_months"),
    weightMinKg: kg("weight_min_kg"),
    weightMaxKg: kg("weight_max_kg"),
    priceFils: integer("price_fils"),
    compareAtPriceFils: integer("compare_at_price_fils"),
    /** One-tap toggle. Off = this row shown as "Out of stock", never hidden. */
    isAvailable: boolean("is_available").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [
    check("breed_options_price_positive", sql`${t.priceFils} IS NULL OR ${t.priceFils} >= 0`),
    check(
      "breed_options_age_range",
      sql`${t.ageMinMonths} IS NULL OR ${t.ageMaxMonths} IS NULL OR ${t.ageMinMonths} <= ${t.ageMaxMonths}`,
    ),
    check(
      "breed_options_weight_range",
      sql`${t.weightMinKg} IS NULL OR ${t.weightMaxKg} IS NULL OR ${t.weightMinKg} <= ${t.weightMaxKg}`,
    ),
  ],
);

export const cuttingOptions = pgTable("cutting_options", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  descriptionEn: text("description_en").notNull().default(""),
  descriptionAr: text("description_ar").notNull().default(""),
  photoUrl: text("photo_url"),
  videoUrl: text("video_url"),
  priceFils: integer("price_fils").notNull().default(0),
  isAvailable: boolean("is_available").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
});

/** Which categories a cutting option applies to (e.g. a camel-only cut later). */
export const cuttingOptionCategories = pgTable(
  "cutting_option_categories",
  {
    cuttingOptionId: uuid("cutting_option_id")
      .notNull()
      .references(() => cuttingOptions.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.cuttingOptionId, t.categoryId] })],
);

/** "Order includes" checkboxes: head, intestines, tripe … */
export const extras = pgTable("extras", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  priceFils: integer("price_fils").notNull().default(0),
  selectedByDefault: boolean("selected_by_default").notNull().default(true),
  isAvailable: boolean("is_available").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
});

export const packagingOptions = pgTable("packaging_options", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  descriptionEn: text("description_en").notNull().default(""),
  descriptionAr: text("description_ar").notNull().default(""),
  photoUrl: text("photo_url"),
  priceFils: integer("price_fils").notNull().default(0),
  isAvailable: boolean("is_available").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
});

/** Seasonal collections such as Eid Al-Adha Sacrifice / Qurban. */
export const seasonalCollections = pgTable("seasonal_collections", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  descriptionEn: text("description_en").notNull().default(""),
  descriptionAr: text("description_ar").notNull().default(""),
  illustrationUrl: text("illustration_url"),
  isActive: boolean("is_active").notNull().default(false),
  /** Optional visibility window; null = no limit. */
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
});

export const seasonalCollectionBreeds = pgTable(
  "seasonal_collection_breeds",
  {
    collectionId: uuid("collection_id")
      .notNull()
      .references(() => seasonalCollections.id, { onDelete: "cascade" }),
    breedId: uuid("breed_id")
      .notNull()
      .references(() => breeds.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.collectionId, t.breedId] })],
);

/** Delivery zones per emirate. Fee null = "to be confirmed" (placeholder until decided). */
export const deliveryZones = pgTable("delivery_zones", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  feeFils: integer("fee_fils"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
});

/** Key/value business settings (company name, TRN, VAT rate, phone numbers …). */
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamps.updatedAt,
});

/** Every admin change (prices, toggles, content) is recorded here. */
export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  actor: text("actor"),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id"),
  before: jsonb("before"),
  after: jsonb("after"),
  createdAt: timestamps.createdAt,
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  breeds: many(breeds),
}));

export const breedsRelations = relations(breeds, ({ one, many }) => ({
  category: one(categories, { fields: [breeds.categoryId], references: [categories.id] }),
  options: many(breedOptions),
  seasonalCollections: many(seasonalCollectionBreeds),
}));

export const breedOptionsRelations = relations(breedOptions, ({ one }) => ({
  breed: one(breeds, { fields: [breedOptions.breedId], references: [breeds.id] }),
}));

export const seasonalCollectionsRelations = relations(seasonalCollections, ({ many }) => ({
  breeds: many(seasonalCollectionBreeds),
}));

export const seasonalCollectionBreedsRelations = relations(seasonalCollectionBreeds, ({ one }) => ({
  collection: one(seasonalCollections, {
    fields: [seasonalCollectionBreeds.collectionId],
    references: [seasonalCollections.id],
  }),
  breed: one(breeds, { fields: [seasonalCollectionBreeds.breedId], references: [breeds.id] }),
}));
