"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, ShieldCheck } from "lucide-react";

type Props = {
  initial: {
    appName: string;
    supportEmail: string;
    supportWhatsapp: string;
    duitkuMerchantCode: string;
    duitkuApiKey: string;
    duitkuApiKeySet: boolean;
    duitkuQrisCode: string;
    duitkuSandbox: boolean;
    duitkuForceDummy: boolean;
    allowSimulation: boolean;
    resellerUpgradePriceIdr: number;
    resellerUpgradeEnabled: boolean;
    googleClientId: string;
    googleClientSecret: string;
    googleClientSecretSet: boolean;
    resendApiKey: string;
    resendApiKeySet: boolean;
    emailFromAddress: string;
    emailFromName: string;
    requireEmailVerification: boolean;
  };
};

const labelCls = "text-[10px] font-bold tracking-wide text-[#687b88] uppercase";
const inputCls =
  "mt-1 h-9 w-full rounded-lg border border-[#e4ebee] bg-white px-2.5 text-xs outline-none focus-visible:border-teal";

function ToggleRow(props: {
  id: string;
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label htmlFor={props.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#e4ebee] p-3">
      <input
        id={props.id}
        type="checkbox"
        checked={props.checked}
        onChange={(e) => props.onChange(e.target.checked)}
        className="mt-0.5 size-4 shrink-0 accent-teal"
      />
      <span>
        <span className="block text-xs font-bold text-[#142c3c]">{props.label}</span>
        <span className="mt-0.5 block text-[11px] leading-relaxed text-[#687b88]">{props.hint}</span>
      </span>
    </label>
  );
}

export function PlatformSettingsForm({ initial }: Props) {
  const router = useRouter();
  const [appName, setAppName] = useState(initial.appName);
  const [supportEmail, setSupportEmail] = useState(initial.supportEmail);
  const [supportWhatsapp, setSupportWhatsapp] = useState(initial.supportWhatsapp);
  const [merchantCode, setMerchantCode] = useState(initial.duitkuMerchantCode);
  const [apiKey, setApiKey] = useState(initial.duitkuApiKey);
  const [qrisCode, setQrisCode] = useState(initial.duitkuQrisCode);
  const [sandbox, setSandbox] = useState(initial.duitkuSandbox);
  const [forceDummy, setForceDummy] = useState(initial.duitkuForceDummy);
  const [allowSim, setAllowSim] = useState(initial.allowSimulation);
  const [upgradePrice, setUpgradePrice] = useState(String(initial.resellerUpgradePriceIdr));
  const [upgradeEnabled, setUpgradeEnabled] = useState(initial.resellerUpgradeEnabled);
  const [googleClientId, setGoogleClientId] = useState(initial.googleClientId);
  const [googleClientSecret, setGoogleClientSecret] = useState(initial.googleClientSecret);
  const [resendApiKey, setResendApiKey] = useState(initial.resendApiKey);
  const [emailFromAddress, setEmailFromAddress] = useState(initial.emailFromAddress);
  const [emailFromName, setEmailFromName] = useState(initial.emailFromName);
  const [requireEmailVerif, setRequireEmailVerif] = useState(initial.requireEmailVerification);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/settings/platform", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appName: appName.trim(),
          supportEmail: supportEmail.trim(),
          supportWhatsapp: supportWhatsapp.trim(),
          duitkuMerchantCode: merchantCode.trim(),
          duitkuApiKey: apiKey.trim(),
          duitkuQrisCode: qrisCode.trim(),
          duitkuSandbox: sandbox,
          duitkuForceDummy: forceDummy,
          allowSimulation: allowSim,
          resellerUpgradePriceIdr: Number(upgradePrice),
          resellerUpgradeEnabled: upgradeEnabled,
          googleClientId: googleClientId.trim(),
          googleClientSecret: googleClientSecret.trim(),
          resendApiKey: resendApiKey.trim(),
          emailFromAddress: emailFromAddress.trim(),
          emailFromName: emailFromName.trim(),
          requireEmailVerification: requireEmailVerif,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMsg({ tone: "err", text: data.error ?? "Gagal menyimpan pengaturan" });
        return;
      }
      setMsg({ tone: "ok", text: "Pengaturan platform diperbarui" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-[#e4ebee] bg-white p-5 shadow-[0_7px_22px_rgba(21,48,65,0.04)]"
    >
      <h2 className="flex items-center gap-1.5 text-[15px] font-bold">
        <ShieldCheck className="size-4 text-teal" aria-hidden />
        Pengaturan Platform &amp; Gateway Pembayaran
      </h2>
      <p className="mt-0.5 text-[11px] leading-relaxed text-[#687b88]">
        Kredensial Duitku disimpan aman di database dan menimpa nilai <code>.env</code> bila diisi.
        Kosongkan untuk kembali ke nilai environment.
      </p>

      <h3 className="mt-4 text-xs font-bold tracking-wide text-[#425968] uppercase">Umum</h3>
      <div className="mt-2 grid gap-3 sm:grid-cols-3">
        <label>
          <span className={labelCls}>Nama aplikasi</span>
          <input value={appName} onChange={(e) => setAppName(e.target.value)} required className={inputCls} />
        </label>
        <label>
          <span className={labelCls}>Email dukungan</span>
          <input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} placeholder="support@contoh.com" className={inputCls} />
        </label>
        <label>
          <span className={labelCls}>WhatsApp dukungan</span>
          <input value={supportWhatsapp} onChange={(e) => setSupportWhatsapp(e.target.value)} placeholder="62812…" className={inputCls} />
        </label>
      </div>

      <h3 className="mt-5 text-xs font-bold tracking-wide text-[#425968] uppercase">Gateway Pembayaran (Duitku)</h3>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <label>
          <span className={labelCls}>Merchant Code</span>
          <input value={merchantCode} onChange={(e) => setMerchantCode(e.target.value)} placeholder="SP###" className={inputCls} />
        </label>
        <label>
          <span className={labelCls}>API Key {initial.duitkuApiKeySet ? "(sudah diisi — kosongkan untuk hapus)" : ""}</span>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={initial.duitkuApiKeySet ? "••••" : "API key Duitku"}
            className={inputCls}
          />
        </label>
        <label>
          <span className={labelCls}>Kode QRIS (opsional)</span>
          <input value={qrisCode} onChange={(e) => setQrisCode(e.target.value)} placeholder="NQ" className={inputCls} />
        </label>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <ToggleRow
          id="sandbox"
          label="Mode Sandbox"
          hint="Aktif = transaksi ke sandbox.duitku.com. Nonaktif = passport.duitku.com (live)."
          checked={sandbox}
          onChange={setSandbox}
        />
        <ToggleRow
          id="force-dummy"
          label="Paksa Mode Dummy"
          hint="Semua pembayaran jadi dummy (QR palsu) — untuk demo/pengembangan."
          checked={forceDummy}
          onChange={setForceDummy}
        />
        <ToggleRow
          id="allow-sim"
          label="Izinkan Simulasi Bayar"
          hint="Tombol 'Tandai Lunas (Simulasi)' muncul di halaman bayar — untuk demo."
          checked={allowSim}
          onChange={setAllowSim}
        />
      </div>

      <h3 className="mt-5 text-xs font-bold tracking-wide text-[#425968] uppercase">Program Reseller</h3>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <label>
          <span className={labelCls}>Harga upgrade reseller (Rp)</span>
          <input
            type="number"
            min={0}
            value={upgradePrice}
            onChange={(e) => setUpgradePrice(e.target.value)}
            className={inputCls}
          />
        </label>
        <div className="flex items-end pb-1">
          <ToggleRow
            id="upgrade-enabled"
            label="Upgrade reseller diaktifkan"
            hint="Tombol upgrade tampil di /dashboard/reseller dan halaman harga."
            checked={upgradeEnabled}
            onChange={setUpgradeEnabled}
          />
        </div>
      </div>

      <h3 className="mt-5 text-xs font-bold tracking-wide text-[#425968] uppercase">Login Google (OAuth)</h3>
      <p className="mt-1 text-[11px] leading-relaxed text-[#687b88]">
        Isi Client ID &amp; Secret dari Google Cloud Console (OAuth 2.0 Web).
        Redirect URI: <code className="rounded bg-[#f1f5f7] px-1">{"{APP_URL}"}/api/auth/callback/google</code>
      </p>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <label>
          <span className={labelCls}>Google Client ID</span>
          <input
            value={googleClientId}
            onChange={(e) => setGoogleClientId(e.target.value)}
            placeholder="….apps.googleusercontent.com"
            className={inputCls}
          />
        </label>
        <label>
          <span className={labelCls}>Google Client Secret {initial.googleClientSecretSet ? "(sudah diisi — kosongkan untuk hapus)" : ""}</span>
          <input
            type="password"
            value={googleClientSecret}
            onChange={(e) => setGoogleClientSecret(e.target.value)}
            placeholder={initial.googleClientSecretSet ? "••••" : "GOCSPX-…"}
            className={inputCls}
          />
        </label>
      </div>

      <h3 className="mt-5 text-xs font-bold tracking-wide text-[#425968] uppercase">Email (Resend)</h3>
      <p className="mt-1 text-[11px] leading-relaxed text-[#687b88]">
        Untuk verifikasi email &amp; reset password. Kosongkan API key untuk fallback <code>.env</code> RESEND_API_KEY.
      </p>
      <div className="mt-2 grid gap-3 sm:grid-cols-3">
        <label>
          <span className={labelCls}>Resend API Key {initial.resendApiKeySet ? "(sudah diisi — kosongkan untuk hapus)" : ""}</span>
          <input
            type="password"
            value={resendApiKey}
            onChange={(e) => setResendApiKey(e.target.value)}
            placeholder={initial.resendApiKeySet ? "••••" : "re_…"}
            className={inputCls}
          />
        </label>
        <label>
          <span className={labelCls}>Nama pengirim</span>
          <input value={emailFromName} onChange={(e) => setEmailFromName(e.target.value)} placeholder="UndanganE" className={inputCls} />
        </label>
        <label>
          <span className={labelCls}>Email pengirim</span>
          <input
            type="email"
            value={emailFromAddress}
            onChange={(e) => setEmailFromAddress(e.target.value)}
            placeholder="noreply@domain.com"
            className={inputCls}
          />
        </label>
      </div>
      <div className="mt-3">
        <ToggleRow
          id="require-email-verif"
          label="Wajibkan verifikasi email"
          hint="Pengguna harus mengklik tautan verifikasi di email sebelum bisa masuk."
          checked={requireEmailVerif}
          onChange={setRequireEmailVerif}
        />
      </div>

      <button
        type="submit"
        disabled={busy}
        className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg bg-teal px-4 text-[11px] font-bold text-white transition-colors hover:bg-teal-dark disabled:opacity-50"
      >
        {busy ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Save className="size-3.5" aria-hidden />}
        Simpan Pengaturan
      </button>

      {msg ? (
        <p
          className={`mt-3 rounded-lg px-3 py-2 text-[11px] font-semibold ${
            msg.tone === "ok" ? "bg-[#e9f8ef] text-[#15803d]" : "bg-[#fff0f2] text-[#be123c]"
          }`}
          role="status"
        >
          {msg.text}
        </p>
      ) : null}
    </form>
  );
}
