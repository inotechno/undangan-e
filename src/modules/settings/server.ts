import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { decryptValue, encryptValue } from "@/core/crypto";
import { db, schema } from "@/db";

/* ── Generic settings KV ─────────────────────────────────── */

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const rows = await db
    .select({ value: schema.settings.value })
    .from(schema.settings)
    .where(eq(schema.settings.key, key))
    .limit(1);
  const v = rows[0]?.value;
  return (v ?? fallback) as T;
}

export async function setSetting(key: string, value: unknown, updatedBy?: string): Promise<void> {
  await db
    .insert(schema.settings)
    .values({ key, value, updatedBy })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value, updatedBy, updatedAt: new Date() } });
}

/* ── Platform env settings (admin-configurable) ──────────── */

export const PLATFORM_SETTING_KEYS = [
  "platform.app_name",
  "platform.support_email",
  "platform.support_whatsapp",
  "payment.duitku_merchant_code",
  "payment.duitku_api_key",
  "payment.duitku_qris_code",
  "payment.duitku_sandbox",
  "payment.duitku_force_dummy",
  "payment.allow_simulation",
  "reseller.upgrade_price_idr",
  "reseller.upgrade_enabled",
  "google.client_id",
  "google.client_secret",
  "email.provider",
  "email.resend_api_key",
  "email.from_address",
  "email.from_name",
  "email.smtp_host",
  "email.smtp_port",
  "email.smtp_user",
  "email.smtp_pass",
  "email.smtp_secure",
  "auth.require_email_verification",
] as const;

export type PlatformSettingKey = (typeof PLATFORM_SETTING_KEYS)[number];

export interface PlatformSettings {
  appName: string;
  supportEmail: string;
  supportWhatsapp: string;
  duitkuMerchantCode: string;
  duitkuApiKey: string;
  duitkuQrisCode: string;
  duitkuSandbox: boolean;
  duitkuForceDummy: boolean;
  allowSimulation: boolean;
  resellerUpgradePriceIdr: number;
  resellerUpgradeEnabled: boolean;
  googleClientId: string;
  googleClientSecret: string;
  emailProvider: "smtp" | "resend";
  resendApiKey: string;
  emailFromAddress: string;
  emailFromName: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpSecure: boolean;
  requireEmailVerification: boolean;
}

export const platformSettingsSchema = z.object({
  appName: z.string().trim().min(1).max(80),
  supportEmail: z.string().trim().email().or(z.literal("")),
  supportWhatsapp: z.string().trim().max(30).or(z.literal("")),
  duitkuMerchantCode: z.string().trim().max(50).or(z.literal("")),
  duitkuApiKey: z.string().trim().max(100).or(z.literal("")),
  duitkuQrisCode: z.string().trim().max(10).or(z.literal("")),
  duitkuSandbox: z.boolean(),
  duitkuForceDummy: z.boolean(),
  allowSimulation: z.boolean(),
  resellerUpgradePriceIdr: z.coerce.number().int().min(0).max(100_000_000),
  resellerUpgradeEnabled: z.boolean(),
  googleClientId: z.string().trim().max(200).or(z.literal("")),
  googleClientSecret: z.string().trim().max(200).or(z.literal("")),
  emailProvider: z.enum(["smtp", "resend"]).default("resend"),
  resendApiKey: z.string().trim().max(200).or(z.literal("")),
  emailFromAddress: z.string().trim().email().or(z.literal("")),
  emailFromName: z.string().trim().max(80).or(z.literal("")),
  smtpHost: z.string().trim().max(200).or(z.literal("")),
  smtpPort: z.coerce.number().int().min(1).max(65535).default(587),
  smtpUser: z.string().trim().max(200).or(z.literal("")),
  smtpPass: z.string().trim().max(200).or(z.literal("")),
  smtpSecure: z.boolean().default(false),
  requireEmailVerification: z.boolean(),
});

