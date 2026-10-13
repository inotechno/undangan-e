"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import {
  ArrowRight,
  CalendarDays,
  Eye,
  LayoutGrid,
  MapPin,
  MessageCircle,
  Pencil,
  Plus,
  QrCode,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type DashboardInvitation = {
  id: string;
  slug: string;
  title: string;
  status: string;
  eventType: string;
  templateName: string;
  templatePreview: string | null;
  eventDate: string | null;
  venue: string | null;
  updatedAt: string;
  guests: number;
  attending: number;
  checkedIn: number;
  payOrderId: string | null;
};

export type PopularTemplate = {
  id: string;
  name: string;
  description: string | null;
  preview: string | null;
};

const STATUS_META: Record<string, { label: string; className: string }> = {
  active: { label: "Dipublikasikan", className: "bg-[#e9f8ef] text-[#15803d]" },
  draft: { label: "Draft", className: "bg-[#f0f3f6] text-[#607080]" },
  awaiting_payment: { label: "Menunggu Bayar", className: "bg-[#fff7df] text-[#a16207]" },
  expired: { label: "Kedaluwarsa", className: "bg-[#fff0f2] text-[#be123c]" },
  archived: { label: "Diarsipkan", className: "bg-[#f0f3f6] text-[#607080]" },
};

const EVENT_EMOJI: Record<string, string> = {
  pernikahan: "❀",
  tunangan: "❦",
  "ulang-tahun": "🎂",
  aqiqah: "♧",
  khitanan: "✦",
  seminar: "✦",
  syukuran: "❁",
  keluarga: "✉",
};

const THUMB_STYLE: Record<string, string> = {
  pernikahan: "bg-gradient-to-br from-[#fbe8e7] to-[#fff6f1]",
  tunangan: "bg-gradient-to-br from-[#f3e6d3] to-[#fffaf0]",
  seminar: "bg-gradient-to-br from-[#173d45] to-[#0d2533] text-[#d8c28b]",
  "ulang-tahun": "bg-gradient-to-br from-[#fbe8e7] to-[#fff6f1]",
};

const STEPS = [
  { title: "Pilih template", text: "Temukan desain yang sesuai dengan acara Anda." },
  { title: "Sesuaikan konten", text: "Isi informasi acara, foto, dan musik." },
  { title: "Kelola tamu", text: "Tambah daftar tamu dan pantau RSVP." },
  { title: "Publikasikan", text: "Bayar sekali, lalu bagikan tautan undangan." },
];

function fmtDate(value: string | null) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function fmtInt(n: number) {
  return n.toLocaleString("id-ID");
}

function InvitationThumb({ item }: { item: DashboardInvitation }) {
  const gradient = THUMB_STYLE[item.eventType] ?? "bg-gradient-to-br from-[#e0f3f0] to-[#f7f7ee]";
  return (
    <div
      className={cn(
        "relative grid h-[76px] w-[62px] shrink-0 place-items-center overflow-hidden rounded-[9px] border border-[#e3eeeb] text-2xl",
        gradient,
      )}
      aria-hidden
    >
      {item.templatePreview ? (
        <Image
          src={item.templatePreview}
          alt=""
          fill
          sizes="62px"
          className="object-cover opacity-95"
        />
      ) : (
        <span>{EVENT_EMOJI[item.eventType] ?? "✉"}</span>
      )}
    </div>
  );
}

