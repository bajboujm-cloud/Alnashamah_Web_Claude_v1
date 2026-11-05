CREATE TABLE "promotions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title_en" text DEFAULT '' NOT NULL,
	"title_ar" text DEFAULT '' NOT NULL,
	"text_en" text DEFAULT '' NOT NULL,
	"text_ar" text DEFAULT '' NOT NULL,
	"image_url" text NOT NULL,
	"image_mobile_url" text,
	"button_en" text DEFAULT '' NOT NULL,
	"button_ar" text DEFAULT '' NOT NULL,
	"link_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
