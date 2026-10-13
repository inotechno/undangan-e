import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { env } from "@/core/config";
import { db, schema } from "@/db";

export const auth = betterAuth({
  secret: env.AUTH_SECRET,
  baseURL: env.APP_URL,
  basePath: "/api/auth",
  // APP_URL menunjuk domain publik (tunnel/produksi); akses lokal via
  // localhost tetap boleh agar pengembangan tidak terblokir "Invalid origin".
  trustedOrigins: ["http://localhost:3000", "http://127.0.0.1:3000"],
  telemetry: { enabled: false },
  // Rate limit bawaan aktif di build produksi; matikan sementara lewat env
  // (mis. pengujian lokal). Hardening penuh (Redis) = Fase 11.
  rateLimit: {
    enabled: process.env.AUTH_RATE_LIMIT !== "false",
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  socialProviders: env.GOOGLE_CLIENT_ID
    ? {
        google: {
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET ?? "",
        },
      }
    : undefined,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  user: {
    additionalFields: {
      phone: { type: "string", required: false },
      type: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false,
      },
      status: {
        type: "string",
        required: false,
        defaultValue: "active",
        input: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Pendaftaran selalu memberi role `user` (docs/04).
          await db
            .insert(schema.userRoles)
            .values({
              id: crypto.randomUUID(),
              userId: user.id,
              role: "user",
            })
            .onConflictDoNothing();
        },
      },
    },
    session: {
      create: {
        // Akun suspended tidak boleh mendapat sesi baru (login ditolak).
        before: async (session) => {
          const [u] = await db
            .select({ status: schema.users.status })
            .from(schema.users)
            .where(eq(schema.users.id, session.userId))
            .limit(1);
          if (!u || u.status === "suspended") return false;
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}
