import type { Metadata } from "next";
import Link from "next/link";
import {
  formatIdr,
  formatDateTime,
  getAdminOverview,
} from "@/modules/admin/server";
import { cn } from "@/lib/utils";

export const instant = false;

export const metadata: Metadata = {
  title: "Dashboard — Admin",
  robots: { index: false, follow: false },
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

export default async function AdminOverviewPage() {
  const data = await getAdminOverview();
  const maxDist = Math.max(1, ...data.distribution.map((d) => d.count));

  const stats = [
    { label: "Total Pengguna", value: data.totalUsers.toLocaleString("id-ID"), note: "Akun terdaftar" },
    { label: "Undangan Aktif", value: data.activeInvitations.toLocaleString("id-ID"), note: `dari ${data.totalInvitations.toLocaleString("id-ID")} undangan` },
    { label: "Pendapatan", value: formatIdr(data.revenueIdr), note: `${data.paidOrders} order lunas` },
    {
      label: "Perlu Ditinjau",
      value: data.awaitingOrders.toLocaleString("id-ID"),
      note: "order menunggu pembayaran",
      warn: true,
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[25px] font-bold tracking-[-0.7px]">Dashboard</h1>
          <p className="mt-1.5 text-xs text-[#687b88]">Ringkasan operasional platform UndanganE.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/orders"
            className="inline-flex h-9 items-center rounded-lg border border-[#dbe5e9] bg-white px-3 text-[11px] font-bold text-[#425968] transition-colors hover:border-teal hover:text-teal"
          >
            Pesanan & Pembayaran
          </Link>
          <Link
            href="/admin/users"
            className="inline-flex h-9 items-center rounded-lg bg-teal px-3 text-[11px] font-bold text-white transition-colors hover:bg-teal-hover"
          >
            Kelola Pengguna
          </Link>
        </div>
      </div>

      <section aria-label="Statistik" className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="rounded-xl border border-[#e4ebee] bg-white p-4 shadow-[0_7px_22px_rgba(21,48,65,0.04)]"
          >
            <div className="mb-2 text-[10px] font-bold tracking-wide text-[#687b88] uppercase">
              {stat.label}
            </div>
            <div className="text-[23px] font-extrabold tracking-[-0.6px] text-[#142c3c] lg:text-[26px]">
              {stat.value}
            </div>
            <div
              className={cn(
                "mt-1.5 text-[10px]",
                stat.warn ? "text-[#a16207]" : "text-[#15803d]",
              )}
            >
              {stat.note}
            </div>
          </article>
        ))}
      </section>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          <section className="rounded-xl border border-[#e4ebee] bg-white p-5 shadow-[0_7px_22px_rgba(21,48,65,0.04)]">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-[15px] font-bold">Pengguna Terbaru</h2>
                <p className="mt-1 text-[11px] text-[#687b88]">Pendaftaran terbaru di platform</p>
              </div>
              <Link
                href="/admin/users"
                className="text-[11px] font-bold text-teal-dark hover:underline"
              >
                Lihat semua →
              </Link>
            </div>
            <div className="grid gap-2.5">
              {data.recentUsers.map((u) => (
                <article key={u.id} className="rounded-xl border border-[#e4ebee] bg-[#fafcfc] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#e8f4f2] text-[11px] font-extrabold text-teal-dark">
                        {initials(u.name)}
                      </span>
                      <div className="min-w-0">
                        <strong className="block truncate text-xs text-[#142c3c]">{u.name}</strong>
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
                      <Link
                        href="/admin/users"
                        className="inline-flex rounded-md border border-[#e4ebee] bg-white px-2 py-1 text-[10px] font-bold text-[#536a78] transition-colors hover:border-teal hover:text-teal"
                      >
                        Detail
                      </Link>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-[#eef2f4] pt-3">
                    <div>
                      <div className="text-[9px] font-bold tracking-wide text-[#9aabb7] uppercase">
                        Terdaftar
                      </div>
                      <div className="mt-0.5 text-[11px] text-[#425968]">
                        {new Date(u.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] font-bold tracking-wide text-[#9aabb7] uppercase">
                        Tipe
                      </div>
                      <div className="mt-0.5 text-[11px] capitalize text-[#425968]">{u.type}</div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-[#e4ebee] bg-white p-5 shadow-[0_7px_22px_rgba(21,48,65,0.04)]">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-[15px] font-bold">Aktivitas Terkini</h2>
                <p className="mt-1 text-[11px] text-[#687b88]">Log tindakan terbaru di platform</p>
              </div>
              <Link href="/admin/audit" className="text-[11px] font-bold text-teal-dark hover:underline">
                Audit log →
              </Link>
            </div>
            {data.recentAudit.length === 0 ? (
              <p className="py-4 text-center text-[11px] text-[#687b88]">Belum ada aktivitas tercatat.</p>
            ) : (
              <div className="grid gap-3.5">
                {data.recentAudit.map((a) => (
                  <div key={a.id} className="flex items-start gap-3">
                    <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-[#e8f7f4] text-teal-dark">
                      ✓
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                        <strong className="text-xs text-[#142c3c]">{a.action}</strong>
                        <time className="text-[10px] text-[#687b88]">
                          {formatDateTime(new Date(a.createdAt))}
                        </time>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-[#687b88]">
                        {a.actorName} · {a.entity}
                        {a.entityId ? ` #${a.entityId.slice(0, 8)}` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <section className="rounded-xl border border-[#e4ebee] bg-white p-5 shadow-[0_7px_22px_rgba(21,48,65,0.04)]">
            <h2 className="mb-1 text-[15px] font-bold">Aksi Cepat</h2>
            <p className="mb-3.5 text-[11px] text-[#687b88]">Operasional admin</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { href: "/admin/users", title: "Pengguna", sub: "Akun & peran" },
                { href: "/admin/orders", title: "Pembayaran", sub: "Status order" },
                { href: "/admin/invitations", title: "Undangan", sub: "Publikasi" },
                { href: "/admin/pricing", title: "Atur Harga", sub: "Harga & upgrade" },
              ].map((a) => (
                <Link
                  key={a.href + a.title}
                  href={a.href}
                  className="rounded-lg border border-[#e4ebee] bg-white p-3 text-left transition-colors hover:border-teal"
                >
                  <strong className="block text-xs text-[#142c3c]">{a.title}</strong>
                  <small className="mt-0.5 block text-[10px] text-[#687b88]">{a.sub}</small>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-[#e4ebee] bg-white p-5 shadow-[0_7px_22px_rgba(21,48,65,0.04)]">
            <h2 className="mb-1 text-[15px] font-bold">Distribusi Pengguna</h2>
            <p className="mb-4 text-[11px] text-[#687b88]">Menurut jenis akun</p>
            <div className="grid gap-3">
              {data.distribution.map((d) => (
                <div key={d.label} className="grid grid-cols-[92px_1fr_40px] items-center gap-2 text-[11px]">
                  <span className="truncate text-[#425968]">{d.label}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-[#edf2f4]">
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${Math.round((d.count / maxDist) * 100)}%`,
                        background: d.color,
                      }}
                    />
                  </span>
                  <span className="text-right font-bold text-[#142c3c]">{d.count}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[10px] leading-relaxed text-[#687b88]">
              Semua pendaftar dimulai sebagai <b>user</b>. Role reseller diberikan sistem setelah
              pembayaran upgrade terkonfirmasi.
            </p>
          </section>

          <section className="rounded-xl border border-[#e4ebee] bg-white p-5 shadow-[0_7px_22px_rgba(21,48,65,0.04)] sm:col-span-2 lg:col-span-1">
            <h2 className="mb-3 text-[15px] font-bold">Order Terbaru</h2>
            {data.awaitingOrders > 0 || data.paidOrders > 0 ? (
              <p className="text-[11px] leading-relaxed text-[#687b88]">
                {data.paidOrders} order lunas ({formatIdr(data.revenueIdr)}), {data.awaitingOrders}{" "}
                menunggu pembayaran, {data.upgradePaid} upgrade reseller terkonfirmasi.
              </p>
            ) : (
              <p className="text-[11px] text-[#687b88]">Belum ada order masuk.</p>
            )}
            <Link
              href="/admin/orders"
              className="mt-3 inline-flex h-8 items-center rounded-lg border border-[#dbe5e9] bg-white px-2.5 text-[11px] font-bold text-[#425968] transition-colors hover:border-teal hover:text-teal"
            >
              Buka pesanan →
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