function InvitationRow({ item }: { item: DashboardInvitation }) {
  const status = STATUS_META[item.status] ?? {
    label: item.status,
    className: "bg-[#f0f3f6] text-[#607080]",
  };
  const date = fmtDate(item.eventDate);

  return (
    <article className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-t border-[#edf1f3] px-0 py-3.5 first:border-t-0 sm:grid-cols-[minmax(190px,1.4fr)_auto] sm:gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <InvitationThumb item={item} />
        <div className="min-w-0">
          <div className="mb-1 truncate text-[13px] font-extrabold text-charcoal">{item.title}</div>
          {item.status === "active" ? (
            <Link
              href={`/i/${item.slug}`}
              className="mb-1.5 block truncate text-[11px] text-teal-dark hover:underline"
            >
              undangane.id/{item.slug}
            </Link>
          ) : (
            <div className="mb-1.5 truncate text-[11px] text-muted-warm">/{item.slug}</div>
          )}
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "inline-flex rounded-full px-2 py-[3px] text-[10px] font-bold whitespace-nowrap",
                status.className,
              )}
            >
              {status.label}
            </span>
            {date ? (
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-warm">
                <CalendarDays className="size-3" aria-hidden />
                {date}
              </span>
            ) : null}
            {item.venue ? (
              <span className="inline-flex min-w-0 items-center gap-1 text-[10px] text-muted-warm">
                <MapPin className="size-3 shrink-0" aria-hidden />
                <span className="truncate">{item.venue}</span>
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-1.5">
        {item.status === "active" ? (
          <>
            <Link
              href={`/i/${item.slug}`}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#d8e3e8] bg-white px-2.5 text-[11px] font-bold text-charcoal transition-colors hover:border-teal hover:text-teal"
            >
              <Eye className="size-3.5" aria-hidden />
              Lihat
            </Link>
            <Link
              href={`/undangan/${item.id}`}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-teal px-2.5 text-[11px] font-bold text-white transition-colors hover:bg-teal-hover"
            >
              <Pencil className="size-3.5" aria-hidden />
              Kelola
            </Link>
          </>
        ) : null}
        {item.status === "draft" ? (
          <Link
            href={`/undangan/${item.id}`}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#d8e3e8] bg-white px-2.5 text-[11px] font-bold text-charcoal transition-colors hover:border-teal hover:text-teal"
          >
            <Pencil className="size-3.5" aria-hidden />
            Lanjut Edit
          </Link>
        ) : null}
        {item.status === "awaiting_payment" ? (
          <>
            <Link
              href={`/undangan/${item.id}`}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#d8e3e8] bg-white px-2.5 text-[11px] font-bold text-charcoal transition-colors hover:border-teal hover:text-teal"
            >
              <Pencil className="size-3.5" aria-hidden />
              Edit
            </Link>
            {item.payOrderId ? (
              <Link
                href={`/bayar/${item.payOrderId}`}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-teal px-2.5 text-[11px] font-bold text-white transition-colors hover:bg-teal-hover"
              >
                <QrCode className="size-3.5" aria-hidden />
                Bayar
              </Link>
            ) : null}
          </>
        ) : null}
        {item.status === "expired" ? (
          <Link
            href={`/undangan/${item.id}`}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#d8e3e8] bg-white px-2.5 text-[11px] font-bold text-charcoal transition-colors hover:border-teal hover:text-teal"
          >
            <Pencil className="size-3.5" aria-hidden />
            Perpanjang
          </Link>
        ) : null}
      </div>
    </article>
  );
}

export function DashboardClient({
  userName,
  items,
  templates,
}: {
  userName: string;
  items: DashboardInvitation[];
  templates: PopularTemplate[];
}) {
  const counts = useMemo(() => {
    const map: Record<string, number> = { all: items.length };
    for (const item of items) {
      map[item.status] = (map[item.status] ?? 0) + 1;
    }
    return map;
  }, [items]);

  const recent = useMemo(
    () =>
      [...items]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 4),
    [items],
  );

  const totalGuests = items.reduce((sum, i) => sum + i.guests, 0);
  const totalAttending = items.reduce((sum, i) => sum + i.attending, 0);
  const totalActive = counts.active ?? 0;
  const firstName = userName.split(/\s+/)[0] || userName;

  const stats = [
    { label: "Total Undangan", value: fmtInt(items.length), note: `${fmtInt(totalActive)} dipublikasikan`, icon: "▤" },
    { label: "Undangan Terbit", value: fmtInt(totalActive), note: "Siap dibagikan", icon: "▣" },
    { label: "Total Tamu", value: fmtInt(totalGuests), note: "Terkumpul di semua undangan", icon: "♧" },
    {
      label: "RSVP Hadir",
      value: fmtInt(totalAttending),
      note: totalGuests > 0 ? `${Math.round((totalAttending / totalGuests) * 100)}% dari total tamu` : "Belum ada RSVP",
      icon: "◉",
    },
  ];

  return (
    <div>
      {/* Welcome */}
      <section className="relative mb-5 flex items-center justify-between gap-5 overflow-hidden rounded-[18px] border border-[#dcefeb] bg-gradient-to-r from-[#e7f7f5] to-[#f3fbfa] p-6 sm:p-7">
        <div
          className="pointer-events-none absolute top-[-150px] right-[16%] size-[230px] rounded-full border border-[#b6e1dc]"
          aria-hidden
        />
        <div className="relative min-w-0">
          <p className="mb-2 text-[10px] font-extrabold tracking-[1.5px] text-teal-dark uppercase">
            Dashboard UndanganE
          </p>
          <h1 className="mb-2 text-[clamp(22px,2.2vw,29px)] leading-tight font-bold tracking-[-0.9px] text-charcoal">
            Selamat datang, {firstName}! 👋
          </h1>
          <p className="mb-4 max-w-[600px] text-[13px] leading-relaxed text-[#536777]">
            Saatnya membuat undangan digital untuk momen spesial Anda. Pilih template favorit,
            sesuaikan konten, lalu bagikan dengan mudah.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/dashboard/template"
              className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-teal px-4 text-xs font-bold text-white shadow-[0_4px_10px_rgba(13,148,136,0.16)] transition-colors hover:bg-teal-hover"
            >
              <Plus className="size-4" aria-hidden />
              Buat Undangan Baru
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
            <Link
              href="/dashboard/template"
              className="inline-flex h-10 items-center rounded-[10px] border border-[#d8e3e8] bg-white px-4 text-xs font-bold text-charcoal transition-colors hover:border-teal hover:text-teal"
            >
              Lihat Template
            </Link>
          </div>
        </div>
        <div
          className="mr-4 hidden h-[120px] w-[180px] shrink-0 rotate-3 place-items-center rounded-[18px] border border-white bg-white/60 text-5xl text-teal shadow-[0_8px_24px_rgba(18,40,59,0.05)] md:grid"
          aria-hidden
        >
          ✉
        </div>
      </section>

      {/* Stats */}
      <section aria-label="Ringkasan statistik" className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="flex min-w-0 items-center gap-3 rounded-[15px] border border-border-warm bg-white p-4 shadow-[0_8px_24px_rgba(18,40,59,0.045)] lg:p-[19px]"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-[13px] bg-teal-soft text-lg text-teal-dark lg:size-[45px] lg:text-xl">
              <span aria-hidden>{stat.icon}</span>
            </span>
            <div className="min-w-0">
              <div className="text-[11px] text-muted-warm lg:text-xs">{stat.label}</div>
              <div className="text-xl font-extrabold tracking-[-0.8px] text-charcoal lg:text-[25px]">
                {stat.value}
              </div>
              <div className="mt-0.5 truncate text-[10px] text-[#15803d]">{stat.note}</div>
            </div>
          </article>
        ))}
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* Panel utama */}
        <section className="min-w-0 rounded-[15px] border border-border-warm bg-white p-5 shadow-[0_8px_24px_rgba(18,40,59,0.045)]">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-[17px] font-bold tracking-[-0.3px] text-charcoal">
                Undangan Terbaru
              </h2>
              <p className="mt-1 text-xs text-muted-warm">
                {items.length > recent.length
                  ? `Menampilkan ${recent.length} dari ${fmtInt(items.length)} undangan`
                  : "Semua undangan Anda"}
              </p>
            </div>
            <Link
              href="/dashboard/undangan"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#d8e3e8] bg-white px-3 text-[11px] font-bold text-charcoal transition-colors hover:border-teal hover:text-teal"
            >
              <LayoutGrid className="size-3.5" aria-hidden />
              Lihat Semua
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-warm">
              <p>Belum ada undangan. Pilih template favoritmu untuk mulai.</p>
              <Link
                href="/dashboard/template"
                className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg bg-teal px-3.5 text-[11px] font-bold text-white transition-colors hover:bg-teal-hover"
              >
                <Plus className="size-3.5" aria-hidden />
                Buat Undangan Pertama
              </Link>
            </div>
          ) : (
            recent.map((item) => <InvitationRow key={item.id} item={item} />)
          )}
        </section>

        {/* Kolom kanan */}
        <aside className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <section className="rounded-[15px] border border-border-warm bg-white p-5 shadow-[0_8px_24px_rgba(18,40,59,0.045)]">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-[15px] font-bold text-charcoal">Langkah Cepat</h2>
              <span className="text-xs text-muted-warm">Panduan</span>
            </div>
            <div className="grid gap-4">
              {STEPS.map((step, i) => (
                <div key={step.title} className="flex items-start gap-3">
                  <span className="grid size-[31px] shrink-0 place-items-center rounded-full bg-teal text-sm font-extrabold text-white">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <strong className="block text-xs text-charcoal">{step.title}</strong>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-warm">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[15px] border border-border-warm bg-white p-5 shadow-[0_8px_24px_rgba(18,40,59,0.045)]">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-[15px] font-bold text-charcoal">Template Populer</h2>
              <Link
                href="/dashboard/template"
                className="inline-flex h-8 items-center rounded-lg border border-[#d8e3e8] bg-white px-2.5 text-[11px] font-bold text-charcoal transition-colors hover:border-teal hover:text-teal"
              >
                Lihat Semua →
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {templates.map((tpl) => (
                <Link
                  key={tpl.id}
                  href={`/dashboard/baru?template=${tpl.id}`}
                  className="group min-w-0"
                >
                  <div className="relative mb-2 grid h-[108px] place-items-center overflow-hidden rounded-[10px] border border-border-warm bg-gradient-to-br from-[#e6f3ef] to-white text-[26px] text-teal">
                    {tpl.preview ? (
                      <Image src={tpl.preview} alt="" fill sizes="100px" className="object-cover" />
                    ) : (
                      <span aria-hidden>❀</span>
                    )}
                  </div>
                  <strong className="block truncate text-[11px] text-charcoal group-hover:text-teal">
                    {tpl.name}
                  </strong>
                  <small className="block truncate text-[10px] text-muted-warm">
                    {tpl.description ?? "Template"}
                  </small>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-[15px] border border-[#d8efeb] bg-[#eaf7f5] p-5 sm:col-span-2 lg:col-span-1">
            <div className="flex items-start gap-3">
              <span className="grid size-[45px] shrink-0 place-items-center rounded-[14px] bg-white text-teal">
                <MessageCircle className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-charcoal">Butuh Bantuan?</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-warm">
                  Tim kami siap membantu Anda melalui pusat bantuan.
                </p>
                <Link
                  href="/panduan#kontak"
                  className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#d8e3e8] bg-white px-2.5 text-[11px] font-bold text-charcoal transition-colors hover:border-teal hover:text-teal"
                >
                  Hubungi Kami →
                </Link>
              </div>
            </div>
          </section>
        </aside>
      </div>

      <p className="mt-8 text-center text-[10px] text-[#8a98a5]">
        © 2026 UndanganE · Undangan digital untuk momen spesial Anda.
      </p>
    </div>
  );
}
