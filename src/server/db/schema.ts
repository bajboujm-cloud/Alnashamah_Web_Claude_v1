import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
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
  /** Minimum age (months) for an Udhiyah or Aqiqah from this category, e.g. sheep 6, goats 12. Empty = no rule. */
  sacrificeMinAgeMonths: integer("sacrifice_min_age_months"),
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
    /** Read-only helper for the database editor: filled automatically by a trigger (e.g. "Sheep — غنم"). */
    categoryName: text("category_name"),
    slug: text("slug").notNull(),
    nameEn: text("name_en").notNull(),
    nameAr: text("name_ar").notNull(),
    descriptionEn: text("description_en").notNull().default(""),
    descriptionAr: text("description_ar").notNull().default(""),
    /** One photo per breed (not per age/weight option). Null = branded placeholder. */
    photoUrl: text("photo_url"),
    /** One-tap toggle. Off = whole breed shown as "Out of stock", never hidden. */
    isAvailable: boolean("is_available").notNull().default(true),
    /** One-tap toggle. Off = breed removed from the website entirely (kept in the admin). */
    isVisible: boolean("is_visible").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [uniqueIndex("breeds_category_slug_idx").on(t.categoryId, t.slug)],
);

/** Age + weight range (after slaughter, kg) + price. Usually 3 per breed, some breeds 4–5. */
export const breedOptions = pgTable(
  "breed_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    breedId: uuid("breed_id")
      .notNull()
      .references(() => breeds.id, { onDelete: "cascade" }),
    /** Read-only helper for the database editor: filled automatically (e.g. "Sheep / Naeemi — نعيمي"). */
    breedName: text("breed_name"),
    labelEn: text("label_en"),
    labelAr: text("label_ar"),
    ageMinMonths: integer("age_min_months"),
    ageMaxMonths: integer("age_max_months"),
    weightMinKg: kg("weight_min_kg"),
    weightMaxKg: kg("weight_max_kg"),
    /**
     * Price in AED for easy editing in the database editor. A trigger keeps it in sync with `price_fils`
     * (edit either one). The app always reads `price_fils`.
     */
    priceAed: numeric("price_aed", { precision: 10, scale: 2, mode: "number" }),
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
  /** Shown to customers instead of "out of stock" when this is switched off (e.g. Eid slaughterhouse rules). */
  unavailableNoteEn: text("unavailable_note_en").notNull().default(""),
  unavailableNoteAr: text("unavailable_note_ar").notNull().default(""),
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
  selectedByDefault: boolean("selected_by_default").notNull().default(false),
  isAvailable: boolean("is_available").notNull().default(true),
  /** Shown to customers instead of "out of stock" when this is switched off (e.g. Eid slaughterhouse rules). */
  unavailableNoteEn: text("unavailable_note_en").notNull().default(""),
  unavailableNoteAr: text("unavailable_note_ar").notNull().default(""),
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
  /** Shown to customers instead of "out of stock" when this is switched off (e.g. Eid slaughterhouse rules). */
  unavailableNoteEn: text("unavailable_note_en").notNull().default(""),
  unavailableNoteAr: text("unavailable_note_ar").notNull().default(""),
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
  /** Orders with this occasion belong to this offer (e.g. Eid Al-Adha ↔ "udhiyah"). */
  occasion: text("occasion", { enum: ["none", "udhiyah", "aqiqah", "sadaqah", "other"] })
    .notNull()
    .default("none"),
  /** When on, "Order includes" (head, intestines, tripe …) can't be chosen for this occasion. */
  noExtras: boolean("no_extras").notNull().default(false),
  noExtrasNoteEn: text("no_extras_note_en").notNull().default(""),
  noExtrasNoteAr: text("no_extras_note_ar").notNull().default(""),
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

/** Home-page promotion slides (Admin → Promotions). Shown only while active and inside the dates. */
export const promotions = pgTable("promotions", {
  id: uuid("id").primaryKey().defaultRandom(),
  titleEn: text("title_en").notNull().default(""),
  titleAr: text("title_ar").notNull().default(""),
  textEn: text("text_en").notNull().default(""),
  textAr: text("text_ar").notNull().default(""),
  /** Wide banner (3:1). */
  imageUrl: text("image_url").notNull(),
  /** Optional phone version (4:3); the wide one is used when empty. */
  imageMobileUrl: text("image_mobile_url"),
  buttonEn: text("button_en").notNull().default(""),
  buttonAr: text("button_ar").notNull().default(""),
  /** A page on this site ("/ar/sheep") or a full https:// address. */
  linkUrl: text("link_url"),
  isActive: boolean("is_active").notNull().default(true),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
});

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

/**
 * Website wording edited in the admin panel ("Website text"). Each row replaces one built-in text from
 * src/i18n/dictionaries/{en,ar}.json, e.g. key "home.heroTitle", locale "ar".
 */
export const siteTexts = pgTable(
  "site_texts",
  {
    key: text("key").notNull(),
    locale: text("locale", { enum: ["en", "ar"] }).notNull(),
    value: text("value").notNull(),
    updatedAt: timestamps.updatedAt,
  },
  (t) => [primaryKey({ columns: [t.key, t.locale] })],
);

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

/* ----------------------------------------------------------------------------------------------
 * Staff (admin panel) accounts. Customers get their own phone-number login in Phase 4.
 * Staff always sign in with email + password + authenticator-app code (TOTP).
 * -------------------------------------------------------------------------------------------- */

export const staffRole = pgEnum("staff_role", ["owner", "manager", "order_staff", "content_editor"]);

export const staffUsers = pgTable("staff_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: staffRole("role").notNull(),
  /** scrypt hash — the password itself is never stored. */
  passwordHash: text("password_hash").notNull(),
  /** Authenticator secret, encrypted with AUTH_SECRET. Null until the user sets up their app. */
  totpSecretEnc: text("totp_secret_enc"),
  totpEnabled: boolean("totp_enabled").notNull().default(false),
  /** Last accepted TOTP time-step, so a code can't be used twice. */
  totpLastStep: integer("totp_last_step"),
  isActive: boolean("is_active").notNull().default(true),
  failedLogins: integer("failed_logins").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  ...timestamps,
});

