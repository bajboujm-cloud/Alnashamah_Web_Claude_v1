-- Owner's decision (Nov 2026): delivery is included (free) and pick-up from the shop is allowed.
UPDATE "delivery_zones" SET "fee_fils" = 0 WHERE "fee_fils" IS NULL;--> statement-breakpoint
UPDATE "settings" SET "value" = 'true'::jsonb, "updated_at" = now() WHERE "key" = 'delivery.pickup_enabled';
