import { env } from "@/core/config";
import { getPlatformSettings } from "@/modules/settings/server";

export interface AuthEmailInput {
  to: string;
  subject: string;
  html: string;
}

/** Kirim email via Resend API. API key & from diambil dari settings admin (fallback env). */
export async function sendAuthEmail(input: AuthEmailInput): Promise<{ ok: true } | { ok: false; error: string }> {
  const settings = await getPlatformSettings();
  const apiKey = settings.resendApiKey || env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY belum dikonfigurasi" };

  const fromName = settings.emailFromName || settings.appName || "UndanganE";
  const fromAddress = settings.emailFromAddress || "UndanganE <onboarding@resend.dev>";
  const from = settings.emailFromAddress ? `${fromName} <${settings.emailFromAddress}>` : fromAddress;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[email] Resend error", res.status, body.slice(0, 300));
    return { ok: false, error: `Resend ${res.status}` };
  }
  return { ok: true };
}

const shell = (title: string, bodyHtml: string) => `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f7f7;font-family:Segoe UI,system-ui,sans-serif;">
    <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:14px;border:1px solid #e4ebee;overflow:hidden;">
      <div style="background:#0d9488;padding:20px 28px;">
        <p style="margin:0;color:#fff;font-size:18px;font-weight:800;letter-spacing:-0.3px;">UndanganE</p>
      </div>
      <div style="padding:28px;">
        <h1 style="margin:0 0 12px;font-size:18px;color:#142c3c;">${title}</h1>
        ${bodyHtml}
        <p style="margin:24px 0 0;font-size:11px;color:#8ca0ae;">Jika Anda tidak meminta email ini, abaikan saja.</p>
      </div>
    </div>
  </body>
</html>`;

const btn = (url: string, label: string) => `
  <p style="margin:20px 0;">
    <a href="${url}" style="display:inline-block;background:#0d9488;color:#fff;text-decoration:none;font-weight:700;font-size:13px;padding:12px 22px;border-radius:10px;">
      ${label}
    </a>
  </p>
  <p style="margin:8px 0 0;font-size:11px;color:#687b88;word-break:break-all;">
    Atau buka tautan: <a href="${url}" style="color:#0d9488;">${url}</a>
  </p>`;

export function verificationEmailHtml(name: string, url: string) {
  return shell(
    "Verifikasi email Anda",
    `
    <p style="margin:0 0 8px;font-size:13px;color:#425968;">Halo ${name || "there"},</p>
    <p style="margin:0;font-size:13px;line-height:1.65;color:#425968;">
      Terima kasih telah mendaftar di UndanganE. Silakan verifikasi email Anda untuk mengaktifkan akun.
    </p>
    ${btn(url, "Verifikasi Email")}
    `,
  );
}

export function resetPasswordEmailHtml(name: string, url: string) {
  return shell(
    "Reset password Anda",
    `
    <p style="margin:0 0 8px;font-size:13px;color:#425968;">Halo ${name || "there"},</p>
    <p style="margin:0;font-size:13px;line-height:1.65;color:#425968;">
      Kami menerima permintaan reset password untuk akun Anda. Tautan berlaku terbatas — segera buat password baru.
    </p>
    ${btn(url, "Buat Password Baru")}
    `,
  );
}
