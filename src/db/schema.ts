import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const userTypeEnum = pgEnum("user_type", ["user", "reseller", "contributor"]);
export const userStatusEnum = pgEnum("user_status", ["active", "suspended"]);
export const userRoleEnum = pgEnum("user_role", ["user", "reseller", "contributor", "admin"]);
export const accountTypeEnum = pgEnum("account_type", ["user", "reseller"]);
export const voucherTypeEnum = pgEnum("voucher_type", ["percent", "nominal"]);
export const voucherAppliesToEnum = pgEnum("voucher_applies_to", ["all", "user", "reseller"]);
export const templateStatusEnum = pgEnum("template_status", ["active", "hidden"]);
export const invitationStatusEnum = pgEnum("invitation_status", [
  "draft",
  "awaiting_payment",
  "active",
  "expired",
  "archived",
]);
export const rsvpEnum = pgEnum("rsvp_status", ["pending", "attending", "declined"]);
export const guestSourceEnum = pgEnum("guest_source", ["import", "manual", "link", "form"]);
export const checkInActorEnum = pgEnum("check_in_actor", ["owner", "manage_token", "staff"]);
export const checkInResultEnum = pgEnum("check_in_result", ["success", "duplicate", "invalid"]);
export const manageTokenScopeEnum = pgEnum("manage_token_scope", ["owner", "customer"]);
export const guestbookStatusEnum = pgEnum("guestbook_status", ["visible", "hidden"]);
export const orderKindEnum = pgEnum("order_kind", ["invitation", "reseller_upgrade"]);
export const orderStatusEnum = pgEnum("order_status", [
  "created",
  "awaiting_payment",
  "paid",
  "cancelled",
  "expired",
  "refunded",
]);
export const paymentAttemptStatusEnum = pgEnum("payment_attempt_status", [
  "pending",
  "succeeded",
  "failed",
  "expired",
  "refunded",
]);
export const mediaPurposeEnum = pgEnum("media_purpose", [
  "invitation",
  "avatar",
  "template_preview",
]);
export const mediaScanStatusEnum = pgEnum("media_scan_status", [
  "pending",
  "clean",
  "rejected",
]);

// ─── Helpers ─────────────────────────────────────────────────────────────────

const timestamptz = (name: string) => timestamp(name, { withTimezone: true });
const uuidPk = (name = "id") => uuid(name).primaryKey().defaultRandom();

// ─── Auth (Better Auth) ──────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  phone: text("phone"),
  type: userTypeEnum("type").notNull().default("user"),
  status: userStatusEnum("status").notNull().default("active"),
  createdAt: timestamptz("created_at").notNull().defaultNow(),
  updatedAt: timestamptz("updated_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  expiresAt: timestamptz("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamptz("created_at").notNull().defaultNow(),
  updatedAt: timestamptz("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamptz("access_token_expires_at"),
  refreshTokenExpiresAt: timestamptz("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamptz("created_at").notNull().defaultNow(),
  updatedAt: timestamptz("updated_at").notNull().defaultNow(),
});

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamptz("expires_at").notNull(),
  createdAt: timestamptz("created_at").notNull().defaultNow(),
  updatedAt: timestamptz("updated_at").notNull().defaultNow(),
});

// ─── Roles ───────────────────────────────────────────────────────────────────

export const userRoles = pgTable(
  "user_roles",
  {
    id: uuidPk(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: userRoleEnum("role").notNull(),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("user_roles_user_id_role_unique").on(t.userId, t.role)],
);

// ─── Settings, pricing, vouchers ─────────────────────────────────────────────

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedBy: text("updated_by").references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestamptz("updated_at").notNull().defaultNow(),
});

