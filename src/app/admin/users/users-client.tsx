"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminConfirmDialog } from "@/components/admin/confirm-dialog";
import { Pagination, paginate } from "@/components/ui/pagination";
import type { AdminUserRow } from "@/modules/admin/labels";
import { cn } from "@/lib/utils";

const PER_PAGE = 12;

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

type UserAction = {
  action: "suspend" | "unsuspend" | "grant_reseller" | "revoke_reseller";
  title: string;
  description: string;
  confirmLabel: string;
  tone: "default" | "danger";
  requireReason: boolean;
};

const ACTIONS: Record<UserAction["action"], Omit<UserAction, "action">> = {
  suspend: {
    title: "Tangguhkan pengguna",
    description:
      "Akun akan ditangguhkan dan semua sesi aktif dicabut. Pengguna tidak bisa masuk sampai diaktifkan kembali.",
    confirmLabel: "Tangguhkan",
    tone: "danger",
    requireReason: true,
  },
  unsuspend: {
    title: "Aktifkan kembali pengguna",
    description: "Status akun dikembalikan menjadi aktif. Pengguna bisa masuk kembali.",
    confirmLabel: "Aktifkan",
    tone: "default",
    requireReason: false,
  },
  grant_reseller: {
    title: "Jadikan reseller",
    description:
      "Role reseller ditambahkan ke akun ini. Harga reseller akan dipakai pada order baru mereka.",
    confirmLabel: "Tambah reseller",
    tone: "default",
    requireReason: false,
  },
  revoke_reseller: {
    title: "Cabut role reseller",
    description:
      "Role reseller dicabut dan tipe akun kembali reguler. Order yang sudah berjalan tidak dibatalkan otomatis.",
    confirmLabel: "Cabut reseller",
    tone: "danger",
    requireReason: true,
  },
};

