"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, MessageSquare, Trash2 } from "lucide-react";
import type { AllWishRow } from "@/modules/guests/wishes";

type Data = {
  items: AllWishRow[];
  visible: number;
  hidden: number;
  total: number;
};

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[#e4ebee] bg-white p-4 shadow-[0_7px_22px_rgba(21,48,65,0.04)]">
      <p className="text-[10px] font-bold tracking-wide text-[#687b88] uppercase">{label}</p>
      <p className="mt-1 text-2xl font-bold text-[#142c3c]">{value}</p>
    </div>
  );
}

export function UcapanClient({ initial }: { initial: Data }) {
  const [data, setData] = useState(initial);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "visible" | "hidden">("all");

  const filtered = data.items.filter((w) => filter === "all" || w.status === filter);

  async function toggleStatus(w: AllWishRow) {
    setBusyId(w.id);
    try {
      const next = w.status === "visible" ? "hidden" : "visible";
      const res = await fetch("/api/ucapan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wishId: w.id, status: next }),
      });
      if (!res.ok) return;
      setData((d) => ({
        ...d,
        items: d.items.map((x) => (x.id === w.id ? { ...x, status: next } : x)),
        visible: d.visible + (next === "visible" ? 1 : -1),
        hidden: d.hidden + (next === "hidden" ? 1 : -1),
      }));
    } finally {
      setBusyId(null);
    }
  }

  async function remove(w: AllWishRow) {
    if (!confirm(`Hapus ucapan dari "${w.name}"? Tidak bisa dibatalkan.`)) return;
    setBusyId(w.id);
    try {
      const res = await fetch("/api/ucapan", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wishId: w.id }),
      });
      if (!res.ok) return;
      setData((d) => ({
        ...d,
        items: d.items.filter((x) => x.id !== w.id),
        total: d.total - 1,
        visible: w.status === "visible" ? d.visible - 1 : d.visible,
        hidden: w.status === "hidden" ? d.hidden - 1 : d.hidden,
      }));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="mb-4 grid grid-cols-3 gap-3">
        <StatCard label="Total" value={data.total} />
        <StatCard label="Terlihat" value={data.visible} />
        <StatCard label="Disembunyikan" value={data.hidden} />
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {(["all", "visible", "hidden"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`h-8 rounded-full border px-3 text-[11px] font-bold transition-colors ${
              filter === f
                ? "border-teal bg-teal text-white"
                : "border-[#dbe5e9] bg-white text-[#425968] hover:border-teal hover:text-teal"
            }`}
          >
            {f === "all" ? "Semua" : f === "visible" ? "Terlihat" : "Disembunyikan"}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-[#e4ebee] bg-white p-10 text-center">
          <MessageSquare className="mx-auto size-8 text-[#cbd5db]" aria-hidden />
          <p className="mt-3 text-xs font-bold text-[#425968]">Belum ada ucapan</p>
          <p className="mt-1 text-[11px] text-[#687b88]">Ucapan dari tamu akan muncul di sini.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((w) => (
            <li
              key={w.id}
              className="flex items-start gap-3 rounded-xl border border-[#e4ebee] bg-white p-4 shadow-[0_7px_22px_rgba(21,48,65,0.04)]"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-[#142c3c]">{w.name}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      w.status === "visible" ? "bg-[#e9f8ef] text-[#15803d]" : "bg-[#f1f5f7] text-[#687b88]"
                    }`}
                  >
                    {w.status === "visible" ? "Terlihat" : "Disembunyikan"}
                  </span>
                  <Link
                    href={`/i/${w.invitationSlug}`}
                    target="_blank"
                    className="text-[10px] font-semibold text-teal underline-offset-2 hover:underline"
                  >
                    {w.invitationTitle}
                  </Link>
                </div>
                <p className="mt-1.5 text-[12px] leading-relaxed text-[#425968]">{w.message}</p>
                <p className="mt-1 text-[10px] text-[#8ca0ae]">
                  {new Date(w.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => toggleStatus(w)}
                  disabled={busyId === w.id}
                  title={w.status === "visible" ? "Sembunyikan" : "Tampilkan"}
                  className="inline-flex size-8 items-center justify-center rounded-lg border border-[#dbe5e9] text-[#425968] transition-colors hover:border-teal hover:text-teal disabled:opacity-40"
                >
                  {busyId === w.id ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  ) : w.status === "visible" ? (
                    <EyeOff className="size-3.5" aria-hidden />
                  ) : (
                    <Eye className="size-3.5" aria-hidden />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => remove(w)}
                  disabled={busyId === w.id}
                  title="Hapus"
                  className="inline-flex size-8 items-center justify-center rounded-lg border border-[#dbe5e9] text-[#be123c] transition-colors hover:border-[#be123c] disabled:opacity-40"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