export const staffSessions = pgTable("staff_sessions", {
  /** SHA-256 of the random token kept in the browser cookie. */
  id: text("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => staffUsers.id, { onDelete: "cascade" }),
  /** "pending" = password OK, waiting for the authenticator code; "active" = fully signed in. */
  stage: text("stage", { enum: ["pending", "active"] }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  userAgent: text("user_agent"),
  createdAt: timestamps.createdAt,
});

/* ----------------------------------------------------------------------------------------------
 * Shopping cart. One cart per browser (random id in an httpOnly cookie); later linked to the customer.
 * Lines store only choices — prices are always recalculated from the live catalogue.
 * -------------------------------------------------------------------------------------------- */

export const occasions = ["none", "udhiyah", "aqiqah", "sadaqah", "other"] as const;

export const fulfilments = ["delivery", "pickup"] as const;

export const carts = pgTable("carts", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** Checkout choices, filled step by step (customer → address → date & time). */
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
  fulfilment: text("fulfilment", { enum: fulfilments }).notNull().default("delivery"),
  addressId: uuid("address_id").references(() => customerAddresses.id, { onDelete: "set null" }),
  deliveryDate: date("delivery_date"),
  slotId: uuid("slot_id").references(() => deliverySlots.id, { onDelete: "set null" }),
  ...timestamps,
});

export const cartItems = pgTable("cart_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  cartId: uuid("cart_id")
    .notNull()
    .references(() => carts.id, { onDelete: "cascade" }),
  breedOptionId: uuid("breed_option_id")
    .notNull()
    .references(() => breedOptions.id, { onDelete: "cascade" }),
  cuttingOptionId: uuid("cutting_option_id").references(() => cuttingOptions.id, { onDelete: "set null" }),
  packagingOptionId: uuid("packaging_option_id").references(() => packagingOptions.id, {
    onDelete: "set null",
  }),
  /** Ids of the ticked "order includes" extras. */
  extraIds: jsonb("extra_ids").$type<string[]>().notNull().default([]),
  quantity: integer("quantity").notNull().default(1),
  occasion: text("occasion", { enum: occasions }).notNull().default("none"),
  onBehalfOf: text("on_behalf_of").notNull().default(""),
  notes: text("notes").notNull().default(""),
  ...timestamps,
});

