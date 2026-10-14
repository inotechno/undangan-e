"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, Loader2, Mail, RefreshCw, XCircle } from "lucide-react";
import { authClient } from "@/auth/client";

type State = "loading" | "ok" | "fail" | "idle";

export function VerifikasiForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [state, setState] = useState<State>(token ? "loading" : "idle");
  const [email, setEmail] = useState("");
  const [resendBusy, setResendBusy] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const verifiedRef = useRef(false);

  const verify = useCallback(async () => {
    if (!token || verifiedRef.current) return;
    verifiedRef.current = true;
    try {
      const { error } = await authClient.verifyEmail({ query: { token } });
      setState(error ? "fail" : "ok");
    } catch {
      setState("fail");
    }
  }, [token]);

  useEffect(() => {
    // Defer agar tidak setState sinkron di effect body (lint rule).
    const t = setTimeout(() => {
      void verify();
    }, 0);
    return () => clearTimeout(t);
  }, [verify]);

  async function resend(e: React.FormEvent) {
    e.preventDefault();
    setResendBusy(true);
    setResendMsg(null);
    try {
      const { error } = await authClient.sendVerificationEmail({
        email: email.trim(),
        callbackURL: "/verifikasi",
      });
      if (error) {
        setResendMsg("Gagal mengirim ulang. Periksa email Anda.");
        return;
      }
      setResendMsg("Email verifikasi dikirim ulang. Cek kotak masuk Anda.");
    } catch {
      setResendMsg("Terjadi kesalahan. Coba lagi.");
    } finally {
      setResendBusy(false);
    }
  }

  if (state === "loading") {
    return (
      <div className="w-full text-center">
        <Loader2 className="mx-auto size-10 animate-spin text-teal" aria-hidden />
        <h1 className="mt-4 text-[26px] font-bold tracking-[-0.04em] text-charcoal">Memverifikasi email…</h1>
        <p className="mt-2 text-[13px] text-muted-warm">Mohon tunggu sebentar.</p>
      </div>
    );
  }

  if (state === "ok") {
    return (
      <div className="w-full text-center">
        <CheckCircle2 className="mx-auto size-12 text-teal" aria-hidden />
        <h1 className="mt-4 text-[26px] font-bold tracking-[-0.04em] text-charcoal">Email terverifikasi!</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-warm">
          Akun Anda sudah aktif. Silakan masuk untuk mulai membuat undangan.
        </p>
        <Link
          href="/masuk"
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-[11px] bg-teal px-5 text-[13px] font-extrabold text-white hover:bg-teal-hover"
        >
          Masuk sekarang
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    );
  }

  if (state === "fail") {
    return (
      <div className="w-full text-center">
        <XCircle className="mx-auto size-12 text-[#be123c]" aria-hidden />
        <h1 className="mt-4 text-[26px] font-bold tracking-[-0.04em] text-charcoal">Verifikasi gagal</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-warm">
          Tautan tidak valid atau sudah kedaluwarsa. Masukkan email Anda untuk mengirim ulang.
        </p>
        <ResendForm email={email} setEmail={setEmail} busy={resendBusy} onSubmit={resend} msg={resendMsg} />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-teal-soft text-teal">
        <Mail className="size-6" aria-hidden />
      </div>
      <h1 className="text-[26px] leading-tight font-bold tracking-[-0.04em] text-charcoal">Verifikasi Email</h1>
      <p className="mt-2 mb-5 text-[13px] leading-relaxed text-muted-warm">
        Masukkan email Anda untuk menerima tautan verifikasi baru.
      </p>
      <ResendForm email={email} setEmail={setEmail} busy={resendBusy} onSubmit={resend} msg={resendMsg} />
    </div>
  );
}

function ResendForm({
  email,
  setEmail,
  busy,
  onSubmit,
  msg,
}: {
  email: string;
  setEmail: (v: string) => void;
  busy: boolean;
  onSubmit: (e: React.FormEvent) => void;
  msg: string | null;
}) {
  return (
    <div className="mt-6 w-full">
      {msg ? (
        <p className="mb-3 rounded-[10px] border border-[#bde3de] bg-teal-soft px-3 py-2.5 text-xs text-[#075e59]" role="status">
          {msg}
        </p>
      ) : null}
      <form onSubmit={onSubmit} noValidate>
        <label htmlFor="verify-email" className="mb-1.5 block text-left text-xs font-bold text-charcoal">
          Email
        </label>
        <input
          id="verify-email"
          type="email"
          required
          placeholder="nama@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-3 h-11 w-full rounded-[10px] border border-[#dce6e7] bg-white px-3.5 text-[13px] text-charcoal placeholder:text-[#9aa8ad] focus-visible:border-teal focus-visible:ring-teal/15"
        />
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[11px] bg-teal text-[13px] font-extrabold text-white shadow-[0_8px_16px_rgba(13,148,136,0.14)] hover:bg-teal-hover disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <RefreshCw className="size-4" aria-hidden />}
          Kirim ulang email verifikasi
        </button>
      </form>
      <p className="mt-4 text-center text-xs text-muted-warm">
        <Link href="/masuk" className="font-bold text-[#087f76] hover:underline">
          Kembali ke Masuk
        </Link>
      </p>
    </div>
  );
}
