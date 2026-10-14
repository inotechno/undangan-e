"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { authClient } from "@/auth/client";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? searchParams.get("verificationToken") ?? "";
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }
    if (password !== confirm) {
      setError("Password tidak sama. Periksa kembali.");
      return;
    }
    if (!token) {
      setError("Token tidak valid atau sudah kedaluwarsa. Minta tautan baru.");
      return;
    }
    setBusy(true);
    try {
      const { error: err } = await authClient.resetPassword({
        newPassword: password,
        token,
      });
      if (err) {
        setError(err.message ?? "Gagal mereset password. Token mungkin kedaluwarsa.");
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/masuk"), 1800);
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="w-full text-center">
        <CheckCircle2 className="mx-auto size-12 text-teal" aria-hidden />
        <h1 className="mt-4 text-[26px] font-bold tracking-[-0.04em] text-charcoal">Password berhasil diubah</h1>
        <p className="mt-2 text-[13px] text-muted-warm">Mengalihkan ke halaman masuk…</p>
        <Link
          href="/masuk"
          className="mt-5 inline-flex h-11 items-center gap-2 rounded-[11px] bg-teal px-5 text-[13px] font-extrabold text-white hover:bg-teal-hover"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Masuk sekarang
        </Link>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="w-full">
        <h1 className="text-[26px] font-bold tracking-[-0.04em] text-charcoal">Tautan tidak valid</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-warm">
          Token reset tidak ditemukan atau sudah kedaluwarsa. Silakan minta tautan baru.
        </p>
        <Link
          href="/lupa-password"
          className="mt-5 inline-flex h-11 items-center gap-2 rounded-[11px] bg-teal px-5 text-[13px] font-extrabold text-white hover:bg-teal-hover"
        >
          Minta tautan baru
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      <p className="mb-2 text-[11px] font-extrabold tracking-[1.5px] text-teal uppercase">Pemulihan akun</p>
      <h1 className="mb-1.5 text-[26px] leading-tight font-bold tracking-[-0.04em] text-charcoal sm:text-[30px]">
        Buat Password Baru
      </h1>
      <p className="mb-5 text-[12px] leading-[1.7] text-muted-warm sm:text-[13px]">
        Pilih password baru yang kuat (min. 8 karakter).
      </p>

      {error ? (
        <p className="mb-3 rounded-[10px] border border-[#fecdd3] bg-[#fff1f2] px-3 py-2.5 text-xs text-[#9f1239]" role="alert">
          {error}
        </p>
      ) : null}

      <form onSubmit={submit} noValidate>
        <label htmlFor="new-password" className="mb-1.5 block text-xs font-bold text-charcoal">
          Password baru
        </label>
        <div className="relative mb-3">
          <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#82949a]" aria-hidden />
          <input
            id="new-password"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            required
            placeholder="Min. 8 karakter"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 w-full rounded-[10px] border border-[#dce6e7] bg-white px-10 pr-11 text-[13px] text-charcoal placeholder:text-[#9aa8ad] focus-visible:border-teal focus-visible:ring-teal/15"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
            className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1.5 text-[#81939a] hover:text-teal"
          >
            {show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
          </button>
        </div>

        <label htmlFor="confirm-password" className="mb-1.5 block text-xs font-bold text-charcoal">
          Konfirmasi password
        </label>
        <div className="relative mb-5">
          <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#82949a]" aria-hidden />
          <input
            id="confirm-password"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            required
            placeholder="Ulangi password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="h-11 w-full rounded-[10px] border border-[#dce6e7] bg-white px-10 text-[13px] text-charcoal placeholder:text-[#9aa8ad] focus-visible:border-teal focus-visible:ring-teal/15"
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[11px] bg-teal text-[13px] font-extrabold text-white shadow-[0_8px_16px_rgba(13,148,136,0.14)] hover:bg-teal-hover disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Simpan Password Baru
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-muted-warm">
        <Link href="/lupa-password" className="font-bold text-[#087f76] hover:underline">
          Minta tautan baru
        </Link>
      </p>
    </div>
  );
}