export const pricingRules = pgTable(
  "pricing_rules",
  {
    id: uuidPk(),
    accountType: accountTypeEnum("account_type").notNull(),
    amountIdr: integer("amount_idr").notNull(),
    active: boolean("active").notNull().default(true),
    effectiveFrom: timestamptz("effective_from").notNull().defaultNow(),
    createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (t) => [
    check("pricing_rules_amount_positive", sql`${t.amountIdr} > 0`),
    uniqueIndex("pricing_rules_one_active_per_type")
      .on(t.accountType)
      .where(sql`${t.active} = true`),
  ],
);

export const vouchers = pgTable(
  "vouchers",
  {
    id: uuidPk(),
    code: text("code").notNull().unique(),
    type: voucherTypeEnum("type").notNull(),
    value: integer("value").notNull(),
    maxDiscountIdr: integer("max_discount_idr"),
    minOrderIdr: integer("min_order_idr").notNull().default(0),
    appliesTo: voucherAppliesToEnum("applies_to").notNull().default("all"),
    maxTotalUses: integer("max_total_uses"),
    usedCount: integer("used_count").notNull().default(0),
    maxUsesPerUser: integer("max_uses_per_user"),
    validFrom: timestamptz("valid_from").notNull().defaultNow(),
    validUntil: timestamptz("valid_until"),
    active: boolean("active").notNull().default(true),
    createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    updatedAt: timestamptz("updated_at").notNull().defaultNow(),
  },
  (t) => [
    check("vouchers_value_positive", sql`${t.value} > 0`),
    check(
      "vouchers_percent_cap",
      sql`${t.type} <> 'percent' OR (${t.value} BETWEEN 1 AND 100)`,
    ),
  ],
);

// ─── Katalog template ────────────────────────────────────────────────────────

export const categories = pgTable("categories", {
  id: uuidPk(),
  slug: text("slug").notNull().unique(),
  nameId: text("name_id").notNull(),
  sort: integer("sort").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamptz("created_at").notNull().defaultNow(),
});

export const templates = pgTable(
  "templates",
  {
    id: uuidPk(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    description: text("description"),
    previewImageKey: text("preview_image_key"),
    sectionLabels: jsonb("section_labels")
      .$type<Record<string, { eyebrow?: string; title?: string }>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    styleTags: text("style_tags").array().notNull().default(sql`'{}'`),
    status: templateStatusEnum("status").notNull().default("active"),
    sort: integer("sort").notNull().default(0),
    variantGroup: text("variant_group"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    updatedAt: timestamptz("updated_at").notNull().defaultNow(),
  },
  (t) => [index("templates_category_id_idx").on(t.categoryId)],
);

export const templateVariants = pgTable(
  "template_variants",
  {
    id: uuidPk(),
    templateId: uuid("template_id")
      .notNull()
      .references(() => templates.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    themeTokens: jsonb("theme_tokens").notNull().default({}),
    active: boolean("active").notNull().default(true),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (t) => [index("template_variants_template_id_idx").on(t.templateId)],
);

// ─── Invitations ─────────────────────────────────────────────────────────────

export const invitations = pgTable(
  "invitations",
  {
    id: uuidPk(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    resellerId: text("reseller_id").references(() => users.id, { onDelete: "set null" }),
    customerName: text("customer_name"),
    customerSellingPriceIdr: integer("customer_selling_price_idr"),
    templateId: uuid("template_id")
      .notNull()
      .references(() => templates.id, { onDelete: "restrict" }),
    templateVariantId: uuid("template_variant_id").references(() => templateVariants.id, {
      onDelete: "set null",
    }),
    slug: text("slug").notNull().unique(),
    eventType: text("event_type").notNull().default("pernikahan"),
    status: invitationStatusEnum("status").notNull().default("draft"),
    config: jsonb("config").notNull().default({}),
    publishedAt: timestamptz("published_at"),
    expiresAt: timestamptz("expires_at"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    updatedAt: timestamptz("updated_at").notNull().defaultNow(),
    deletedAt: timestamptz("deleted_at"),
  },
  (t) => [
    index("invitations_owner_id_idx").on(t.ownerId),
    index("invitations_status_idx").on(t.status),
    index("invitations_reseller_id_idx").on(t.resellerId),
  ],
);

// ─── Guests & check-in ───────────────────────────────────────────────────────

export const guests = pgTable(
  "guests",
  {
    id: uuidPk(),
    invitationId: uuid("invitation_id")
      .notNull()
      .references(() => invitations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    nameNormalized: text("name_normalized").notNull(),
    phone: text("phone"),
    groupName: text("group_name"),
    quota: integer("quota").notNull().default(1),
    rsvp: rsvpEnum("rsvp").notNull().default("pending"),
    /** RSVP per sesi acara: [{ scheduleIndex: 0, status: "attending" }] */
    rsvpSessions: jsonb("rsvp_sessions").$type<Array<{ scheduleIndex: number; status: "attending" | "declined" }>>().default([]),
    source: guestSourceEnum("source").notNull().default("manual"),
    guestCode: text("guest_code").notNull(),
    qrHash: text("qr_hash").notNull().unique(),
    checkedInAt: timestamptz("checked_in_at"),
    checkedInBy: text("checked_in_by"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("guests_invitation_id_idx").on(t.invitationId),
    index("guests_invitation_name_normalized_idx").on(t.invitationId, t.nameNormalized),
    uniqueIndex("guests_guest_code_unique").on(t.guestCode),
    check("guests_quota_positive", sql`${t.quota} >= 1`),
  ],
);

export const checkIns = pgTable(
  "check_ins",
  {
    id: uuidPk(),
    guestId: uuid("guest_id")
      .notNull()
      .references(() => guests.id, { onDelete: "cascade" }),
    invitationId: uuid("invitation_id")
      .notNull()
      .references(() => invitations.id, { onDelete: "cascade" }),
    scannedAt: timestamptz("scanned_at").notNull().defaultNow(),
    actor: checkInActorEnum("actor").notNull(),
    result: checkInResultEnum("result").notNull(),
  },
  (t) => [
    index("check_ins_guest_id_idx").on(t.guestId),
    index("check_ins_invitation_id_idx").on(t.invitationId),
    index("check_ins_scanned_at_idx").on(t.scannedAt),
  ],
);

// ─── Manage tokens & guestbook ───────────────────────────────────────────────

export const manageTokens = pgTable(
  "manage_tokens",
  {
    id: uuidPk(),
    invitationId: uuid("invitation_id")
      .notNull()
      .references(() => invitations.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    label: text("label"),
    scope: manageTokenScopeEnum("scope").notNull().default("owner"),
    createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
    lastUsedAt: timestamptz("last_used_at"),
    revokedAt: timestamptz("revoked_at"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (t) => [index("manage_tokens_invitation_id_idx").on(t.invitationId)],
);

export const guestbookEntries = pgTable(
  "guestbook_entries",
  {
    id: uuidPk(),
    invitationId: uuid("invitation_id")
      .notNull()
      .references(() => invitations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    message: text("message").notNull(),
    status: guestbookStatusEnum("status").notNull().default("visible"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (t) => [index("guestbook_entries_invitation_id_idx").on(t.invitationId)],
);

// ─── Orders & payments ───────────────────────────────────────────────────────

export const orders = pgTable(
  "orders",
  {
    id: uuidPk(),
    kind: orderKindEnum("kind").notNull(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    invitationId: uuid("invitation_id").references(() => invitations.id, {
      onDelete: "set null",
    }),
    accountType: accountTypeEnum("account_type").notNull().default("user"),
    unitPriceIdr: integer("unit_price_idr").notNull(),
    voucherId: uuid("voucher_id").references(() => vouchers.id, { onDelete: "set null" }),
    voucherCode: text("voucher_code"),
    discountAmountIdr: integer("discount_amount_idr").notNull().default(0),
    finalAmountIdr: integer("final_amount_idr").notNull(),
    // Rincian biaya (snapshot saat order dibuat/diubah — fee & pajak admin-configurable)
    feePercent: numeric("fee_percent", { mode: "number" }).notNull().default(0),
    feeAmountIdr: integer("fee_amount_idr").notNull().default(0),
    feeBorneByBuyer: boolean("fee_borne_by_buyer").notNull().default(false),
    taxPercent: numeric("tax_percent", { mode: "number" }).notNull().default(0),
    taxAmountIdr: integer("tax_amount_idr").notNull().default(0),
    taxBorneByBuyer: boolean("tax_borne_by_buyer").notNull().default(false),
    payableAmountIdr: integer("payable_amount_idr").notNull().default(0),
    customerSellingPriceIdr: integer("customer_selling_price_idr"),
    status: orderStatusEnum("status").notNull().default("created"),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    paidAt: timestamptz("paid_at"),
  },
  (t) => [
    index("orders_owner_id_idx").on(t.ownerId),
    index("orders_invitation_id_idx").on(t.invitationId),
    index("orders_status_idx").on(t.status),
    check("orders_final_amount_nonneg", sql`${t.finalAmountIdr} >= 0`),
    check("orders_discount_nonneg", sql`${t.discountAmountIdr} >= 0`),
    check("orders_payable_nonneg", sql`${t.payableAmountIdr} >= 0`),
    check(
      "orders_reseller_upgrade_no_voucher",
      sql`${t.kind} <> 'reseller_upgrade' OR ${t.voucherId} IS NULL`,
    ),
  ],
);

export const paymentAttempts = pgTable(
  "payment_attempts",
  {
    id: uuidPk(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    provider: text("provider").notNull().default("duitku"),
    providerRef: text("provider_ref"),
    status: paymentAttemptStatusEnum("status").notNull().default("pending"),
    qrString: text("qr_string"),
    paymentUrl: text("payment_url"),
    channel: text("channel"),
    amountIdr: integer("amount_idr"),
    expiresAt: timestamptz("expires_at"),
    rawLast: jsonb("raw_last"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    updatedAt: timestamptz("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("payment_attempts_order_id_idx").on(t.orderId),
    uniqueIndex("payment_attempts_provider_ref_unique").on(t.provider, t.providerRef),
  ],
);

export const paymentEvents = pgTable(
  "payment_events",
  {
    id: uuidPk(),
    provider: text("provider").notNull(),
    eventId: text("event_id").notNull(),
    payload: jsonb("payload").notNull(),
    receivedAt: timestamptz("received_at").notNull().defaultNow(),
    processedAt: timestamptz("processed_at"),
  },
  (t) => [uniqueIndex("payment_events_provider_event_id_unique").on(t.provider, t.eventId)],
);

// ─── Audit & media ───────────────────────────────────────────────────────────

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuidPk(),
    actorId: text("actor_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id"),
    meta: jsonb("meta").notNull().default({}),
    ip: text("ip"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("audit_logs_created_at_idx").on(t.createdAt),
    index("audit_logs_entity_entity_id_idx").on(t.entity, t.entityId),
  ],
);

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuidPk(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    mime: text("mime").notNull(),
    bytes: integer("bytes").notNull(),
    sha256: text("sha256").notNull(),
    purpose: mediaPurposeEnum("purpose").notNull(),
    scanStatus: mediaScanStatusEnum("scan_status").notNull().default("pending"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("media_assets_owner_id_idx").on(t.ownerId),
    uniqueIndex("media_assets_key_unique").on(t.key),
  ],
);

// ─── Export types ────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type UserType = (typeof userTypeEnum.enumValues)[number];
export type InvitationStatus = (typeof invitationStatusEnum.enumValues)[number];
export type OrderKind = (typeof orderKindEnum.enumValues)[number];
export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];
