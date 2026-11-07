CREATE TABLE "customer_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"zone_id" uuid NOT NULL,
	"area" text NOT NULL,
	"street" text NOT NULL,
	"landmark" text DEFAULT '' NOT NULL,
	"latitude" numeric(9, 6),
	"longitude" numeric(9, 6),
	"is_saved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone" text NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"email" text,
	"email_invoices" boolean DEFAULT false NOT NULL,
	"is_member" boolean DEFAULT false NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customers_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "delivery_blackout_dates" (
	"date" date PRIMARY KEY NOT NULL,
	"note_en" text DEFAULT '' NOT NULL,
	"note_ar" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "delivery_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name_en" text NOT NULL,
	"name_ar" text NOT NULL,
	"start_time" text DEFAULT '09:00' NOT NULL,
	"end_time" text DEFAULT '21:00' NOT NULL,
	"capacity" integer,
	"cutoff_hours" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "otp_challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone" text NOT NULL,
	"code_hash" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"ip" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "carts" ADD COLUMN "customer_id" uuid;--> statement-breakpoint
ALTER TABLE "carts" ADD COLUMN "fulfilment" text DEFAULT 'delivery' NOT NULL;--> statement-breakpoint
ALTER TABLE "carts" ADD COLUMN "address_id" uuid;--> statement-breakpoint
ALTER TABLE "carts" ADD COLUMN "delivery_date" date;--> statement-breakpoint
ALTER TABLE "carts" ADD COLUMN "slot_id" uuid;--> statement-breakpoint
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_zone_id_delivery_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."delivery_zones"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_sessions" ADD CONSTRAINT "customer_sessions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "customer_sessions_customer_idx" ON "customer_sessions" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "otp_challenges_phone_idx" ON "otp_challenges" USING btree ("phone","created_at");--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_address_id_customer_addresses_id_fk" FOREIGN KEY ("address_id") REFERENCES "public"."customer_addresses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_slot_id_delivery_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."delivery_slots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
INSERT INTO "delivery_slots" ("name_en", "name_ar", "start_time", "end_time", "sort_order")
SELECT 'Any time (9 am – 9 pm)', 'أي وقت (9 صباحاً – 9 مساءً)', '09:00', '21:00', 1
WHERE NOT EXISTS (SELECT 1 FROM "delivery_slots");--> statement-breakpoint
INSERT INTO "settings" ("key", "value") VALUES
  ('delivery.pickup_enabled', 'false'::jsonb),
  ('delivery.pickup_address_en', '""'::jsonb),
  ('delivery.pickup_address_ar', '""'::jsonb)
ON CONFLICT ("key") DO NOTHING;
