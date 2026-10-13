"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminConfirmDialog } from "@/components/admin/confirm-dialog";
import { Pagination, paginate } from "@/components/ui/pagination";
import { formatIdr } from "@/modules/admin/labels";
import type { VoucherRow } from "@/modules/payments/vouchers";
import { cn } from "@/lib/utils";

type Props = { initial: VoucherRow[] };

const PER_PAGE = 10;

export function VoucherAdmin({ initial }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<VoucherRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({
    code: "",
    type: "percent",
    value: "10",
    maxDiscountIdr: "",
    minOrderIdr: "",
    appliesTo: "all",
    maxTotalUses: "",
    validUntil: "",
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((v) => !q || v.code.toLowerCase().includes(q));
  }, [rows, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const visible = paginate(filtered, safePage, PER_PAGE);

  async function toggle(v: VoucherRow) {
    setBusyId(v.id);
    setCreateError(null);
    try {
      const res = await fetch(`/api/admin/vouchers/${v.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !v.active }),
      });
      if (!res.ok) {
        setCreateError("Gagal mengubah status voucher");
        return;
      }
      setRows((prev) => prev.map((r) => (r.id === v.id ? { ...r, active: !v.active } : r)));
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function remove() {
    if (!pendingDelete) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/admin/vouchers/${pendingDelete.id}`, { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setDeleteError(data.error ?? "Gagal menghapus voucher");
        return;
      }
      setRows((prev) => prev.filter((r) => r.id !== pendingDelete.id));
      setPendingDelete(null);
      router.refresh();
    } catch {
      setDeleteError("Koneksi gagal, coba lagi");
    } finally {
      setDeleteBusy(false);
    }
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/admin/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code,
          type: form.type,
          value: Number(form.value),
          maxDiscountIdr: form.maxDiscountIdr ? Number(form.maxDiscountIdr) : undefined,
          minOrderIdr: form.minOrderIdr ? Number(form.minOrderIdr) : 0,
          appliesTo: form.appliesTo,
          maxTotalUses: form.maxTotalUses ? Number(form.maxTotalUses) : undefined,
          validUntil: form.validUntil ? new Date(form.validUntil).toISOString() : undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setCreateError(data.error ?? "Gagal membuat voucher");
        return;
      }
      setForm({
        code: "",
        type: "percent",
        value: "10",
        maxDiscountIdr: "",
        minOrderIdr: "",
        appliesTo: "all",
        maxTotalUses: "",
        validUntil: "",
      });
      router.refresh();
    } finally {
      setCreating(false);
    }
  }

  const inputCls =
    "mt-1 h-9 w-full rounded-lg border border-[#e4ebee] bg-white px-2.5 text-xs outline-none focus-visible:border-teal";
  const labelCls = "text-[10px] font-bold tracking-wide text-[#687b88] uppercase";

  return (
    <div>
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Total Voucher", value: rows.length, note: "Semua kode" },
          { label: "Aktif", value: rows.filter((v) => v.active).length, note: "Bisa dipakai" },
          { label: "Nonaktif", value: rows.filter((v) => !v.active).length, note: "Dinonaktifkan" },
          {
            label: "Total Digunakan",
            value: rows.reduce((s, v) => s + v.usedCount, 0),
            note: "Redeem seluruh voucher",
          },
        ].map((s) => (
          <article
            key={s.label}
            className="rounded-xl border border-[#e4ebee] bg-white p-4 shadow-[0_7px_22px_rgba(21,48,65,0.04)]"
          >
            <div className="text-[10px] font-bold tracking-wide text-[#687b88] uppercase">{s.label}</div>
            <div className="mt-1.5 text-[24px] font-extrabold tracking-[-0.6px]">{s.value}</div>
            <div className="mt-1 text-[10px] text-[#687b88]">{s.note}</div>
          </article>
        ))}
      </div>

      <section className="mb-4 rounded-xl border border-[#e4ebee] bg-white p-5 shadow-[0_7px_22px_rgba(21,48,65,0.04)]">
        <h2 className="mb-1 text-[15px] font-bold">Buat voucher baru</h2>
        <p className="mb-4 text-[11px] text-[#687b88]">
          Kode diskon dipakai saat checkout. Batas kuota & masa berlaku opsional.
        </p>
        <form onSubmit={create}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block">
              <span className={labelCls}>Kode</span>
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="HEMAT10"
                required
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className={labelCls}>Tipe</span>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className={inputCls}
              >
                <option value="percent">Persen (%)</option>
                <option value="nominal">Nominal (Rp)</option>
              </select>
            </label>
            <label className="block">
              <span className={labelCls}>{form.type === "percent" ? "Persen (%)" : "Nilai (Rp)"}</span>
              <input
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value.replace(/\D/g, "") })}
                inputMode="numeric"
                required
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className={labelCls}>Berlaku untuk</span>
              <select
                value={form.appliesTo}
                onChange={(e) => setForm({ ...form, appliesTo: e.target.value })}
                className={inputCls}
              >
                <option value="all">Semua pengguna</option>
                <option value="user">Pengguna reguler</option>
                <option value="reseller">Reseller</option>
              </select>
            </label>
            <label className="block">
              <span className={labelCls}>Diskon maks (Rp, opsional)</span>
              <input
                value={form.maxDiscountIdr}
                onChange={(e) => setForm({ ...form, maxDiscountIdr: e.target.value.replace(/\D/g, "") })}
                inputMode="numeric"
                placeholder="tanpa batas"
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className={labelCls}>Min. order (Rp)</span>
              <input
                value={form.minOrderIdr}
                onChange={(e) => setForm({ ...form, minOrderIdr: e.target.value.replace(/\D/g, "") })}
                inputMode="numeric"
                placeholder="0"
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className={labelCls}>Kuota total (opsional)</span>
              <input
                value={form.maxTotalUses}
                onChange={(e) => setForm({ ...form, maxTotalUses: e.target.value.replace(/\D/g, "") })}
                inputMode="numeric"
                placeholder="tanpa batas"
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className={labelCls}>Berlaku s/d (opsional)</span>
              <input
                type="date"
                value={form.validUntil}
                onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                className={inputCls}
              />
            </label>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="submit"
              disabled={creating}
              className="inline-flex h-9 items-center rounded-lg bg-teal px-4 text-[11px] font-bold text-white transition-colors hover:bg-teal-dark disabled:opacity-50"
            >
              {creating ? "Memproses..." : "Buat voucher"}
            </button>
            {createError ? (
              <p className="text-[11px] font-semibold text-[#be123c]" role="alert">
                {createError}
              </p>
            ) : null}
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-[#e4ebee] bg-white p-5 shadow-[0_7px_22px_rgba(21,48,65,0.04)]">
        <div className="mb-4 flex flex-wrap gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Cari kode voucher..."
            aria-label="Cari voucher"
            className="h-9 min-w-[180px] flex-1 rounded-lg border border-[#e4ebee] bg-white px-2.5 text-xs outline-none focus-visible:border-teal"
          />
        </div>
        <div className="grid gap-2.5">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-[11px] text-[#687b88]">
              Tidak ada voucher yang sesuai.
            </div>
          ) : (
            visible.map((v) => (
              <article key={v.id} className="rounded-xl border border-[#e4ebee] bg-[#fafcfc] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="font-mono text-xs tracking-wide">{v.code}</strong>
                      <span
                        className={cn(
                          "rounded-full px-2 py-[3px] text-[10px] font-bold",
                          v.active ? "bg-[#e9f8ef] text-[#15803d]" : "bg-[#f0f3f6] text-[#607080]",
                        )}
                      >
                        {v.active ? "Aktif" : "Nonaktif"}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] font-bold text-[#142c3c]">
                      {v.type === "percent" ? `${v.value}%` : formatIdr(v.value)}
                      {v.maxDiscountIdr ? (
                        <span className="ml-1 text-[10px] font-normal text-[#687b88]">
                          maks. {formatIdr(v.maxDiscountIdr)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => void toggle(v)}
                      disabled={busyId === v.id}
                      className="rounded-md border border-[#e4ebee] bg-white px-2 py-1 text-[10px] font-bold text-[#536a78] transition-colors hover:border-teal hover:text-teal disabled:opacity-50"
                    >
                      {v.active ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteError(null);
                        setPendingDelete(v);
                      }}
                      className="rounded-md border border-[#f3d2da] bg-white px-2 py-1 text-[10px] font-bold text-[#be123c] transition-colors hover:border-[#be123c]"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-[#eef2f4] pt-3 sm:grid-cols-4">
                  {[
                    { label: "Untuk", value: <span className="capitalize">{v.appliesTo}</span> },
                    {
                      label: "Min. Order",
                      value: v.minOrderIdr > 0 ? formatIdr(v.minOrderIdr) : "—",
                    },
                    {
                      label: "Dipakai",
                      value: `${v.usedCount}${v.maxTotalUses !== null ? ` / ${v.maxTotalUses}` : ""}`,
                    },
                    {
                      label: "Berlaku s/d",
                      value: v.validUntil
                        ? new Date(v.validUntil).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "Tanpa batas",
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
            ))
          )}
        </div>

        {filtered.length > 0 ? (
          <p className="mt-3 text-center text-[10px] text-[#9aabb7]">
            Menampilkan {visible.length} dari {filtered.length} voucher
          </p>
        ) : null}
        <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} label="Navigasi halaman voucher" />
      </section>

      {pendingDelete ? (
        <AdminConfirmDialog
          open
          title="Hapus voucher"
          description={`Voucher ${pendingDelete.code} akan dihapus permanen. Jika sudah pernah dipakai (${pendingDelete.usedCount}x), pertimbangkan menonaktifkan saja.`}
          confirmLabel="Hapus"
          tone="danger"
          busy={deleteBusy}
          error={deleteError}
          onConfirm={() => void remove()}
          onCancel={() => {
            if (!deleteBusy) {
              setPendingDelete(null);
              setDeleteError(null);
            }
          }}
        />
      ) : null}
    </div>
  );
}
