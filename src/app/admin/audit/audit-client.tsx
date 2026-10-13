"use client";

import { useMemo, useState } from "react";
import { Pagination, paginate } from "@/components/ui/pagination";
import { formatDateTime, type AdminAuditRow } from "@/modules/admin/labels";

const PER_PAGE = 20;

export function AdminAuditClient({ rows }: { rows: AdminAuditRow[] }) {
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);

  const actions = useMemo(() => [...new Set(rows.map((r) => r.action))].sort(), [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const matchQ =
        !q ||
        r.action.toLowerCase().includes(q) ||
        r.entity.toLowerCase().includes(q) ||
        r.actorName.toLowerCase().includes(q) ||
        (r.entityId ?? "").toLowerCase().includes(q);
      const matchAction = !action || r.action === action;
      return matchQ && matchAction;
    });
  }, [rows, query, action]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const visible = paginate(filtered, safePage, PER_PAGE);

  return (
    <section className="rounded-xl border border-[#e4ebee] bg-white p-5 shadow-[0_7px_22px_rgba(21,48,65,0.04)]">
      <div className="mb-4 flex flex-wrap gap-2">
        <input
          type="search"
          value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Cari aktor, aksi, atau resource..."
          aria-label="Cari audit log"
          className="h-9 min-w-[180px] flex-1 rounded-lg border border-[#e4ebee] bg-white px-2.5 text-xs outline-none focus-visible:border-teal"
        />
        <select
          value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
            aria-label="Filter aksi"
          className="h-9 rounded-lg border border-[#e4ebee] bg-white px-2.5 text-xs outline-none focus-visible:border-teal"
        >
          <option value="">Semua aksi</option>
          {actions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-2.5">
        {visible.map((r) => (
          <article key={r.id} className="rounded-xl border border-[#e4ebee] bg-[#fafcfc] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <code className="rounded bg-[#f0f4f5] px-1.5 py-0.5 text-[10px] text-[#142c3c]">
                  {r.action}
                </code>
                <span className="text-[11px] text-[#425968]">{r.actorName}</span>
              </div>
              <span className="shrink-0 text-[10px] whitespace-nowrap text-[#9aabb7]">
                {formatDateTime(new Date(r.createdAt))}
              </span>
            </div>
            <div className="mt-3 grid gap-x-4 gap-y-2 border-t border-[#eef2f4] pt-3 sm:grid-cols-2">
              <div>
                <div className="text-[9px] font-bold tracking-wide text-[#9aabb7] uppercase">
                  Resource
                </div>
                <div className="mt-0.5 text-[11px] text-[#425968]">
                  {r.entity}
                  {r.entityId ? ` #${r.entityId.slice(0, 8)}` : ""}
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-[9px] font-bold tracking-wide text-[#9aabb7] uppercase">
                  Ringkasan
                </div>
                <div className="mt-0.5 truncate text-[11px] text-[#687b88]">
                  {Object.keys(r.meta).length > 0 ? JSON.stringify(r.meta) : "—"}
                </div>
              </div>
            </div>
          </article>
        ))}
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-[11px] text-[#687b88]">Tidak ada log yang sesuai.</div>
        ) : null}
      </div>

      {filtered.length > 0 ? (
        <p className="mt-3 text-center text-[10px] text-[#9aabb7]">
          Menampilkan {visible.length} dari {filtered.length} log
        </p>
      ) : null}
      <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} label="Navigasi halaman audit" />
    </section>
  );
}
