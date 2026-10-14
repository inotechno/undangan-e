"use client";

import { useMemo, useState } from "react";
import { Download, Search, UserCheck } from "lucide-react";

type CheckInRow = {
  id: string;
  invitationId: string;
  invitationTitle: string;
  invitationSlug: string;
  guestId: string;
  guestName: string;
  groupName: string | null;
  rsvp: string;
  checkedInAt: string;
};

type Data = {
  items: CheckInRow[];
  stats: { totalGuests: number; checkedIn: number; attending: number; notCheckedIn: number };
  invitations: { id: string; title: string }[];
};

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-[#e4ebee] bg-white p-4 shadow-[0_7px_22px_rgba(21,48,65,0.04)]">
      <p className="text-[10px] font-bold tracking-wide text-[#687b88] uppercase">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent ? "text-teal" : "text-[#142c3c]"}`}>{value}</p>
    </div>
  );
}

function exportCsv(rows: CheckInRow[]) {
  const header = ["Nama", "Grup", "RSVP", "Undangan", "Waktu Check-in"];
  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [
        r.guestName,
        r.groupName ?? "",
        r.rsvp,
        r.invitationTitle,
        new Date(r.checkedInAt).toLocaleString("id-ID"),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    ),
  ];
  const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `buku-tamu-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function BukuTamuClient({ initial }: { initial: Data }) {
  const [invId, setInvId] = useState("");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return initial.items.filter((r) => {
      if (invId && r.invitationId !== invId) return false;
      if (q) {
        const s = q.toLowerCase();
        if (!r.guestName.toLowerCase().includes(s) && !(r.groupName ?? "").toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [initial.items, invId, q]);

  const rate = initial.stats.totalGuests > 0 ? Math.round((initial.stats.checkedIn / initial.stats.totalGuests) * 100) : 0;

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Tamu" value={initial.stats.totalGuests} />
        <StatCard label="Sudah Check-in" value={initial.stats.checkedIn} accent />
        <StatCard label="Belum Check-in" value={initial.stats.notCheckedIn} />
        <StatCard label="Hadir (RSVP)" value={initial.stats.attending} />
      </div>

      <div className="mb-4 rounded-xl border border-[#e4ebee] bg-white p-3 shadow-[0_7px_22px_rgba(21,48,65,0.04)]">
        <div className="flex items-center gap-2 text-xs font-bold text-[#425968]">
          <UserCheck className="size-4 text-teal" aria-hidden />
          Tingkat kehadiran: <span className="text-teal">{rate}%</span>
          <span className="text-[11px] font-medium text-[#8ca0ae]">
            ({initial.stats.checkedIn}/{initial.stats.totalGuests} tamu)
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e4ebee]">
          <div className="h-full rounded-full bg-teal transition-all" style={{ width: `${rate}%` }} />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          value={invId}
          onChange={(e) => setInvId(e.target.value)}
          className="h-9 rounded-lg border border-[#e4ebee] bg-white px-2.5 text-xs outline-none focus-visible:border-teal"
        >
          <option value="">Semua undangan</option>
          {initial.invitations.map((inv) => (
            <option key={inv.id} value={inv.id}>
              {inv.title}
            </option>
          ))}
        </select>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-[#8ca0ae]" aria-hidden />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama atau grup…"
            className="h-9 w-56 rounded-lg border border-[#e4ebee] bg-white pr-2.5 pl-8 text-xs outline-none focus-visible:border-teal"
          />
        </div>
        <button
          type="button"
          onClick={() => exportCsv(filtered)}
          disabled={filtered.length === 0}
          className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#dbe5e9] bg-white px-3 text-[11px] font-bold text-[#425968] transition-colors hover:border-teal hover:text-teal disabled:opacity-40"
        >
          <Download className="size-3.5" aria-hidden />
          Export CSV ({filtered.length})
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-[#e4ebee] bg-white p-10 text-center">
          <UserCheck className="mx-auto size-8 text-[#cbd5db]" aria-hidden />
          <p className="mt-3 text-xs font-bold text-[#425968]">Belum ada check-in</p>
          <p className="mt-1 text-[11px] text-[#687b88]">Check-in tamu lewat scan QR atau tombol di daftar tamu.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#e4ebee] bg-white shadow-[0_7px_22px_rgba(21,48,65,0.04)]">
          <table className="w-full text-left text-[12px]">
            <thead>
              <tr className="border-b border-[#e4ebee] bg-[#f8fafb] text-[10px] font-bold tracking-wide text-[#687b88] uppercase">
                <th className="px-4 py-2.5">Nama</th>
                <th className="px-4 py-2.5">Grup</th>
                <th className="px-4 py-2.5">RSVP</th>
                <th className="px-4 py-2.5">Undangan</th>
                <th className="px-4 py-2.5">Waktu Check-in</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-[#eef3f5] last:border-0">
                  <td className="px-4 py-2.5 font-semibold text-[#142c3c]">{r.guestName}</td>
                  <td className="px-4 py-2.5 text-[#687b88]">{r.groupName ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        r.rsvp === "attending"
                          ? "bg-[#e9f8ef] text-[#15803d]"
                          : r.rsvp === "declined"
                            ? "bg-[#fff0f2] text-[#be123c]"
                            : "bg-[#f1f5f7] text-[#687b88]"
                      }`}
                    >
                      {r.rsvp === "attending" ? "Hadir" : r.rsvp === "declined" ? "Tidak hadir" : "Menunggu"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-[#425968]">{r.invitationTitle}</td>
                  <td className="px-4 py-2.5 text-[#687b88]">
                    {new Date(r.checkedInAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
