"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock, Heart, Loader2, MessageSquareHeart, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GuestContext } from "../types";

/* ── RSVP ────────────────────────────────────────────────── */

export function RsvpForm({
  slug,
  guest,
  mode,
}: {
  slug?: string;
  guest: GuestContext;
  mode: "live" | "preview";
}) {
  const [status, setStatus] = useState<"idle" | "busy" | "done" | "error">(
    guest.rsvp && guest.rsvp !== "pending" ? "done" : "idle",
  );
  const [current, setCurrent] = useState<"attending" | "declined" | null>(
    guest.rsvp && guest.rsvp !== "pending" ? guest.rsvp : null,
  );
  const [msg, setMsg] = useState<string | null>(null);

  async function pick(next: "attending" | "declined") {
    if (status === "busy" || mode === "preview" || !slug) return;
    setStatus("busy");
    setMsg(null);
    try {
      const res = await fetch(`/api/i/${slug}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next, guestCode: guest.code }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMsg(data.error ?? "Gagal mengirim RSVP");
        setStatus("error");
        return;
      }
      setCurrent(next);
      setStatus("done");
    } catch {
      setMsg("Koneksi bermasalah — coba lagi");
      setStatus("error");
    }
  }

  if (mode === "preview" && !slug) {
    return (
      <div className="rounded-[var(--inv-radius)] border p-5 text-center text-xs opacity-70" style={{ borderColor: "var(--inv-accent)" }}>
        Form RSVP aktif pada undangan yang sudah diterbitkan.
      </div>
    );
  }

  return (
    <div
      className="rounded-[var(--inv-radius)] border p-5 text-center"
      style={{ borderColor: "var(--inv-accent)", background: "var(--inv-surface)" }}
    >
      {status === "done" && current ? (
        <div className="space-y-2">
          <p className="flex items-center justify-center gap-2 text-sm font-semibold">
            {current === "attending" ? (
              <>
                <Check className="size-4 text-emerald-500" aria-hidden />
                Anda akan hadir
              </>
            ) : (
              <>
                <X className="size-4 text-rose-400" aria-hidden />
                Maaf, belum bisa hadir
              </>
            )}
          </p>
          <p className="text-xs opacity-70">Terima kasih atas konfirmasinya, {guest.name}.</p>
          <button
            type="button"
            onClick={() => setStatus("idle")}
            className="mt-1 text-[11px] underline opacity-70 hover:opacity-100"
          >
            Ubah jawaban
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm">
            Konfirmasi kehadiran Anda, <span className="font-semibold">{guest.name}</span>
            {guest.quota > 1 ? ` (kuota ${guest.quota} orang)` : ""}.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              disabled={status === "busy"}
              onClick={() => void pick("attending")}
              className="inline-flex h-9 items-center gap-1.5 rounded-full px-5 text-xs font-bold text-white transition-opacity disabled:opacity-50"
              style={{ background: "var(--inv-accent)" }}
            >
              {status === "busy" && current === null ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Heart className="size-3.5" aria-hidden />}
              Insya Allah hadir
            </button>
            <button
              type="button"
              disabled={status === "busy"}
              onClick={() => void pick("declined")}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border px-5 text-xs font-bold transition-opacity disabled:opacity-50"
              style={{ borderColor: "var(--inv-accent)" }}
            >
              Mohon maaf, berhalangan
            </button>
          </div>
          {msg ? <p className="text-[11px] text-rose-500">{msg}</p> : null}
        </div>
      )}
    </div>
  );
}

/* ── Buku tamu ───────────────────────────────────────────── */

export function GuestbookForm({
  slug,
  guest,
  mode,
}: {
  slug?: string;
  guest: GuestContext;
  mode: "live" | "preview";
}) {
  const router = useRouter();
  const [name, setName] = useState(guest.name);
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!slug || mode === "preview") return;
    if (name.trim().length < 2 || message.trim().length < 2) {
      setMsg("Nama dan ucapan minimal 2 karakter");
      setState("error");
      return;
    }
    setState("busy");
    setMsg(null);
    try {
      const res = await fetch(`/api/i/${slug}/guestbook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), message: message.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMsg(data.error ?? "Gagal mengirim ucapan");
        setState("error");
        return;
      }
      setMessage("");
      setState("done");
      router.refresh();
    } catch {
      setMsg("Koneksi bermasalah — coba lagi");
      setState("error");
    }
  }

  if (mode === "preview" && !slug) {
    return (
      <div className="rounded-[var(--inv-radius)] border p-5 text-center text-xs opacity-70" style={{ borderColor: "var(--inv-accent)" }}>
        Form ucapan aktif pada undangan yang sudah diterbitkan.
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-[var(--inv-radius)] border p-5"
      style={{ borderColor: "var(--inv-accent)", background: "var(--inv-surface)" }}
    >
      <label className="block">
        <span className="text-[11px] font-semibold tracking-wide opacity-70">Nama Anda</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          required
          className="mt-1 h-9 w-full rounded-lg border border-current/20 bg-transparent px-3 text-sm outline-none focus-visible:ring-2"
          style={{ borderColor: "color-mix(in srgb, var(--inv-accent) 40%, transparent)" }}
        />
      </label>
      <label className="block">
        <span className="text-[11px] font-semibold tracking-wide opacity-70">Ucapan & doa</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          maxLength={500}
          required
          className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2"
          style={{ borderColor: "color-mix(in srgb, var(--inv-accent) 40%, transparent)" }}
        />
      </label>
      <div className="flex items-center justify-between gap-3">
        <p className={cn("text-[11px]", state === "error" ? "text-rose-500" : "opacity-60")}>
          {msg ?? (state === "done" ? "Ucapan terkirim — terima kasih!" : "Ucapan tampil di undangan dan bisa disembunyikan tuan rumah.")}
        </p>
        <button
          type="submit"
          disabled={state === "busy"}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-5 text-xs font-bold text-white transition-opacity disabled:opacity-50"
          style={{ background: "var(--inv-accent)" }}
        >
          {state === "busy" ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <MessageSquareHeart className="size-3.5" aria-hidden />}
          Kirim Ucapan
        </button>
      </div>
    </form>
  );
}

/* ── Kartu QR tamu ───────────────────────────────────────── */

export function GuestQrCard({ guest }: { guest: GuestContext }) {
  if (!guest.qrPayload) {
    return (
      <div
        className="mx-auto flex size-40 items-center justify-center rounded-[var(--inv-radius)] border"
        style={{ borderColor: "var(--inv-accent)", background: "var(--inv-surface)" }}
      >
        <p className="px-4 text-center text-xs opacity-70">QR untuk {guest.name}</p>
      </div>
    );
  }
  const src = `/api/guest/qr/${encodeURIComponent(guest.qrPayload)}`;
  return (
    <div
      className="mx-auto w-fit space-y-3 rounded-[var(--inv-radius)] border p-5 text-center"
      style={{ borderColor: "var(--inv-accent)", background: "var(--inv-surface)" }}
    >
      <div className="relative mx-auto size-44 overflow-hidden rounded-xl border border-current/10 bg-white p-2">
        {/* eslint-disable-next-line @next/next/no-img-element -- QR dihasilkan server sebagai PNG dinamis */}
        <img src={src} alt={`QR kehadiran ${guest.name}`} className="size-full" />
      </div>
      <div>
        <p className="text-sm font-semibold">{guest.name}</p>
        <p className="mt-0.5 flex items-center justify-center gap-1 text-[11px] opacity-60">
          <Clock className="size-3" aria-hidden />
          Tunjukkan QR ini saat check-in di lokasi acara
        </p>
      </div>
    </div>
  );
}
