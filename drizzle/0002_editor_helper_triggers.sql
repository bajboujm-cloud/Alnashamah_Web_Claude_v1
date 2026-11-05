-- Helper columns for editing the catalogue in the database editor (pnpm db:studio):
--   breeds.category_name      e.g. "Sheep — غنم"                 (read-only, automatic)
--   breed_options.breed_name  e.g. "Sheep / Naeemi — نعيمي"       (read-only, automatic)
--   breed_options.price_aed   price in AED, kept in sync with price_fils (edit either one)

-- Rebuild breed_options so the editor shows the useful columns first:
-- breed name, size, age, weight, price (AED), in stock, order — technical ids at the end.
ALTER TABLE "breed_options" RENAME TO "breed_options_old";
--> statement-breakpoint
ALTER TABLE "breed_options_old" RENAME CONSTRAINT "breed_options_pkey" TO "breed_options_old_pkey";
--> statement-breakpoint
ALTER TABLE "breed_options_old" DROP CONSTRAINT "breed_options_breed_id_breeds_id_fk";
--> statement-breakpoint
CREATE TABLE "breed_options" (
	"breed_name" text,
	"label_en" text,
	"label_ar" text,
	"age_min_months" integer,
	"age_max_months" integer,
	"weight_min_kg" numeric(6, 1),
	"weight_max_kg" numeric(6, 1),
	"price_aed" numeric(10, 2),
	"is_available" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"price_fils" integer,
	"compare_at_price_fils" integer,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"breed_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "breed_options_price_positive" CHECK ("breed_options"."price_fils" IS NULL OR "breed_options"."price_fils" >= 0),
	CONSTRAINT "breed_options_age_range" CHECK ("breed_options"."age_min_months" IS NULL OR "breed_options"."age_max_months" IS NULL OR "breed_options"."age_min_months" <= "breed_options"."age_max_months"),
	CONSTRAINT "breed_options_weight_range" CHECK ("breed_options"."weight_min_kg" IS NULL OR "breed_options"."weight_max_kg" IS NULL OR "breed_options"."weight_min_kg" <= "breed_options"."weight_max_kg")
);
--> statement-breakpoint
ALTER TABLE "breed_options" ADD CONSTRAINT "breed_options_breed_id_breeds_id_fk" FOREIGN KEY ("breed_id") REFERENCES "public"."breeds"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION nashamah_breed_category_name() RETURNS trigger AS $$
BEGIN
  NEW.category_name := (SELECT c.name_en || ' — ' || c.name_ar FROM categories c WHERE c.id = NEW.category_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER breeds_category_name BEFORE INSERT OR UPDATE ON breeds
  FOR EACH ROW EXECUTE FUNCTION nashamah_breed_category_name();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION nashamah_option_helpers() RETURNS trigger AS $$
BEGIN
  NEW.breed_name := (
    SELECT c.name_en || ' / ' || b.name_en || ' — ' || b.name_ar
    FROM breeds b JOIN categories c ON c.id = b.category_id
    WHERE b.id = NEW.breed_id
  );
  IF TG_OP = 'UPDATE' AND NEW.price_aed IS DISTINCT FROM OLD.price_aed
     AND NEW.price_fils IS NOT DISTINCT FROM OLD.price_fils THEN
    -- AED edited: update fils
    NEW.price_fils := CASE WHEN NEW.price_aed IS NULL THEN NULL ELSE round(NEW.price_aed * 100)::integer END;
  ELSE
    -- fils set or edited (by the app or the seed): update AED
    NEW.price_aed := CASE WHEN NEW.price_fils IS NULL THEN NULL ELSE NEW.price_fils / 100.0 END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER breed_options_helpers BEFORE INSERT OR UPDATE ON breed_options
  FOR EACH ROW EXECUTE FUNCTION nashamah_option_helpers();
--> statement-breakpoint
-- Renaming a breed or moving it to another category refreshes its rows' names.
CREATE OR REPLACE FUNCTION nashamah_breed_renamed() RETURNS trigger AS $$
BEGIN
  UPDATE breed_options SET breed_name = NULL WHERE breed_id = NEW.id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER breeds_renamed AFTER UPDATE OF name_en, name_ar, category_id ON breeds
  FOR EACH ROW EXECUTE FUNCTION nashamah_breed_renamed();
--> statement-breakpoint
-- Renaming a category refreshes its breeds and their rows.
CREATE OR REPLACE FUNCTION nashamah_category_renamed() RETURNS trigger AS $$
BEGIN
  UPDATE breeds SET category_name = NULL WHERE category_id = NEW.id;
  UPDATE breed_options SET breed_name = NULL
    WHERE breed_id IN (SELECT id FROM breeds WHERE category_id = NEW.id);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER categories_renamed AFTER UPDATE OF name_en, name_ar ON categories
  FOR EACH ROW EXECUTE FUNCTION nashamah_category_renamed();
--> statement-breakpoint
-- Copy the rows back, grouped by breed so the editor lists them in a sensible order.
INSERT INTO "breed_options" ("id", "breed_id", "label_en", "label_ar", "age_min_months", "age_max_months",
  "weight_min_kg", "weight_max_kg", "price_fils", "compare_at_price_fils", "is_available", "sort_order",
  "created_at", "updated_at")
SELECT o."id", o."breed_id", o."label_en", o."label_ar", o."age_min_months", o."age_max_months",
  o."weight_min_kg", o."weight_max_kg", o."price_fils", o."compare_at_price_fils", o."is_available", o."sort_order",
  o."created_at", o."updated_at"
FROM "breed_options_old" o
JOIN "breeds" b ON b."id" = o."breed_id"
JOIN "categories" c ON c."id" = b."category_id"
ORDER BY c."sort_order", b."sort_order", o."sort_order";
--> statement-breakpoint
DROP TABLE "breed_options_old";
--> statement-breakpoint
-- Fill the helper column for breeds that already exist.
UPDATE breeds SET category_name = NULL;
