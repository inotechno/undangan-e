import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { env } from "@/core/config";
import { db, schema } from "@/db";
import { getPlatformSettings } from "@/modules/settings/server";
import { resetPasswordEmailHtml, sendAuthEmail, verificationEmailHtml } from "./email";

type AuthInstance = ReturnType<typeof buildAuth>;

let authInstance: AuthInstance | null = null;

function buildAuth(
  googleClientId: string,
  googleClientSecret: string,
  requireEmailVerification: boolean,
) {
  return betterAuth({
    secret: env.AUTH_SECRET,
    baseURL: env.APP_URL,
    basePath: "/api/auth",
    trustedOrigins: ["http://localhost:3000", "http://127.0.0.1:3000"],
    telemetry: { enabled: false },
    rateLimit: {
      enabled: process.env.AUTH_RATE_LIMIT !== "false",
    },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      requireEmailVerification,
      sendResetPassword: async (data) => {
        try {
          await sendAuthEmail({
            to: data.user.email,
            subject: "Reset password UndanganE",
            html: resetPasswordEmailHtml(data.user.name, data.url),
          });
        } catch (e) {
          console.error("[auth] sendResetPassword failed", e);
        }
      },
    },
    emailVerification: {
      sendVerificationEmail: async (data) => {
        try {
          await sendAuthEmail({
            to: data.user.email,
            subject: "Verifikasi email UndanganE",
            html: verificationEmailHtml(data.user.name, data.url),
          });
        } catch (e) {
          console.error("[auth] sendVerificationEmail failed", e);
        }
      },
    },
    socialProviders: googleClientId
      ? {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
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
}

/**
 * Lazy singleton: kredensial Google / opsi verifikasi email diambil dari
 * settings admin (DB) dengan fallback env. Panggil invalidateAuthCache()
 * setelah admin mengubah platform settings.
 */
export async function getAuth(): Promise<AuthInstance> {
  if (authInstance) return authInstance;
  let googleClientId = env.GOOGLE_CLIENT_ID ?? "";
  let googleClientSecret = env.GOOGLE_CLIENT_SECRET ?? "";
  let requireEmailVerification = false;
  try {
    const s = await getPlatformSettings();
    googleClientId = s.googleClientId || googleClientId;
    googleClientSecret = s.googleClientSecret || googleClientSecret;
    requireEmailVerification = s.requireEmailVerification;
  } catch {
    // DB belum siap → fallback env saja.
  }
  authInstance = buildAuth(googleClientId, googleClientSecret, requireEmailVerification);
  return authInstance;
}

export function invalidateAuthCache(): void {
  authInstance = null;
}

/** true bila Google OAuth terkonfigurasi (untuk tombol login). */
export async function isGoogleLoginEnabled(): Promise<boolean> {
  try {
    const s = await getPlatformSettings();
    return Boolean(s.googleClientId || env.GOOGLE_CLIENT_ID);
  } catch {
    return Boolean(env.GOOGLE_CLIENT_ID);
  }
}

export type Session = Awaited<ReturnType<AuthInstance["api"]["getSession"]>>;

export async function getSession() {
  const a = await getAuth();
  return a.api.getSession({ headers: await headers() });
}