export async function getPlatformSettings(): Promise<PlatformSettings> {
  const rows = await db
    .select({ key: schema.settings.key, value: schema.settings.value })
    .from(schema.settings)
    .where(inArray(schema.settings.key, [...PLATFORM_SETTING_KEYS]));
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const s = (k: string) => (typeof map.get(k) === "string" ? (map.get(k) as string) : "");
  const sd = (k: string) => decryptValue(s(k)); // string ter-encrypt → decrypt
  const b = (k: string, fb: boolean) => (typeof map.get(k) === "boolean" ? (map.get(k) as boolean) : fb);
  const n = (k: string, fb: number) => {
    const v = map.get(k);
    return typeof v === "number" ? v : typeof v === "string" && v !== "" && !Number.isNaN(Number(v)) ? Number(v) : fb;
  };
  return {
    appName: s("platform.app_name") || "UndanganE",
    supportEmail: s("platform.support_email"),
    supportWhatsapp: s("platform.support_whatsapp"),
    duitkuMerchantCode: s("payment.duitku_merchant_code"),
    duitkuApiKey: sd("payment.duitku_api_key"),
    duitkuQrisCode: s("payment.duitku_qris_code"),
    duitkuSandbox: b("payment.duitku_sandbox", true),
    duitkuForceDummy: b("payment.duitku_force_dummy", false),
    allowSimulation: b("payment.allow_simulation", false),
    resellerUpgradePriceIdr: n("reseller.upgrade_price_idr", 50000),
    resellerUpgradeEnabled: b("reseller.upgrade_enabled", true),
    googleClientId: s("google.client_id"),
    googleClientSecret: sd("google.client_secret"),
    emailProvider: s("email.provider") === "smtp" ? "smtp" : "resend",
    resendApiKey: sd("email.resend_api_key"),
    emailFromAddress: s("email.from_address"),
    emailFromName: s("email.from_name"),
    smtpHost: s("email.smtp_host"),
    smtpPort: n("email.smtp_port", 587),
    smtpUser: s("email.smtp_user"),
    smtpPass: sd("email.smtp_pass"),
    smtpSecure: b("email.smtp_secure", false),
    requireEmailVerification: b("auth.require_email_verification", false),
  };
}

/** Field yang wajib di-encrypt at rest (AES-256-GCM). */
const ENCRYPTED_FIELDS = new Set([
  "payment.duitku_api_key",
  "google.client_secret",
  "email.resend_api_key",
  "email.smtp_pass",
]);

export async function setPlatformSettings(input: PlatformSettings, updatedBy: string): Promise<void> {
  const entries: [string, unknown][] = [
    ["platform.app_name", input.appName],
    ["platform.support_email", input.supportEmail],
    ["platform.support_whatsapp", input.supportWhatsapp],
    ["payment.duitku_merchant_code", input.duitkuMerchantCode],
    ["payment.duitku_api_key", input.duitkuApiKey],
    ["payment.duitku_qris_code", input.duitkuQrisCode],
    ["payment.duitku_sandbox", input.duitkuSandbox],
    ["payment.duitku_force_dummy", input.duitkuForceDummy],
    ["payment.allow_simulation", input.allowSimulation],
    ["reseller.upgrade_price_idr", input.resellerUpgradePriceIdr],
    ["reseller.upgrade_enabled", input.resellerUpgradeEnabled],
    ["google.client_id", input.googleClientId],
    ["google.client_secret", input.googleClientSecret],
    ["email.provider", input.emailProvider],
    ["email.resend_api_key", input.resendApiKey],
    ["email.from_address", input.emailFromAddress],
    ["email.from_name", input.emailFromName],
    ["email.smtp_host", input.smtpHost],
    ["email.smtp_port", input.smtpPort],
    ["email.smtp_user", input.smtpUser],
    ["email.smtp_pass", input.smtpPass],
    ["email.smtp_secure", input.smtpSecure],
    ["auth.require_email_verification", input.requireEmailVerification],
  ];
  await db.transaction(async (tx) => {
    for (const [key, value] of entries) {
      const stored = ENCRYPTED_FIELDS.has(key) && typeof value === "string" && value !== "" ? encryptValue(value) : value;
      await tx
        .insert(schema.settings)
        .values({ key, value: stored, updatedBy })
        .onConflictDoUpdate({ target: schema.settings.key, set: { value: stored, updatedBy, updatedAt: new Date() } });
    }
  });
}
