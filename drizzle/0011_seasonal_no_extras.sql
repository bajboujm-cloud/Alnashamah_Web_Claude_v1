ALTER TABLE "seasonal_collections" ADD COLUMN "occasion" text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "seasonal_collections" ADD COLUMN "no_extras" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "seasonal_collections" ADD COLUMN "no_extras_note_en" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "seasonal_collections" ADD COLUMN "no_extras_note_ar" text DEFAULT '' NOT NULL;--> statement-breakpoint
-- Eid Al-Adha sacrifice orders: government slaughterhouses keep the head, intestines and tripe.
UPDATE "seasonal_collections"
SET "occasion" = 'udhiyah',
    "no_extras" = true,
    "no_extras_note_en" = 'Not included with Eid Al-Adha sacrifices due to government slaughterhouse regulations.',
    "no_extras_note_ar" = 'لا تشمل أضاحي عيد الأضحى الرأس والمصران والكرش حسب أنظمة وتعليمات المسالخ الحكومية.'
WHERE "slug" = 'eid-al-adha';
--> statement-breakpoint
-- The Eid message now lives on the Eid offer; the items keep their own (empty) message for real stock-outs.
UPDATE "extras"
SET "unavailable_note_en" = '', "unavailable_note_ar" = ''
WHERE "unavailable_note_en" = 'Not available during Eid Al-Adha due to government slaughterhouse regulations.';
