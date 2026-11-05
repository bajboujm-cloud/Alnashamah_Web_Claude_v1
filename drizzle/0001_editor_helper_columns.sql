ALTER TABLE "breed_options" ADD COLUMN "breed_name" text;--> statement-breakpoint
ALTER TABLE "breed_options" ADD COLUMN "price_aed" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "breeds" ADD COLUMN "category_name" text;