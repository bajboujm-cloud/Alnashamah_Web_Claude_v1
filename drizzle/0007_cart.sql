CREATE TABLE "cart_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cart_id" uuid NOT NULL,
	"breed_option_id" uuid NOT NULL,
	"cutting_option_id" uuid,
	"packaging_option_id" uuid,
	"extra_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"occasion" text DEFAULT 'none' NOT NULL,
	"on_behalf_of" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_breed_option_id_breed_options_id_fk" FOREIGN KEY ("breed_option_id") REFERENCES "public"."breed_options"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cutting_option_id_cutting_options_id_fk" FOREIGN KEY ("cutting_option_id") REFERENCES "public"."cutting_options"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_packaging_option_id_packaging_options_id_fk" FOREIGN KEY ("packaging_option_id") REFERENCES "public"."packaging_options"("id") ON DELETE set null ON UPDATE no action;