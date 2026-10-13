"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminConfirmDialog } from "@/components/admin/confirm-dialog";
import { Pagination, paginate } from "@/components/ui/pagination";
import {
  formatIdr,
  ORDER_KIND_LABEL,
  ORDER_STATUS_CLASS,
  ORDER_STATUS_LABEL,
  type AdminOrderRow,
} from "@/modules/admin/labels";
import { cn } from "@/lib/utils";

const PER_PAGE = 12;

export function AdminOrdersClient({
  orders,
  stats,
}: {
  orders: AdminOrderRow[];
  stats: { paid: number; revenue: number; awaiting: number; upgrade: number };
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState<AdminOrderRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      const matchQ =
        !q ||
        o.id.toLowerCase().includes(q) ||
        o.ownerName.toLowerCase().includes(q) ||
        o.ownerEmail.toLowerCase().includes(q);
      const matchKind = !kind || o.kind === kind;
      const matchStatus = !status || o.status === status;
      return matchQ && matchKind && matchStatus;
    });
  }, [orders, query, kind, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const visible = paginate(filtered, safePage, PER_PAGE);

  async function cancelOrder(reason: string) {
    if (!pending) return;
    setBusy(true);
    setDialogError(null);
    try {
      const res = await fetch(`/api/admin/orders/${pending.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", reason }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setDialogError(data.error ?? "Gagal membatalkan order");
        return;
      }
      setPending(null);
      router.refresh();
    } catch {
      setDialogError("Koneksi gagal, coba lagi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Order Lunas", value: stats.paid, note: "Terkonfirmasi webhook" },
          { label: "Pendapatan", value: formatIdr(stats.revenue), note: "Total final amount" },
          { label: "Menunggu Bayar", value: stats.awaiting, note: "Perlu dipantau" },
          { label: "Upgrade Reseller", value: stats.upgrade, note: "Order paid" },
        ].map((s) => (
          <article
            key={s.label}
            className="rounded-xl border border-[#e4ebee] bg-white p-4 shadow-[0_7px_22px_rgba(21,48,65,0.04)]"
          >
            <div className="text-[10px] font-bold tracking-wide text-[#687b88] uppercase">{s.label}</div>
            <div className="mt-1.5 text-[23px] font-extrabold tracking-[-0.6px]">{s.value}</div>
            <div className="mt-1 text-[10px] text-[#687b88]">{s.note}</div>
          </article>
        ))}
      </div>

      <section className="rounded-xl border border-[#e4ebee] bg-white p-5 shadow-[0_7px_22px_rgba(21,48,65,0.04)]">
        <div className="mb-4 flex flex-wrap gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Cari ID order atau pengguna..."
            aria-label="Cari order"
            className="h-9 min-w-[180px] flex-1 rounded-lg border border-[#e4ebee] bg-white px-2.5 text-xs outline-none focus-visible:border-teal"
          />
          <select
            value={kind}
            onChange={(e) => {
              setKind(e.target.value);
              setPage(1);
            }}
            aria-label="Filter jenis"
            className="h-9 rounded-lg border border-[#e4ebee] bg-white px-2.5 text-xs outline-none focus-visible:border-teal"
          >
            <option value="">Semua jenis order</option>
            <option value="invitation">Publikasi</option>
            <option value="reseller_upgrade">Upgrade reseller</option>
          </select>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            aria-label="Filter status"
            className="h-9 rounded-lg border border-[#e4ebee] bg-white px-2.5 text-xs outline-none focus-visible:border-teal"
          >
            <option value="">Semua status</option>
            <option value="paid">Lunas</option>
            <option value="awaiting_payment">Menunggu Bayar</option>
            <option value="created">Dibuat</option>
            <option value="cancelled">Dibatalkan</option>
            <option value="expired">Kedaluwarsa</option>
            <option value="refunded">Refund</option>
          </select>
        </div>

        <div className="grid gap-2.5">
          {visible.map((o) => (
            <article key={o.id} className="rounded-xl border border-[#e4ebee] bg-[#fafcfc] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-xs">#{o.id.slice(0, 8).toUpperCase()}</strong>
                    <span
                      className={cn(
                        "rounded-full px-2 py-[3px] text-[10px] font-bold",
                        ORDER_STATUS_CLASS[o.status] ?? "bg-[#f0f3f6] text-[#607080]",
                      )}
                    >
                      {ORDER_STATUS_LABEL[o.status] ?? o.status}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] text-[#425968]">
                    {o.ownerName}{" "}
                    <small className="text-[10px] text-[#687b88]">{o.ownerEmail}</small>
                  </div>
                </div>
                {o.status === "created" || o.status === "awaiting_payment" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDialogError(null);
                      setPending(o);
                    }}
                    className="shrink-0 rounded-md border border-[#f3d2da] bg-white px-2 py-1 text-[10px] font-bold text-[#be123c] transition-colors hover:border-[#be123c]"
                  >
                    Batalkan
                  </button>
                ) : null}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-[#eef2f4] pt-3 sm:grid-cols-4">
                {[
                  { label: "Jenis", value: ORDER_KIND_LABEL[o.kind] ?? o.kind },
                  {
                    label: "Undangan",
                    value: o.invitationSlug ? (
                      <span className="text-teal-dark">/{o.invitationSlug}</span>
                    ) : (
                      "—"
                    ),
                  },
                  {
                    label: "Total",
                    value: (
                      <span className="font-bold text-[#142c3c]">
                        {formatIdr(o.finalAmountIdr)}
                      </span>
                    ),
                  },
                  {
                    label: "Dibuat",
                    value: new Date(o.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }),
                  },
                ].map((f) => (
                  <div key={f.label}>
                    <div className="text-[9px] font-bold tracking-wide text-[#9aabb7] uppercase">
                      {f.label}
                    </div>
                    <div className="mt-0.5 text-[11px] text-[#425968]">{f.value}</div>
                  </div>
                ))}
              </div>
            </article>
          ))}
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-[11px] text-[#687b88]">
              Tidak ada order yang sesuai.
            </div>
          ) : null}
        </div>

        {filtered.length > 0 ? (
          <p className="mt-3 text-center text-[10px] text-[#9aabb7]">
            Menampilkan {visible.length} dari {filtered.length} order
          </p>
        ) : null}
        <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} label="Navigasi halaman order" />
      </section>

      <section className="mt-4 rounded-xl border border-[#e4ebee] bg-white p-5 shadow-[0_7px_22px_rgba(21,48,65,0.04)]">
        <h2 className="mb-2 text-[15px] font-bold">Aturan upgrade reseller</h2>
        <p className="text-[11px] leading-relaxed text-[#687b88]">
          Upgrade reseller adalah sekali bayar, bukan langganan. Harga diambil dari konfigurasi saat
          order dibuat dan disimpan sebagai snapshot. Role hanya diberikan setelah webhook pembayaran
          tervalidasi; proses wajib idempoten dan tercatat di audit log.
        </p>
      </section>

      {pending ? (
        <AdminConfirmDialog
          open
          title="Batalkan order"
          description={`Order #${pending.id.slice(0, 8).toUpperCase()} (${ORDER_KIND_LABEL[pending.kind] ?? pending.kind}, ${formatIdr(pending.finalAmountIdr)}) hanya bisa dibatalkan selama belum dibayar. Tindakan ini tercatat di audit log.`}
          confirmLabel="Batalkan order"
          tone="danger"
          requireReason
          busy={busy}
          error={dialogError}
          onConfirm={(reason) => void cancelOrder(reason)}
          onCancel={() => {
            if (!busy) {
              setPending(null);
              setDialogError(null);
            }
          }}
        />
      ) : null}
    </div>
  );
}
