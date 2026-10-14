import { NextResponse } from "next/server";
import { requireAdmin } from "@/auth/guard";
import { invalidateAuthCache } from "@/auth/auth";
import { writeAudit } from "@/modules/audit/log";
import { invalidateDuitkuConfigCache } from "@/modules/payments/duitku";
import { getPlatformSettings, setPlatformSettings, platformSettingsSchema } from "@/modules/settings/server";

export const instant = false;

export async function GET() {
  await requireAdmin();
  const settings = await getPlatformSettings();
  // Jangan kirim API key penuh ke client — cukup indikasi sudah diisi.
  return NextResponse.json({
    ...settings,
    duitkuApiKey: settings.duitkuApiKey ? "••••" + settings.duitkuApiKey.slice(-4) : "",
    duitkuApiKeySet: Boolean(settings.duitkuApiKey),
    googleClientSecret: settings.googleClientSecret ? "••••" + settings.googleClientSecret.slice(-4) : "",
    googleClientSecretSet: Boolean(settings.googleClientSecret),
    resendApiKey: settings.resendApiKey ? "••••" + settings.resendApiKey.slice(-4) : "",
    resendApiKeySet: Boolean(settings.resendApiKey),
    smtpPass: settings.smtpPass ? "••••" + settings.smtpPass.slice(-4) : "",
    smtpPassSet: Boolean(settings.smtpPass),
  });
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin();
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON tidak valid" }, { status: 400 });
  }
  const parsed = platformSettingsSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });
  }

  const current = await getPlatformSettings();
  // API key masked ("••••xxxx") → pertahankan nilai lama.
  const data = { ...parsed.data };
  if (data.duitkuApiKey.startsWith("••••")) {
    data.duitkuApiKey = current.duitkuApiKey;
  }
  if (data.googleClientSecret.startsWith("••••")) {
    data.googleClientSecret = current.googleClientSecret;
  }
  if (data.resendApiKey.startsWith("••••")) {
    data.resendApiKey = current.resendApiKey;
  }
  if (data.smtpPass.startsWith("••••")) {
    data.smtpPass = current.smtpPass;
  }

  await setPlatformSettings(data, auth.session.user.id);
  invalidateDuitkuConfigCache();
  invalidateAuthCache();
  await writeAudit({
    actorId: auth.session.user.id,
    action: "settings.platform.change",
    entity: "settings",
    entityId: "platform",
    meta: {
      duitkuSandbox: data.duitkuSandbox,
      duitkuForceDummy: data.duitkuForceDummy,
      allowSimulation: data.allowSimulation,
      merchantChanged: data.duitkuMerchantCode !== current.duitkuMerchantCode,
      googleChanged: data.googleClientId !== current.googleClientId,
      requireEmailVerification: data.requireEmailVerification,
    },
  });

  return NextResponse.json({ ok: true });
}
