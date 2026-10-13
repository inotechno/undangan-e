"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminConfirmDialog } from "@/components/admin/confirm-dialog";
import { Pagination, paginate } from "@/components/ui/pagination";
import type { AdminResellerRow } from "@/modules/admin/labels";

const PER_PAGE = 12;

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

export function AdminResellersClient({
  rows,
  currentUserId,
}: {
  rows: AdminResellerRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState<AdminResellerRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (r) => !q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q),
    );
  }, [rows, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const visible = paginate(filtered, safePage, PER_PAGE);

  async function revoke(reason: string) {
    if (!pending) return;
    setBusy(true);
    setDialogError(null);
    try {
      const res = await fetch(`/api/admin/users/${pending.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke_reseller", reason }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setDialogError(data.error ?? "Gagal mencabut reseller");
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
          { label: "Reseller Aktif", value: rows.length, note: "Role reseller" },
          {
            label: "Upgrade Terkonfirmasi",
            value: rows.filter((r) => r.upgradeOrderId).length,
            note: "Order paid",
          },
          {
            label: "Total Undangan",
            value: rows.reduce((s, r) => s + r.invitationCount, 0),
            note: "Milik semua reseller",
          },
          {
            label: "Suspended",
            value: rows.filter((r) => r.status === "suspended").length,
            note: "Akun ditangguhkan",
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

      <section className="rounded-xl border border-[#e4ebee] bg-white p-5 shadow-[0_7px_22px_rgba(21,48,65,0.04)]">
        <div className="mb-4 flex flex-wrap gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Cari reseller..."
            aria-label="Cari reseller"
            className="h-9 min-w-[180px] flex-1 rounded-lg border border-[#e4ebee] bg-white px-2.5 text-xs outline-none focus-visible:border-teal"
          />
        </div>
        <div className="grid gap-2.5">
          {visible.map((r) => (
            <article key={r.id} className="rounded-xl border border-[#e4ebee] bg-[#fafcfc] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#fff6dd] text-[11px] font-extrabold text-[#a16207]">
                    {initials(r.name)}
                  </span>
                  <div className="min-w-0">
                    <strong className="block truncate text-xs">{r.name}</strong>
                    <small className="block truncate text-[10px] text-[#687b88]">{r.email}</small>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={
                      "rounded-full px-2 py-[3px] text-[10px] font-bold " +
                      (r.status === "active"
                        ? "bg-[#e9f8ef] text-[#15803d]"
                        : "bg-[#fff0f2] text-[#be123c]")
                    }
                  >
                    {r.status === "active" ? "Aktif" : "Suspended"}
                  </span>
                  {r.id !== currentUserId ? (
                    <button
                      type="button"
                      onClick={() => {
                        setDialogError(null);
                        setPending(r);
                      }}
                      className="rounded-md border border-[#f3d2da] bg-white px-2 py-1 text-[10px] font-bold text-[#be123c] transition-colors hover:border-[#be123c]"
                    >
                      Cabut reseller
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-[#eef2f4] pt-3 sm:grid-cols-4">
                {[
                  {
                    label: "Upgrade",
                    value: r.upgradePaidAt
                      ? new Date(r.upgradePaidAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—",
                  },
                  {
                    label: "Order Upgrade",
                    value: r.upgradeOrderId ? `#${r.upgradeOrderId.slice(0, 8).toUpperCase()}` : "—",
                  },
                  { label: "Undangan", value: r.invitationCount },
                  {
                    label: "Terdaftar",
                    value: new Date(r.createdAt).toLocaleDateString("id-ID", {
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
            <div className="py-8 text-center text-[11px] text-[#687b88]">Belum ada reseller.</div>
          ) : null}
        </div>

        {filtered.length > 0 ? (
          <p className="mt-3 text-center text-[10px] text-[#9aabb7]">
            Menampilkan {visible.length} dari {filtered.length} reseller
          </p>
        ) : null}
        <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} label="Navigasi halaman reseller" />
      </section>

      <section className="mt-4 rounded-xl border border-[#e4ebee] bg-white p-5 shadow-[0_7px_22px_rgba(21,48,65,0.04)]">
        <h2 className="mb-2 text-[15px] font-bold">Kontrol keamanan</h2>
        <p className="text-[11px] leading-relaxed text-[#687b88]">
          Pencabutan role memerlukan konfirmasi ganda, alasan yang wajib diisi, dan audit log. Order
          yang sudah berjalan tidak otomatis dibatalkan. Harga reseller hanya diterapkan pada order
          baru setelah status role diperiksa server-side.
        </p>
      </section>

      {pending ? (
        <AdminConfirmDialog
          open
          title="Cabut role reseller"
          description={`Role reseller ${pending.name} (${pending.email}) akan dicabut. Order yang sudah berjalan tidak dibatalkan otomatis.`}
          confirmLabel="Cabut reseller"
          tone="danger"
          requireReason
          busy={busy}
          error={dialogError}
          onConfirm={(reason) => void revoke(reason)}
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
