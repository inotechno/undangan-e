"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient, useSession } from "@/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Info,
  Loader2,
  Lock,
  Mail,
  MessageCircle,
  Phone,
  RefreshCw,
  ShieldCheck,
  User,
} from "lucide-react";

type AlertState = { tone: "error" | "success" | "info"; message: string } | null;

type AuthMode = "masuk" | "daftar";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+0-9()\-\s]{8,20}$/;

const ERROR_MESSAGES: Record<string, string> = {
  "Invalid email or password": "Email atau password salah.",
  "User already exists": "Email sudah terdaftar.",
  "Invalid email": "Format email belum valid.",
  "Password must be at least 8 characters": "Password minimal 8 karakter.",
  "Too many requests. Please try again later.":
    "Terlalu banyak percobaan. Coba lagi beberapa saat lagi.",
  "Email not verified": "Email Anda belum diverifikasi.",
};

function humanize(message?: string | null) {
  if (!message) return "Terjadi kesalahan. Coba lagi.";
  return ERROR_MESSAGES[message] ?? "Terjadi kesalahan. Coba lagi.";
}

function scorePassword(value: string) {
  let score = 0;
  if (value.length >= 8) score++;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  return score;
}

/** Halaman tujuan setelah login: admin → console admin, lainnya → dashboard. */
async function fetchHomePath(): Promise<string> {
  try {
    const res = await fetch("/api/me");
    if (!res.ok) return "/dashboard";
    const data = (await res.json()) as { isAdmin?: boolean };
    return data.isAdmin ? "/admin" : "/dashboard";
  } catch {
    return "/dashboard";
  }
}

const ALERT_STYLES = {
  error: "border-[#fecdd3] bg-[#fff1f2] text-[#9f1239]",
  success: "border-[#bce8ce] bg-[#eaf8f1] text-[#166534]",
  info: "border-[#bde3de] bg-teal-soft text-[#075e59]",
} as const;

function AlertBox({ alert }: { alert: AlertState }) {
  if (!alert) return null;
  const Icon = alert.tone === "error" ? AlertCircle : alert.tone === "success" ? CheckCircle2 : Info;
  return (
    <p
      role="status"
      aria-live="polite"
      className={cn(
        "mb-3 flex items-start gap-2 rounded-[10px] border px-3 py-2.5 text-xs leading-relaxed",
        ALERT_STYLES[alert.tone]
      )}
    >
      <Icon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      {alert.message}
    </p>
  );
}

function FieldHead({
  htmlFor,
  label,
  aside,
}: {
  htmlFor: string;
  label: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div className="mb-1.5 flex items-center justify-between gap-2.5">
      <Label htmlFor={htmlFor} className="text-xs font-bold text-charcoal">
        {label}
      </Label>
      {aside}
    </div>
  );
}

function LeadingIcon({ icon: Icon }: { icon: typeof Mail }) {
  return (
    <Icon
      className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#82949a]"
      aria-hidden
    />
  );
}

