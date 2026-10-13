ALTER TABLE "orders" ADD COLUMN "fee_percent" numeric DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "fee_amount_idr" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "fee_borne_by_buyer" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "tax_percent" numeric DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "tax_amount_idr" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "tax_borne_by_buyer" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payable_amount_idr" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_attempts" ADD COLUMN "payment_url" text;--> statement-breakpoint
ALTER TABLE "payment_attempts" ADD COLUMN "channel" text;--> statement-breakpoint
ALTER TABLE "payment_attempts" ADD COLUMN "amount_idr" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_payable_nonneg" CHECK ("orders"."payable_amount_idr" >= 0);--> statement-breakpoint
UPDATE "orders" SET "payable_amount_idr" = "final_amount_idr" WHERE "payable_amount_idr" = 0;