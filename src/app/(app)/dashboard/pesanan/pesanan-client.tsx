"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ExternalLink, Receipt, Search } from "lucide-react";
import { Pagination, paginate } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { ORDER_KIND_LABEL, ORDER_STATUS_CLASS, ORDER_STATUS_LABEL, formatIdr } from "@/modules/admin/labels";

export type PesananRow = {
  id: string;
  kind: string;
  status: string;
  payableAmountIdr: number;
  invitationId: string | null;
  invitationSlug: string | null;
  invitationTitle: string | null;
  createdAt: string;
  paidAt: string | null;
};

const PER_PAGE = 10;

const FILTERS = [
  { key: "all", label: "Semua" },
  { key: "awaiting_payment", label: "Menunggu Bayar" },
  { key: "created", label: "Dibuat" },
  { key: "paid", label: "Lunas" },
  { key: "expired", label: "Kedaluwarsa" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

const OPEN_STATUSES = new Set(["created", "awaiting_payment", "expired"]);

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export function PesananClient({ items }: { items: PesananRow[] }) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: items.length };
    for (const item of items) {
      map[item.status] = (map[item.status] ?? 0) + 1;
    }
    return map;
  }, [items]);

  const stats = useMemo(
    () => ({
      total: items.length,
      open: items.filter((o) => OPEN_STATUSES.has(o.status)).length,
      paid: counts.paid ?? 0,
    }),
    [items, counts],
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchFilter = filter === "all" || item.status === filter;
      const title = item.invitationTitle ?? "";
      const matchQuery =
        !q || title.toLowerCase().includes(q) || item.id.toLowerCase().includes(q);
      return matchFilter && matchQuery;
    });
  }, [items, filter, search]);

  const totalPages = Math.max(1, Math.ceil(visible.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageItems = paginate(visible, safePage, PER_PAGE);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[25px] font-bold tracking-[-0.7px] text-charcoal">Pesanan & Pembayaran</h1>
        <p className="mt-1.5 text-xs text-muted-warm">
          Riwayat pesanan Anda — lanjutkan pembayaran atau cek status pesanan lunas.
        </p>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        {[
          { label: "Total Pesanan", value: stats.total },
          { label: "Perlu Bayar", value: stats.open, warn: stats.open > 0 },
          { label: "Lunas", value: stats.paid },
        ].map((s) => (
          <article
            key={s.label}
            className="rounded-[15px] border border-border-warm bg-white p-4 shadow-[0_8px_24px_rgba(18,40,59,0.045)]"
          >
            <div className="text-[10px] font-bold tracking-wide text-muted-warm uppercase">{s.label}</div>
            <div
              className={cn(
                "mt-1.5 text-[24px] font-extrabold tracking-[-0.6px]",
                s.warn ? "text-[#a16207]" : "text-charcoal",
              )}
            >
              {s.value.toLocaleString("id-ID")}
            </div>
          </article>
        ))}
      </div>

      <section className="rounded-[15px] border border-border-warm bg-white p-5 shadow-[0_8px_24px_rgba(18,40,59,0.045)]">
        <div className="mb-3.5 flex flex-wrap gap-1.5" role="tablist" aria-label="Filter status pesanan">
          {FILTERS.map((f) => {
            const count = counts[f.key] ?? 0;
            if (f.key !== "all" && count === 0) return null;
            return (
              <button
                key={f.key}
                type="button"
                role="tab"
                aria-selected={filter === f.key}
                onClick={() => {
                  setFilter(f.key);
                  setPage(1);
                }}
                className={cn(
                  "rounded-full px-3 py-2 text-[11px] font-semibold transition-colors",
                  filter === f.key
                    ? "bg-teal text-white"
                    : "border border-transparent bg-[#f3f6f8] text-[#657587] hover:text-charcoal",
                )}
              >
                {f.label} ({count})
              </button>
            );
          })}
        </div>

        <div className="mb-4">
          <div className="relative min-w-[160px] max-w-sm">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-[#8a99a6]"
              aria-hidden
            />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari judul undangan..."
              aria-label="Cari pesanan"
              className="h-9 w-full rounded-lg border border-border-warm bg-white pr-2 pl-8 text-xs text-charcoal outline-none focus-visible:border-teal"
            />
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="py-12 text-center">
            <Receipt className="mx-auto size-8 text-[#c5d0d8]" aria-hidden />
            <p className="mt-3 text-sm text-muted-warm">
              {items.length === 0 ? "Belum ada pesanan." : "Pesanan tidak ditemukan."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#edf1f3]">
                  {["Undangan", "Jenis", "Nominal", "Status", "Tanggal", ""].map((h) => (
                    <th key={h} className="px-2 py-2.5 text-[10px] font-bold tracking-wide text-muted-warm uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageItems.map((o) => {
                  const canPay = OPEN_STATUSES.has(o.status);
                  return (
                    <tr key={o.id} className="border-b border-[#f3f6f8] last:border-0">
                      <td className="px-2 py-2.5">
                        <p className="text-xs font-bold text-charcoal">
                          {o.invitationTitle ?? (o.kind === "reseller_upgrade" ? "Upgrade Reseller" : "Undangan")}
                        </p>
                        <code className="mt-0.5 block max-w-[200px] truncate text-[10px] text-[#8a99a6]">
                          {o.id}
                        </code>
                      </td>
                      <td className="px-2 py-2.5 text-[11px] text-[#536477]">
                        {ORDER_KIND_LABEL[o.kind] ?? o.kind}
                      </td>
                      <td className="px-2 py-2.5 text-[11px] font-bold text-charcoal">
                        {formatIdr(o.payableAmountIdr)}
                      </td>
                      <td className="px-2 py-2.5">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-[3px] text-[10px] font-bold",
                            ORDER_STATUS_CLASS[o.status] ?? "bg-[#f0f3f6] text-[#607080]",
                          )}
                        >
                          {ORDER_STATUS_LABEL[o.status] ?? o.status}
                        </span>
                      </td>
                      <td className="px-2 py-2.5 text-[11px] text-[#536477]">
                        {fmtDate(o.paidAt ?? o.createdAt)}
                      </td>
                      <td className="px-2 py-2.5 text-right">
                        {canPay ? (
                          <Link
                            href={`/bayar/${o.id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-teal px-3 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-teal-hover"
                          >
                            Bayar Sekarang
                          </Link>
                        ) : o.status === "paid" && o.invitationSlug ? (
                          <a
                            href={`/i/${o.invitationSlug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal hover:underline"
                          >
                            Lihat Undangan
                            <ExternalLink className="size-3" aria-hidden />
                          </a>
                        ) : (
                          <span className="text-[10px] text-muted-warm">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {visible.length > 0 ? (
          <div className="mt-4">
            <Pagination
              page={safePage}
              totalPages={totalPages}
              onPageChange={setPage}
              label="halaman pesanan"
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}
