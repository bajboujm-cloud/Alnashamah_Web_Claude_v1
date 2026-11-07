ALTER TABLE "extras" ALTER COLUMN "selected_by_default" SET DEFAULT false;--> statement-breakpoint
-- The owner asked for nothing to be ticked in "Order includes" by default (can be changed per item in the admin).
UPDATE "extras" SET "selected_by_default" = false;