/* ----------------------------------------------------------------------------------------------
 * Customers: sign in with mobile number + one-time code (members), or verify the number and continue
 * as a guest. Only a SHA-256 of the session cookie and an HMAC of each code are stored.
 * -------------------------------------------------------------------------------------------- */

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** Verified mobile number in international format, e.g. +971501234567. */
  phone: text("phone").notNull().unique(),
  name: text("name").notNull().default(""),
  email: text("email"),
  /** "Email me the invoice". */
  emailInvoices: boolean("email_invoices").notNull().default(false),
  /** True once they signed in with an account (guests stay false). */
  isMember: boolean("is_member").notNull().default(false),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  ...timestamps,
});

export const customerSessions = pgTable(
  "customer_sessions",
  {
    /** SHA-256 of the random token kept in the browser cookie. */
    id: text("id").primaryKey(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    /** "member" = signed in (30 days); "guest" = verified number for one checkout (a few hours). */
    kind: text("kind", { enum: ["member", "guest"] }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    userAgent: text("user_agent"),
    createdAt: timestamps.createdAt,
  },
  (t) => [index("customer_sessions_customer_idx").on(t.customerId)],
);

export const otpChallenges = pgTable(
  "otp_challenges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    phone: text("phone").notNull(),
    /** HMAC of the 6-digit code (null when the SMS provider checks the code itself). */
    codeHash: text("code_hash"),
    attempts: integer("attempts").notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    ip: text("ip"),
    createdAt: timestamps.createdAt,
  },
  (t) => [index("otp_challenges_phone_idx").on(t.phone, t.createdAt)],
);

export const customerAddresses = pgTable("customer_addresses", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  zoneId: uuid("zone_id")
    .notNull()
    .references(() => deliveryZones.id, { onDelete: "restrict" }),
  area: text("area").notNull(),
  /** Street, building / villa, flat. */
  street: text("street").notNull(),
  landmark: text("landmark").notNull().default(""),
  /** Optional map pin (Google Maps later). */
  latitude: numeric("latitude", { precision: 9, scale: 6, mode: "number" }),
  longitude: numeric("longitude", { precision: 9, scale: 6, mode: "number" }),
  /** Shown in the member's address book ("Save this address"). */
  isSaved: boolean("is_saved").notNull().default(false),
  ...timestamps,
});

/** Delivery time slots (placeholder until the owner decides): capacity and order cut-off per slot. */
export const deliverySlots = pgTable("delivery_slots", {
  id: uuid("id").primaryKey().defaultRandom(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  /** "HH:MM", Dubai time. */
  startTime: text("start_time").notNull().default("09:00"),
  endTime: text("end_time").notNull().default("21:00"),
  /** Animals per day for this slot; empty = no limit. */
  capacity: integer("capacity"),
  /** Orders close this many hours before the slot starts. */
  cutoffHours: integer("cutoff_hours").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
});

/** Days with no deliveries (e.g. a public holiday). */
export const deliveryBlackouts = pgTable("delivery_blackout_dates", {
  date: date("date").primaryKey(),
  noteEn: text("note_en").notNull().default(""),
  noteAr: text("note_ar").notNull().default(""),
});

export const customersRelations = relations(customers, ({ many }) => ({
  addresses: many(customerAddresses),
}));

export const customerAddressesRelations = relations(customerAddresses, ({ one }) => ({
  customer: one(customers, { fields: [customerAddresses.customerId], references: [customers.id] }),
  zone: one(deliveryZones, { fields: [customerAddresses.zoneId], references: [deliveryZones.id] }),
}));

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
