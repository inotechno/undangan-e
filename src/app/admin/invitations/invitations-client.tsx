"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminConfirmDialog } from "@/components/admin/confirm-dialog";
import { Pagination, paginate } from "@/components/ui/pagination";
import {
  INVITATION_STATUS_CLASS,
  INVITATION_STATUS_LABEL,
  type AdminInvitationRow,
} from "@/modules/admin/labels";
import { cn } from "@/lib/utils";

const PER_PAGE = 12;

type InvAction = "archive" | "restore" | "unpublish";

const ACTION_META: Record<
  InvAction,
  { title: string; description: string; confirmLabel: string; tone: "default" | "danger" }
> = {
  archive: {
    title: "Arsipkan undangan",
    description:
      "Undangan berstatus Diarsipkan dan tidak bisa dibuka publik sampai dipulihkan. Data tetap tersimpan.",
    confirmLabel: "Arsipkan",
    tone: "danger",
  },
  restore: {
    title: "Pulihkan undangan",
    description: "Undangan dikembalikan ke status Draft. Publikasi ulang memerlukan order lunas.",
    confirmLabel: "Pulihkan",
    tone: "default",
  },
  unpublish: {
    title: "Cabut publikasi",
    description:
      "Undangan aktif dicabut publikasinya dan kembali ke Draft. Tautan publik langsung tidak bisa diakses.",
    confirmLabel: "Cabut publikasi",
    tone: "danger",
  },
};

export function AdminInvitationsClient({ items }: { items: AdminInvitationRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState<{ item: AdminInvitationRow; action: InvAction } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      const matchQ =
        !q ||
        i.title.toLowerCase().includes(q) ||
        i.slug.toLowerCase().includes(q) ||
        i.ownerName.toLowerCase().includes(q) ||
        i.ownerEmail.toLowerCase().includes(q);
      const matchStatus = !status || i.status === status;
      return matchQ && matchStatus;
    });
  }, [items, query, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const visible = paginate(filtered, safePage, PER_PAGE);

  async function confirmAction() {
    if (!pending) return;
    setBusy(true);
    setDialogError(null);
    try {
      const res = await fetch(`/api/admin/invitations/${pending.item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: pending.action }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setDialogError(data.error ?? "Gagal menjalankan aksi");
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

  function rowActions(i: AdminInvitationRow) {
    const actions: InvAction[] = [];
    if (i.status === "archived") actions.push("restore");
    else {
      if (i.status === "active") actions.push("unpublish");
      actions.push("archive");
    }
    return actions;
  }

  const meta = pending ? ACTION_META[pending.action] : null;

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
            placeholder="Cari nama undangan atau pemilik..."
          aria-label="Cari undangan"
          className="h-9 min-w-[180px] flex-1 rounded-lg border border-[#e4ebee] bg-white px-2.5 text-xs outline-none focus-visible:border-teal"
        />
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
          <option value="active">Aktif</option>
          <option value="draft">Draft</option>
          <option value="awaiting_payment">Menunggu Bayar</option>
          <option value="expired">Kedaluwarsa</option>
          <option value="archived">Diarsipkan</option>
        </select>
      </div>

      <div className="grid gap-2.5">
        {visible.map((i) => (
          <article key={i.id} className="rounded-xl border border-[#e4ebee] bg-[#fafcfc] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <strong className="block truncate text-xs">{i.title}</strong>
                <small className="block text-[10px] text-teal-dark">/{i.slug}</small>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={cn(
                    "rounded-full px-2 py-[3px] text-[10px] font-bold",
                    INVITATION_STATUS_CLASS[i.status] ?? "bg-[#f0f3f6] text-[#607080]",
                  )}
                >
                  {INVITATION_STATUS_LABEL[i.status] ?? i.status}
                </span>
                {i.status === "active" ? (
                  <Link
                    href={`/i/${i.slug}`}
                    className="inline-flex rounded-md border border-[#e4ebee] bg-white px-2 py-1 text-[10px] font-bold text-[#536a78] transition-colors hover:border-teal hover:text-teal"
                  >
                    Lihat
                  </Link>
                ) : null}
                {rowActions(i).map((action) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => {
                      setDialogError(null);
                      setPending({ item: i, action });
                    }}
                    className={cn(
                      "rounded-md border bg-white px-2 py-1 text-[10px] font-bold transition-colors",
                      action === "archive" || action === "unpublish"
                        ? "border-[#f3d2da] text-[#be123c] hover:border-[#be123c]"
                        : "border-[#e4ebee] text-[#536a78] hover:border-teal hover:text-teal",
                    )}
                  >
                    {action === "archive" ? "Arsipkan" : action === "restore" ? "Pulihkan" : "Cabut publikasi"}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-[#eef2f4] pt-3 sm:grid-cols-3">
              {[
                {
                  label: "Pemilik",
                  value: (
                    <>
                      <span className="block text-[#425968]">{i.ownerName}</span>
                      <small className="block text-[10px] text-[#687b88]">{i.ownerEmail}</small>
                    </>
                  ),
                },
                { label: "Tipe Acara", value: <span className="capitalize">{i.eventType}</span> },
                {
                  label: "Diperbarui",
                  value: new Date(i.updatedAt).toLocaleDateString("id-ID", {
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
            Tidak ada undangan yang sesuai.
          </div>
        ) : null}
      </div>

      {filtered.length > 0 ? (
        <p className="mt-3 text-center text-[10px] text-[#9aabb7]">
          Menampilkan {visible.length} dari {filtered.length} undangan
        </p>
      ) : null}
      <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} label="Navigasi halaman undangan" />

      {pending && meta ? (
        <AdminConfirmDialog
          open
          title={meta.title}
          description={`${meta.description} Undangan: ${pending.item.title} (/${pending.item.slug}).`}
          confirmLabel={meta.confirmLabel}
          tone={meta.tone}
          busy={busy}
          error={dialogError}
          onConfirm={() => void confirmAction()}
          onCancel={() => {
            if (!busy) {
              setPending(null);
              setDialogError(null);
            }
          }}
        />
      ) : null}
    </section>
  );
}
