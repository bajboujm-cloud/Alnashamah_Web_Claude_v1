ALTER TABLE "cutting_options" ADD COLUMN "unavailable_note_en" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "cutting_options" ADD COLUMN "unavailable_note_ar" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "extras" ADD COLUMN "unavailable_note_en" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "extras" ADD COLUMN "unavailable_note_ar" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "packaging_options" ADD COLUMN "unavailable_note_en" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "packaging_options" ADD COLUMN "unavailable_note_ar" text DEFAULT '' NOT NULL;