import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z
    .string()
    .default("postgres://undangane:undangane@localhost:5433/undangane"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  AUTH_SECRET: z.string().min(16).default("dev-only-secret-ganti-di-produksi-0123456789"),
  APP_URL: z.string().default("http://localhost:3000"),
  INVITE_URL: z.string().optional(),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),

  DUITKU_MERCHANT_CODE: z.string().optional(),
  DUITKU_API_KEY: z.string().optional(),
  DUITKU_QRIS_CODE: z.string().default("DQ"),
  DUITKU_SANDBOX: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
  DUITKU_CALLBACK_URL: z.string().optional(),
  DUITKU_MIN_AMOUNT_IDR: z.coerce.number().int().positive().default(10000),

  QR_HMAC_SECRET: z.string().optional(),
  PAYOUT_ENCRYPTION_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  ENCRYPTION_KEY: z.string().optional(),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  throw new Error(`Environment variables tidak valid:\n${issues}`);
}

export const env = parsed.data;
export type Env = typeof env;
