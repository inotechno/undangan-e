CREATE TYPE "public"."account_type" AS ENUM('user', 'reseller');--> statement-breakpoint
CREATE TYPE "public"."check_in_actor" AS ENUM('owner', 'manage_token', 'staff');--> statement-breakpoint
CREATE TYPE "public"."check_in_result" AS ENUM('success', 'duplicate', 'invalid');--> statement-breakpoint
CREATE TYPE "public"."guest_source" AS ENUM('import', 'manual', 'link', 'form');--> statement-breakpoint
CREATE TYPE "public"."guestbook_status" AS ENUM('visible', 'hidden');--> statement-breakpoint
CREATE TYPE "public"."invitation_status" AS ENUM('draft', 'awaiting_payment', 'active', 'expired', 'archived');--> statement-breakpoint
CREATE TYPE "public"."manage_token_scope" AS ENUM('owner', 'customer');--> statement-breakpoint
CREATE TYPE "public"."media_purpose" AS ENUM('invitation', 'avatar', 'template_preview');--> statement-breakpoint
CREATE TYPE "public"."media_scan_status" AS ENUM('pending', 'clean', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."order_kind" AS ENUM('invitation', 'reseller_upgrade');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('created', 'awaiting_payment', 'paid', 'cancelled', 'expired', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."payment_attempt_status" AS ENUM('pending', 'succeeded', 'failed', 'expired', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."rsvp_status" AS ENUM('pending', 'attending', 'declined');--> statement-breakpoint
CREATE TYPE "public"."template_status" AS ENUM('active', 'hidden');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'reseller', 'contributor', 'admin');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."user_type" AS ENUM('user', 'reseller', 'contributor');--> statement-breakpoint
CREATE TYPE "public"."voucher_applies_to" AS ENUM('all', 'user', 'reseller');--> statement-breakpoint
CREATE TYPE "public"."voucher_type" AS ENUM('percent', 'nominal');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" text,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ip" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name_id" text NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "check_ins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guest_id" uuid NOT NULL,
	"invitation_id" uuid NOT NULL,
	"scanned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor" "check_in_actor" NOT NULL,
	"result" "check_in_result" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guestbook_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invitation_id" uuid NOT NULL,
	"name" text NOT NULL,
	"message" text NOT NULL,
	"status" "guestbook_status" DEFAULT 'visible' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invitation_id" uuid NOT NULL,
	"name" text NOT NULL,
	"name_normalized" text NOT NULL,
	"phone" text,
	"group_name" text,
	"quota" integer DEFAULT 1 NOT NULL,
	"rsvp" "rsvp_status" DEFAULT 'pending' NOT NULL,
	"source" "guest_source" DEFAULT 'manual' NOT NULL,
	"guest_code" text NOT NULL,
	"qr_hash" text NOT NULL,
	"checked_in_at" timestamp with time zone,
	"checked_in_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "guests_qr_hash_unique" UNIQUE("qr_hash"),
	CONSTRAINT "guests_quota_positive" CHECK ("guests"."quota" >= 1)
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"reseller_id" text,
	"customer_name" text,
	"customer_selling_price_idr" integer,
	"template_id" uuid NOT NULL,
	"template_variant_id" uuid,
	"slug" text NOT NULL,
	"event_type" text DEFAULT 'pernikahan' NOT NULL,
	"status" "invitation_status" DEFAULT 'draft' NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"published_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "invitations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "manage_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invitation_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"label" text,
	"scope" "manage_token_scope" DEFAULT 'owner' NOT NULL,
	"created_by" text,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "manage_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"key" text NOT NULL,
	"mime" text NOT NULL,
	"bytes" integer NOT NULL,
	"sha256" text NOT NULL,
	"purpose" "media_purpose" NOT NULL,
	"scan_status" "media_scan_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "order_kind" NOT NULL,
	"owner_id" text NOT NULL,
	"invitation_id" uuid,
	"account_type" "account_type" DEFAULT 'user' NOT NULL,
	"unit_price_idr" integer NOT NULL,
	"voucher_id" uuid,
	"voucher_code" text,
	"discount_amount_idr" integer DEFAULT 0 NOT NULL,
	"final_amount_idr" integer NOT NULL,
	"customer_selling_price_idr" integer,
	"status" "order_status" DEFAULT 'created' NOT NULL,
	"idempotency_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paid_at" timestamp with time zone,
	CONSTRAINT "orders_idempotency_key_unique" UNIQUE("idempotency_key"),
	CONSTRAINT "orders_final_amount_nonneg" CHECK ("orders"."final_amount_idr" >= 0),
	CONSTRAINT "orders_discount_nonneg" CHECK ("orders"."discount_amount_idr" >= 0),
	CONSTRAINT "orders_reseller_upgrade_no_voucher" CHECK ("orders"."kind" <> 'reseller_upgrade' OR "orders"."voucher_id" IS NULL)
);
--> statement-breakpoint
CREATE TABLE "payment_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"provider" text DEFAULT 'duitku' NOT NULL,
	"provider_ref" text,
	"status" "payment_attempt_status" DEFAULT 'pending' NOT NULL,
	"qr_string" text,
	"expires_at" timestamp with time zone,
	"raw_last" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"event_id" text NOT NULL,
	"payload" jsonb NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "pricing_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_type" "account_type" NOT NULL,
	"amount_idr" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"effective_from" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pricing_rules_amount_positive" CHECK ("pricing_rules"."amount_idr" > 0)
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "template_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"name" text NOT NULL,
	"theme_tokens" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"category_id" uuid NOT NULL,
	"description" text,
	"preview_image_key" text,
	"style_tags" text[] DEFAULT '{}' NOT NULL,
	"status" "template_status" DEFAULT 'active' NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"variant_group" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "templates_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"role" "user_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"phone" text,
	"type" "user_type" DEFAULT 'user' NOT NULL,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vouchers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"type" "voucher_type" NOT NULL,
	"value" integer NOT NULL,
	"max_discount_idr" integer,
	"min_order_idr" integer DEFAULT 0 NOT NULL,
	"applies_to" "voucher_applies_to" DEFAULT 'all' NOT NULL,
	"max_total_uses" integer,
	"used_count" integer DEFAULT 0 NOT NULL,
	"max_uses_per_user" integer,
	"valid_from" timestamp with time zone DEFAULT now() NOT NULL,
	"valid_until" timestamp with time zone,
	"active" boolean DEFAULT true NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vouchers_code_unique" UNIQUE("code"),
	CONSTRAINT "vouchers_value_positive" CHECK ("vouchers"."value" > 0),
	CONSTRAINT "vouchers_percent_cap" CHECK ("vouchers"."type" <> 'percent' OR ("vouchers"."value" BETWEEN 1 AND 100))
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guestbook_entries" ADD CONSTRAINT "guestbook_entries_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guests" ADD CONSTRAINT "guests_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_reseller_id_users_id_fk" FOREIGN KEY ("reseller_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_template_variant_id_template_variants_id_fk" FOREIGN KEY ("template_variant_id") REFERENCES "public"."template_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manage_tokens" ADD CONSTRAINT "manage_tokens_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manage_tokens" ADD CONSTRAINT "manage_tokens_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_voucher_id_vouchers_id_fk" FOREIGN KEY ("voucher_id") REFERENCES "public"."vouchers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_variants" ADD CONSTRAINT "template_variants_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "templates" ADD CONSTRAINT "templates_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_entity_id_idx" ON "audit_logs" USING btree ("entity","entity_id");--> statement-breakpoint
CREATE INDEX "check_ins_guest_id_idx" ON "check_ins" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX "check_ins_invitation_id_idx" ON "check_ins" USING btree ("invitation_id");--> statement-breakpoint
CREATE INDEX "check_ins_scanned_at_idx" ON "check_ins" USING btree ("scanned_at");--> statement-breakpoint
CREATE INDEX "guestbook_entries_invitation_id_idx" ON "guestbook_entries" USING btree ("invitation_id");--> statement-breakpoint
CREATE INDEX "guests_invitation_id_idx" ON "guests" USING btree ("invitation_id");--> statement-breakpoint
CREATE INDEX "guests_invitation_name_normalized_idx" ON "guests" USING btree ("invitation_id","name_normalized");--> statement-breakpoint
CREATE UNIQUE INDEX "guests_guest_code_unique" ON "guests" USING btree ("guest_code");--> statement-breakpoint
CREATE INDEX "invitations_owner_id_idx" ON "invitations" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "invitations_status_idx" ON "invitations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "invitations_reseller_id_idx" ON "invitations" USING btree ("reseller_id");--> statement-breakpoint
CREATE INDEX "manage_tokens_invitation_id_idx" ON "manage_tokens" USING btree ("invitation_id");--> statement-breakpoint
CREATE INDEX "media_assets_owner_id_idx" ON "media_assets" USING btree ("owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "media_assets_key_unique" ON "media_assets" USING btree ("key");--> statement-breakpoint
CREATE INDEX "orders_owner_id_idx" ON "orders" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "orders_invitation_id_idx" ON "orders" USING btree ("invitation_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payment_attempts_order_id_idx" ON "payment_attempts" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_attempts_provider_ref_unique" ON "payment_attempts" USING btree ("provider","provider_ref");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_events_provider_event_id_unique" ON "payment_events" USING btree ("provider","event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pricing_rules_one_active_per_type" ON "pricing_rules" USING btree ("account_type") WHERE "pricing_rules"."active" = true;--> statement-breakpoint
CREATE INDEX "template_variants_template_id_idx" ON "template_variants" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "templates_category_id_idx" ON "templates" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_roles_user_id_role_unique" ON "user_roles" USING btree ("user_id","role");