function TogglePassword({
  show,
  onClick,
  label,
}: {
  show: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1.5 text-[#81939a] transition-colors hover:text-teal"
    >
      {show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
    </button>
  );
}

const inputClass =
  "h-11 rounded-[10px] border-[#dce6e7] bg-white px-10 text-[13px] text-charcoal placeholder:text-[#9aa8ad] focus-visible:border-teal focus-visible:ring-teal/15";

const submitClass =
  "h-11 w-full rounded-[11px] bg-teal text-[13px] font-extrabold text-white shadow-[0_8px_16px_rgba(13,148,136,0.14)] hover:bg-teal-hover";

const FIT_SHORT = "[@media(max-height:800px)]:hidden";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const isRegister = mode === "daftar";

  const identityRef = useRef<HTMLInputElement>(null);
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [identity, setIdentity] = useState(searchParams.get("email") ?? "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [remember, setRemember] = useState(true);
  const [terms, setTerms] = useState(false);
  const [alert, setAlert] = useState<AlertState>(null);
  const [loading, setLoading] = useState(false);
  // State setelah daftar sukses — tampilkan panel info + tombol kirim ulang.
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [resendBusy, setResendBusy] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  // Alert dari redirect (mis. login gagal karena email belum verified).
  useEffect(() => {
    const a = searchParams.get("alert");
    if (!a) return;
    // Defer agar tidak setState sinkron di effect body (lint rule).
    const t = setTimeout(() => {
      if (a === "notverified") {
        setAlert({
          tone: "error",
          message: "Email Anda belum diverifikasi. Kami mengirim tautan verifikasi — cek email Anda, atau kirim ulang di bawah.",
        });
      } else if (a === "exists") {
        setAlert({
          tone: "info",
          message: "Email ini sudah terdaftar tetapi belum diverifikasi. Silakan cek email untuk verifikasi, atau kirim ulang.",
        });
      }
    }, 0);
    return () => clearTimeout(t);
  }, [searchParams]);

  useEffect(() => {
    // Sudah masuk (mis. buka /masuk lagi) → ke halaman sesuai role.
    if (!session) return;
    let cancelled = false;
    void fetchHomePath().then((path) => {
      if (!cancelled) router.replace(path);
    });
    return () => {
      cancelled = true;
    };
  }, [session, router]);

  function switchMethod(next: "email" | "phone") {
    if (next === method) return;
    setMethod(next);
    setIdentity("");
    setAlert(null);
    identityRef.current?.focus();
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAlert(null);

    const value = identity.trim();
    if (!value) {
      setAlert({
        tone: "error",
        message: `Mohon isi ${method === "email" ? "email" : "nomor WhatsApp"} terlebih dahulu.`,
      });
      return;
    }
    if (method === "email" && !EMAIL_RE.test(value)) {
      setAlert({ tone: "error", message: "Format email belum valid. Periksa kembali email Anda." });
      return;
    }
    if (method === "phone" && !PHONE_RE.test(value)) {
      setAlert({ tone: "error", message: "Masukkan nomor WhatsApp yang valid." });
      return;
    }
    if (password.length < 8) {
      setAlert({ tone: "error", message: "Password minimal 8 karakter." });
      return;
    }
    if (method === "phone") {
      setAlert({
        tone: "info",
        message:
          "Login WhatsApp segera hadir. Silakan gunakan Email untuk masuk ke akun Anda.",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await authClient.signIn.email({
        email: value,
        password,
        rememberMe: remember,
      });
      if (result.error) {
        // Email terdaftar tapi belum verified → redirect ke /verifikasi dengan email terisi.
        if (result.error.code === "EMAIL_NOT_VERIFIED" || result.error.message === "Email not verified") {
          router.push(`/masuk?email=${encodeURIComponent(value)}&alert=notverified`);
          router.refresh();
          return;
        }
        setAlert({ tone: "error", message: humanize(result.error.message) });
        return;
      }
      const home = await fetchHomePath();
      setAlert({
        tone: "success",
        message:
          home === "/admin"
            ? "Berhasil masuk! Mengalihkan ke console admin..."
            : "Berhasil masuk! Mengalihkan ke dashboard...",
      });
      router.push(home);
      router.refresh();
    } catch {
      setAlert({ tone: "error", message: "Terjadi kesalahan. Periksa koneksi internetmu." });
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setAlert(null);

    if (name.trim().length < 2) {
      setAlert({ tone: "error", message: "Masukkan nama lengkap Anda (min. 2 karakter)." });
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setAlert({ tone: "error", message: "Format email belum valid. Periksa kembali email Anda." });
      return;
    }
    if (phone.trim() && !PHONE_RE.test(phone.trim())) {
      setAlert({ tone: "error", message: "Masukkan nomor WhatsApp yang valid." });
      return;
    }
    if (password.length < 8) {
      setAlert({ tone: "error", message: "Password minimal 8 karakter." });
      return;
    }
    if (password !== confirm) {
      setAlert({ tone: "error", message: "Password tidak sama. Periksa kembali." });
      return;
    }
    if (!terms) {
      setAlert({
        tone: "error",
        message: "Anda perlu menyetujui Syarat & Ketentuan dan Kebijakan Privasi.",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await authClient.signUp.email({
        name: name.trim(),
        email: email.trim(),
        password,
        ...(phone.trim() ? { phone: phone.trim() } : {}),
        callbackURL: "/verifikasi",
      });
      if (result.error) {
        // Email sudah terdaftar tapi belum verified → redirect ke /verifikasi.
        if (result.error.message === "User already exists") {
          router.push(`/daftar?email=${encodeURIComponent(email.trim())}&alert=exists`);
          router.refresh();
          return;
        }
        setAlert({ tone: "error", message: humanize(result.error.message) });
        return;
      }
      // Sukses — tampilkan panel info + tombol kirim ulang (tanpa form penuh).
      setRegisteredEmail(email.trim());
      setAlert(null);
    } catch {
      setAlert({ tone: "error", message: "Terjadi kesalahan. Periksa koneksi internetmu." });
    } finally {
      setLoading(false);
    }
  }

  async function handleResendVerification(e?: React.FormEvent) {
    e?.preventDefault();
    if (!registeredEmail) return;
    setResendBusy(true);
    setResendMsg(null);
    try {
      const { error } = await authClient.sendVerificationEmail({
        email: registeredEmail,
        callbackURL: "/verifikasi",
      });
      if (error) {
        setResendMsg("Gagal mengirim ulang. Coba lagi beberapa saat.");
        return;
      }
      setResendMsg("Email verifikasi dikirim ulang. Cek kotak masuk (dan folder spam).");
    } catch {
      setResendMsg("Terjadi kesalahan. Coba lagi.");
    } finally {
      setResendBusy(false);
    }
  }

  async function handleGoogle() {
    setAlert(null);
    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
      if (result.error) {
        setAlert({ tone: "error", message: humanize(result.error.message) });
      }
    } catch {
      setAlert({ tone: "error", message: "Gagal masuk dengan Google. Coba lagi." });
    }
  }

  function handleApple() {
    setAlert({ tone: "info", message: "Login Apple belum tersedia. Gunakan Google atau email." });
  }

  const passwordScore = scorePassword(password);
  const meterColor =
    passwordScore <= 1 ? "#e7a23b" : passwordScore === 2 ? "#0d9488" : "#15803d";
  const strengthLabel = !password
    ? "Gunakan password yang kuat"
    : passwordScore <= 1
      ? "Lemah"
      : passwordScore === 2
        ? "Cukup kuat"
        : "Kuat";

  return (
    <div>
      <p className="mb-2 text-[11px] font-extrabold tracking-[1.5px] text-teal uppercase">
        {isRegister ? "Pendaftaran akun" : "Akun UndanganE"}
      </p>
      <h1 className="mb-1.5 text-[26px] leading-tight font-bold tracking-[-0.04em] text-charcoal sm:text-[30px]">
        {isRegister ? "Daftar Gratis" : "Masuk ke Akun Anda"}
      </h1>
      <p className="mb-3 text-[12px] leading-[1.7] text-muted-warm sm:mb-4 sm:text-[13px] [@media(max-height:860px)]:hidden">
        {isRegister
          ? "Bergabung dan mulai buat undangan digital untuk momen spesial Anda."
          : "Lanjutkan perjalanan membuat undangan digital yang berkesan."}
      </p>

      <AlertBox alert={alert} />

      {/* Panel sukses setelah daftar — tanpa form, hanya info + kirim ulang. */}
      {isRegister && registeredEmail ? (
        <div className="rounded-[14px] border border-[#bce8ce] bg-[#eaf8f1] p-6 text-center">
          <CheckCircle2 className="mx-auto size-12 text-teal" aria-hidden />
          <h2 className="mt-4 text-[22px] font-bold tracking-[-0.03em] text-charcoal">
            Akun berhasil dibuat!
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-warm">
            Email verifikasi sudah dikirim ke{" "}
            <strong className="text-charcoal">{registeredEmail}</strong>.
            <br />
            Cek kotak masuk (dan folder spam) lalu klik tautan verifikasi.
          </p>

          {resendMsg ? (
            <p
              className="mt-4 rounded-[10px] border border-[#bde3de] bg-white px-3 py-2.5 text-xs text-[#075e59]"
              role="status"
            >
              {resendMsg}
            </p>
          ) : null}

          <div className="mt-5 flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => void handleResendVerification()}
              disabled={resendBusy}
              className="inline-flex h-11 items-center gap-2 rounded-[11px] bg-teal px-5 text-[13px] font-extrabold text-white shadow-[0_8px_16px_rgba(13,148,136,0.14)] hover:bg-teal-hover disabled:opacity-50"
            >
              {resendBusy ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <RefreshCw className="size-4" aria-hidden />
              )}
              Kirim ulang email verifikasi
            </button>
            <Link
              href="/masuk"
              className="text-xs font-bold text-[#087f76] hover:underline"
            >
              Sudah verifikasi? Masuk sekarang →
            </Link>
          </div>
        </div>
      ) : isRegister ? (
        <form onSubmit={handleRegister} noValidate className="grid gap-x-3 gap-y-1 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FieldHead htmlFor="name" label="Nama lengkap" />
            <div className="relative mb-1">
              <LeadingIcon icon={User} />
              <Input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Masukkan nama lengkap"
                className={inputClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <FieldHead htmlFor="email" label="Email" />
            <div className="relative mb-1">
              <LeadingIcon icon={Mail} />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="nama@email.com"
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="sm:col-span-2 [@media(max-height:760px)]:hidden">
            <FieldHead
              htmlFor="phone"
              label={
                <>
                  Nomor WhatsApp{" "}
                  <span className="font-medium text-[#8b9a9f]">(opsional)</span>
                </>
              }
            />
            <div className="relative">
              <LeadingIcon icon={Phone} />
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                placeholder="08xxxxxxxxxx"
                className={inputClass}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <p className="mt-1 text-[10px] text-[#8b9a9f] [@media(max-height:860px)]:hidden">
              Digunakan untuk informasi akun jika diperlukan.
            </p>
          </div>

          <div>
            <FieldHead htmlFor="password" label="Password" />
            <div className="relative">
              <LeadingIcon icon={Lock} />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Min. 8 karakter"
                className={cn(inputClass, "pr-11")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <TogglePassword
                show={showPassword}
                onClick={() => setShowPassword((v) => !v)}
                label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              />
            </div>
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[#e8eeee]">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${passwordScore * 25}%`,
                  backgroundColor: meterColor,
                }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[10px]">
              <span style={{ color: meterColor }} className="font-semibold">
                {strengthLabel}
              </span>
              <span className="text-[#8b9a9f]">{Math.min(password.length, 8)}/8</span>
            </div>
          </div>

          <div>
            <FieldHead htmlFor="confirm" label="Konfirmasi password" />
            <div className="relative">
              <LeadingIcon icon={Lock} />
              <Input
                id="confirm"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Ulangi password"
                className={cn(inputClass, "pr-11")}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
              <TogglePassword
                show={showConfirm}
                onClick={() => setShowConfirm((v) => !v)}
                label={showConfirm ? "Sembunyikan konfirmasi password" : "Tampilkan konfirmasi password"}
              />
            </div>
          </div>

          <label className="mt-1 flex cursor-pointer items-start gap-2.5 text-[10px] leading-relaxed text-muted-warm sm:col-span-2">
            <input
              type="checkbox"
              className="mt-0.5 size-3.5 shrink-0 accent-teal"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
            />
            <span>
              Saya menyetujui{" "}
              <Link href="/faq#syarat" className="font-bold text-[#087f76] hover:underline">
                Syarat &amp; Ketentuan
              </Link>{" "}
              dan{" "}
              <Link href="/faq#privasi" className="font-bold text-[#087f76] hover:underline">
                Kebijakan Privasi
              </Link>{" "}
              UndanganE.
            </span>
          </label>

          <Button type="submit" disabled={loading} className={cn(submitClass, "mt-1 sm:col-span-2")}>
            {loading ? (
              <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />
            ) : null}
            Buat Akun Gratis
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        </form>
      ) : (
        <>
          <div
            role="tablist"
            aria-label="Metode masuk"
            className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-[#f3f6f6] p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={method === "email"}
              onClick={() => switchMethod("email")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-[9px] border px-2 py-2 text-[11px] font-bold transition sm:py-2.5 sm:text-xs",
                method === "email"
                  ? "border-[#bde3de] bg-white text-[#075e59] shadow-[0_2px_7px_rgba(23,61,59,0.04)]"
                  : "border-transparent text-[#687b84] hover:text-charcoal"
              )}
            >
              <Mail className="size-3.5" aria-hidden />
              Email
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={method === "phone"}
              onClick={() => switchMethod("phone")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-[9px] border px-2 py-2 text-[11px] font-bold transition sm:py-2.5 sm:text-xs",
                method === "phone"
                  ? "border-[#bde3de] bg-white text-[#075e59] shadow-[0_2px_7px_rgba(23,61,59,0.04)]"
                  : "border-transparent text-[#687b84] hover:text-charcoal"
              )}
            >
              <MessageCircle className="size-3.5" aria-hidden />
              Nomor WhatsApp
            </button>
          </div>

          <form onSubmit={handleLogin} noValidate>
            <div className="mb-4">
              <FieldHead htmlFor="identity" label={method === "email" ? "Email" : "Nomor WhatsApp"} />
              <div className="relative">
                <LeadingIcon icon={method === "email" ? Mail : Phone} />
                <Input
                  id="identity"
                  ref={identityRef}
                  type={method === "email" ? "email" : "tel"}
                  autoComplete={method === "email" ? "username" : "tel"}
                  placeholder={method === "email" ? "nama@email.com" : "08xxxxxxxxxx"}
                  className={inputClass}
                  value={identity}
                  onChange={(e) => setIdentity(e.target.value)}
                />
              </div>
            </div>

            <div className="mb-3">
              <FieldHead
                htmlFor="password"
                label="Password"
                aside={
                  <Link
                    href="/lupa-password"
                    className="text-[11px] font-bold text-[#087f76] hover:underline"
                  >
                    Lupa password?
                  </Link>
                }
              />
              <div className="relative">
                <LeadingIcon icon={Lock} />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Masukkan password"
                  className={cn(inputClass, "pr-11")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <TogglePassword
                  show={showPassword}
                  onClick={() => setShowPassword((v) => !v)}
                  label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                />
              </div>
            </div>

            <div className="mb-4 flex items-center justify-between gap-3 text-[11px] text-muted-warm">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  className="size-3.5 accent-teal"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Ingat saya
              </label>
              <Link href="/panduan#kontak" className="font-bold text-[#087f76] hover:underline">
                Butuh bantuan?
              </Link>
            </div>

            <Button type="submit" disabled={loading} className={submitClass}>
              {loading ? (
                <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />
              ) : null}
              Masuk
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          </form>
        </>
      )}

      <div
        className={cn(
          "my-2.5 flex items-center gap-3 text-[11px] text-[#8b9a9f] sm:my-3",
          isRegister && FIT_SHORT
        )}
      >
        <span className="h-px flex-1 bg-[#e3ebeb]" aria-hidden />
        {isRegister ? "atau daftar dengan" : "atau masuk dengan"}
        <span className="h-px flex-1 bg-[#e3ebeb]" aria-hidden />
      </div>

      <div className={cn("grid grid-cols-2 gap-2.5", isRegister && FIT_SHORT)}>
        <button
          type="button"
          onClick={handleGoogle}
          className="flex h-10 items-center justify-center gap-2.5 rounded-[10px] border border-[#dfe7e8] bg-white text-xs font-bold text-charcoal transition-colors hover:border-[#b9dcd7]"
        >
          <span className="text-[17px] leading-none font-black text-[#4285f4]" aria-hidden>
            G
          </span>
          Google
        </button>
        <button
          type="button"
          onClick={handleApple}
          className="flex h-10 items-center justify-center gap-2.5 rounded-[10px] border border-[#dfe7e8] bg-white text-xs font-bold text-charcoal transition-colors hover:border-[#b9dcd7]"
        >
          <svg viewBox="0 0 24 24" className="size-4 fill-charcoal" aria-hidden>
            <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.03 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
          </svg>
          Apple
        </button>
      </div>

      <p className="mt-3 text-center text-xs text-muted-warm [@media(max-height:760px)]:hidden">
        {isRegister ? (
          <>
            Sudah punya akun?{" "}
            <Link href="/masuk" className="font-bold text-[#087f76] hover:underline">
              Masuk
            </Link>
          </>
        ) : (
          <>
            Belum punya akun?{" "}
            <Link href="/daftar" className="font-bold text-[#087f76] hover:underline">
              Daftar gratis
            </Link>
          </>
        )}
      </p>

      <p className="mt-3 flex items-center justify-center gap-2 text-[10px] text-[#7d8e94] [@media(max-height:860px)]:hidden">
        <ShieldCheck className="size-3.5 text-teal" aria-hidden />
        {isRegister ? "Data Anda dijaga dengan aman" : "Data akun Anda dilindungi dengan aman"}
      </p>
    </div>
  );
}
