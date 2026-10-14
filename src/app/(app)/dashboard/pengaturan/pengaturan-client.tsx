"use client";

import { useState } from "react";
import { KeyRound, Loader2, Save, User } from "lucide-react";

type Props = {
  userName: string;
  userEmail: string;
  isReseller: boolean;
  isAdmin: boolean;
};

const labelCls = "text-[10px] font-bold tracking-wide text-[#687b88] uppercase";
const inputCls =
  "mt-1 h-10 w-full rounded-lg border border-[#e4ebee] bg-white px-3 text-sm outline-none focus-visible:border-teal";

export function PengaturanClient({ userName, userEmail, isReseller, isAdmin }: Props) {
  const [name, setName] = useState(userName);
  const [nameBusy, setNameBusy] = useState(false);
  const [nameMsg, setNameMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setNameMsg({ tone: "err", text: "Nama minimal 2 karakter" });
      return;
    }
    setNameBusy(true);
    setNameMsg(null);
    try {
      const res = await fetch("/api/auth/update-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        setNameMsg({ tone: "err", text: data.message ?? "Gagal memperbarui nama" });
        return;
      }
      setName(trimmed);
      setNameMsg({ tone: "ok", text: "Nama berhasil diperbarui" });
    } catch {
      setNameMsg({ tone: "err", text: "Gagal terhubung ke server" });
    } finally {
      setNameBusy(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPw.length < 8) {
      setPwMsg({ tone: "err", text: "Password baru minimal 8 karakter" });
      return;
    }
    if (newPw !== confirmPw) {
      setPwMsg({ tone: "err", text: "Konfirmasi password tidak cocok" });
      return;
    }
    setPwBusy(true);
    setPwMsg(null);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        setPwMsg({ tone: "err", text: data.message ?? "Gagal mengganti password — periksa password lama" });
        return;
      }
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setPwMsg({ tone: "ok", text: "Password berhasil diganti" });
    } catch {
      setPwMsg({ tone: "err", text: "Gagal terhubung ke server" });
    } finally {
      setPwBusy(false);
    }
  }

  const roleLabel = isAdmin ? "Administrator" : isReseller ? "Reseller" : "Akun Reguler";

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* Info akun */}
      <section className="rounded-xl border border-[#e4ebee] bg-white p-5 shadow-[0_7px_22px_rgba(21,48,65,0.04)]">
        <h2 className="flex items-center gap-1.5 text-[15px] font-bold">
          <User className="size-4 text-teal" aria-hidden />
          Info Akun
        </h2>
        <dl className="mt-3 space-y-2 text-xs">
          <div className="flex justify-between gap-3">
            <dt className="text-[#687b88]">Email</dt>
            <dd className="font-semibold text-[#142c3c]">{userEmail}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[#687b88]">Peran</dt>
            <dd className="font-semibold text-[#142c3c]">{roleLabel}</dd>
          </div>
        </dl>
      </section>

      {/* Ganti nama */}
      <form onSubmit={saveName} className="rounded-xl border border-[#e4ebee] bg-white p-5 shadow-[0_7px_22px_rgba(21,48,65,0.04)]">
        <h2 className="text-[15px] font-bold">Ganti Nama</h2>
        <p className="mt-0.5 text-[11px] text-[#687b88]">Nama tampil di dashboard & undangan Anda.</p>
        <label className="mt-3 block">
          <span className={labelCls}>Nama tampil</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={80} className={inputCls} />
        </label>
        <button
          type="submit"
          disabled={nameBusy}
          className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg bg-teal px-4 text-[11px] font-bold text-white transition-colors hover:bg-teal-dark disabled:opacity-50"
        >
          {nameBusy ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Save className="size-3.5" aria-hidden />}
          Simpan Nama
        </button>
        {nameMsg ? (
          <p className={`mt-3 rounded-lg px-3 py-2 text-[11px] font-semibold ${nameMsg.tone === "ok" ? "bg-[#e9f8ef] text-[#15803d]" : "bg-[#fff0f2] text-[#be123c]"}`} role="status">
            {nameMsg.text}
          </p>
        ) : null}
      </form>

      {/* Ganti password */}
      <form onSubmit={changePassword} className="rounded-xl border border-[#e4ebee] bg-white p-5 shadow-[0_7px_22px_rgba(21,48,65,0.04)] lg:col-span-2">
        <h2 className="flex items-center gap-1.5 text-[15px] font-bold">
          <KeyRound className="size-4 text-teal" aria-hidden />
          Ganti Password
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label>
            <span className={labelCls}>Password saat ini</span>
            <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} required autoComplete="current-password" className={inputCls} />
          </label>
          <label>
            <span className={labelCls}>Password baru</span>
            <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required minLength={8} autoComplete="new-password" className={inputCls} />
          </label>
          <label>
            <span className={labelCls}>Ulangi password baru</span>
            <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required minLength={8} autoComplete="new-password" className={inputCls} />
          </label>
        </div>
        <button
          type="submit"
          disabled={pwBusy}
          className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg bg-teal px-4 text-[11px] font-bold text-white transition-colors hover:bg-teal-dark disabled:opacity-50"
        >
          {pwBusy ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <KeyRound className="size-3.5" aria-hidden />}
          Ganti Password
        </button>
        {pwMsg ? (
          <p className={`mt-3 rounded-lg px-3 py-2 text-[11px] font-semibold ${pwMsg.tone === "ok" ? "bg-[#e9f8ef] text-[#15803d]" : "bg-[#fff0f2] text-[#be123c]"}`} role="status">
            {pwMsg.text}
          </p>
        ) : null}
      </form>
    </div>
  );
}