export function AdminUsersClient({
  users,
  currentUserId,
}: {
  users: AdminUserRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState<{ user: AdminUserRow; action: UserAction["action"] } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      const matchQ =
        !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchRole = !role || u.roles.includes(role);
      const matchStatus =
        !status ||
        (status === "active" && u.status === "active") ||
        (status === "suspended" && u.status === "suspended");
      return matchQ && matchRole && matchStatus;
    });
  }, [users, query, role, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const visible = paginate(filtered, safePage, PER_PAGE);

  async function confirmAction(reason: string) {
    if (!pending) return;
    setBusy(true);
    setDialogError(null);
    try {
      const res = await fetch(`/api/admin/users/${pending.user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: pending.action, reason: reason || undefined }),
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

  function rowActions(u: AdminUserRow) {
    if (u.id === currentUserId) return null;
    const isReseller = u.roles.includes("reseller");
    const items: Array<{ action: UserAction["action"]; label: string }> = [];
    if (u.status === "active") items.push({ action: "suspend", label: "Tangguhkan" });
    else items.push({ action: "unsuspend", label: "Aktifkan" });
    if (!isReseller && !u.roles.includes("admin")) {
      items.push({ action: "grant_reseller", label: "Jadikan reseller" });
    }
    if (isReseller) items.push({ action: "revoke_reseller", label: "Cabut reseller" });
    return items;
  }

  const dialogMeta = pending ? ACTIONS[pending.action] : null;

  return (
    <div>
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Semua Pengguna", value: users.length, note: "Akun terdaftar" },
          { label: "Reseller", value: users.filter((u) => u.roles.includes("reseller")).length, note: "Role reseller aktif" },
          { label: "Admin", value: users.filter((u) => u.roles.includes("admin")).length, note: "Akses administrator" },
          { label: "Suspended", value: users.filter((u) => u.status === "suspended").length, note: "Sesi dicabut" },
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
            placeholder="Cari nama atau email..."
            aria-label="Cari pengguna"
            className="h-9 min-w-[180px] flex-1 rounded-lg border border-[#e4ebee] bg-white px-2.5 text-xs outline-none focus-visible:border-teal"
          />
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setPage(1);
            }}
            aria-label="Filter peran"
            className="h-9 rounded-lg border border-[#e4ebee] bg-white px-2.5 text-xs outline-none focus-visible:border-teal"
          >
            <option value="">Semua peran</option>
            <option value="user">User</option>
            <option value="reseller">Reseller</option>
            <option value="admin">Admin</option>
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
            <option value="active">Aktif</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        <div className="grid gap-2.5">
          {visible.map((u) => (
            <article
              key={u.id}
              className="rounded-xl border border-[#e4ebee] bg-[#fafcfc] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#e8f4f2] text-[11px] font-extrabold text-teal-dark">
                    {initials(u.name)}
                  </span>
                  <div className="min-w-0">
                    <strong className="block truncate text-xs">{u.name}</strong>
                    <small className="block truncate text-[10px] text-[#687b88]">{u.email}</small>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={cn(
                      "rounded-full px-2 py-[3px] text-[10px] font-bold",
                      u.status === "active"
                        ? "bg-[#e9f8ef] text-[#15803d]"
                        : "bg-[#fff0f2] text-[#be123c]",
                    )}
                  >
                    {u.status === "active" ? "Aktif" : "Suspended"}
                  </span>
                  {rowActions(u)?.map((item) => (
                    <button
                      key={item.action}
                      type="button"
                      onClick={() => {
                        setDialogError(null);
                        setPending({ user: u, action: item.action });
                      }}
                      className={cn(
                        "rounded-md border bg-white px-2 py-1 text-[10px] font-bold transition-colors",
                        item.action === "suspend" || item.action === "revoke_reseller"
                          ? "border-[#f3d2da] text-[#be123c] hover:border-[#be123c]"
                          : "border-[#e4ebee] text-[#536a78] hover:border-teal hover:text-teal",
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-[#eef2f4] pt-3 sm:grid-cols-4">
                {[
                  { label: "Tipe", value: <span className="capitalize">{u.type}</span> },
                  {
                    label: "Peran",
                    value: (
                      <span className="flex flex-wrap gap-1">
                        {u.roles.map((r) => (
                          <span
                            key={r}
                            className={cn(
                              "rounded-full px-2 py-[3px] text-[10px] font-bold capitalize",
                              r === "admin"
                                ? "bg-[#eef4ff] text-[#2563eb]"
                                : r === "reseller"
                                  ? "bg-[#fff6dd] text-[#a16207]"
                                  : "bg-[#f0f3f6] text-[#607080]",
                            )}
                          >
                            {r}
                          </span>
                        ))}
                      </span>
                    ),
                  },
                  { label: "Undangan", value: u.invitationCount },
                  {
                    label: "Terdaftar",
                    value: new Date(u.createdAt).toLocaleDateString("id-ID", {
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
              Tidak ada pengguna yang sesuai.
            </div>
          ) : null}
        </div>

        {filtered.length > 0 ? (
          <p className="mt-3 text-center text-[10px] text-[#9aabb7]">
            Menampilkan {visible.length} dari {filtered.length} pengguna
          </p>
        ) : null}
        <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} label="Navigasi halaman pengguna" />
      </section>

      <section className="mt-4 rounded-xl border border-[#e4ebee] bg-white p-5 shadow-[0_7px_22px_rgba(21,48,65,0.04)]">
        <h2 className="mb-2 text-[15px] font-bold">Catatan kebijakan peran</h2>
        <p className="text-[11px] leading-relaxed text-[#687b88]">
          Pendaftaran publik hanya membuat role <b>user</b>. Role <b>reseller</b> ditambahkan sistem
          setelah order upgrade QRIS berstatus <b>paid</b>; admin dapat mencabutnya dengan alasan
          dan audit log. Admin tidak dapat mengubah akunnya sendiri.
        </p>
      </section>

      {pending && dialogMeta ? (
        <AdminConfirmDialog
          open
          title={dialogMeta.title}
          description={`${dialogMeta.description} Target: ${pending.user.name} (${pending.user.email}).`}
          confirmLabel={dialogMeta.confirmLabel}
          tone={dialogMeta.tone}
          requireReason={dialogMeta.requireReason}
          busy={busy}
          error={dialogError}
          onConfirm={(reason) => void confirmAction(reason)}
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
