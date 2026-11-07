ALTER TABLE "categories" ADD COLUMN "sacrifice_min_age_months" integer;--> statement-breakpoint
UPDATE "categories" SET "sacrifice_min_age_months" = 6 WHERE "slug" = 'sheep' AND "sacrifice_min_age_months" IS NULL;--> statement-breakpoint
UPDATE "categories" SET "sacrifice_min_age_months" = 12 WHERE "slug" = 'goats' AND "sacrifice_min_age_months" IS NULL;
