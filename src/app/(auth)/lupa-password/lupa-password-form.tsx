"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Loader2, Mail } from "lucide-react";
import { authClient } from "@/auth/client";

export function LupaPasswordForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { error: err } = await authClient.requestPasswordReset({
        email: email.trim(),
        redirectTo: "/reset-password",
      });
      if (err) {
        setError(err.message === "Invalid email" ? "Format email belum valid." : "Gagal mengirim email reset. Coba lagi.");
        return;
      }
      setSent(true);
    } catch {
      setError("Terjadi kesalahan. Periksa koneksi internetmu.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="w-full">
        <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-teal-soft text-teal">
          <Mail className="size-6" aria-hidden />
        </div>
        <h1 className="text-[26px] leading-tight font-bold tracking-[-0.04em] text-charcoal">Cek email Anda</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-warm">
          Jika email <strong className="text-charcoal">{email.trim()}</strong> terdaftar, kami sudah mengirim
          tautan reset password. Periksa kotak masuk (dan folder spam).
        </p>
        <Link
          href="/masuk"
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-[11px] bg-teal px-5 text-[13px] font-extrabold text-white hover:bg-teal-hover"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Kembali ke Masuk
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      <p className="mb-2 text-[11px] font-extrabold tracking-[1.5px] text-teal uppercase">Pemulihan akun</p>
      <h1 className="mb-1.5 text-[26px] leading-tight font-bold tracking-[-0.04em] text-charcoal sm:text-[30px]">
        Lupa Password?
      </h1>
      <p className="mb-5 text-[12px] leading-[1.7] text-muted-warm sm:text-[13px]">
        Masukkan email akun Anda. Kami akan mengirim tautan untuk membuat password baru.
      </p>

      {error ? (
        <p className="mb-3 rounded-[10px] border border-[#fecdd3] bg-[#fff1f2] px-3 py-2.5 text-xs text-[#9f1239]" role="alert">
          {error}
        </p>
      ) : null}

      <form onSubmit={submit} noValidate>
        <label htmlFor="email" className="mb-1.5 block text-xs font-bold text-charcoal">
          Email
        </label>
        <div className="relative mb-4">
          <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#82949a]" aria-hidden />
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 w-full rounded-[10px] border border-[#dce6e7] bg-white px-10 text-[13px] text-charcoal placeholder:text-[#9aa8ad] focus-visible:border-teal focus-visible:ring-teal/15"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[11px] bg-teal text-[13px] font-extrabold text-white shadow-[0_8px_16px_rgba(13,148,136,0.14)] hover:bg-teal-hover disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Kirim Tautan Reset
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-muted-warm">
        Ingat password?{" "}
        <Link href="/masuk" className="font-bold text-[#087f76] hover:underline">
          Masuk
        </Link>
      </p>
    </div>
  );
}
