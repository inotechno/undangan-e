"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CalendarDays,
  Eye,
  MapPin,
  Pencil,
  Plus,
  QrCode,
  Search,
  Users,
} from "lucide-react";
import { Pagination, paginate } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

export type UndanganRow = {
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

const FILTERS = [
  { key: "all", label: "Semua" },
  { key: "active", label: "Dipublikasikan" },
  { key: "awaiting_payment", label: "Menunggu Bayar" },
  { key: "draft", label: "Draft" },
  { key: "expired", label: "Kedaluwarsa" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

function fmtDate(value: string | null) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function fmtInt(n: number) {
  return n.toLocaleString("id-ID");
}

function InvitationThumb({ item }: { item: UndanganRow }) {
  const gradient = THUMB_STYLE[item.eventType] ?? "bg-gradient-to-br from-[#e0f3f0] to-[#f7f7ee]";
  return (
    <div
      className={cn(
        "relative grid h-[92px] w-[72px] shrink-0 place-items-center overflow-hidden rounded-[10px] border border-[#e3eeeb] text-2xl",
        gradient,
      )}
      aria-hidden
    >
      {item.templatePreview ? (
        <Image
          src={item.templatePreview}
          alt=""
          fill
          sizes="72px"
          className="object-cover opacity-95"
        />
      ) : (
        <span>{EVENT_EMOJI[item.eventType] ?? "✉"}</span>
      )}
    </div>
  );
}

function InvitationCard({ item }: { item: UndanganRow }) {
  const status = STATUS_META[item.status] ?? {
    label: item.status,
    className: "bg-[#f0f3f6] text-[#607080]",
  };
  const date = fmtDate(item.eventDate);

  return (
    <article className="rounded-[15px] border border-border-warm bg-white p-4 shadow-[0_8px_24px_rgba(18,40,59,0.045)] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3.5">
          <InvitationThumb item={item} />
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-bold tracking-[-0.2px] text-charcoal">
              {item.title}
            </h3>
            {item.status === "active" ? (
              <Link
                href={`/i/${item.slug}`}
                className="mt-0.5 block truncate text-[11px] text-teal-dark hover:underline"
              >
                undangane.id/{item.slug}
              </Link>
            ) : (
              <div className="mt-0.5 truncate text-[11px] text-muted-warm">/{item.slug}</div>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span
                className={cn(
                  "inline-flex rounded-full px-2.5 py-[3px] text-[10px] font-bold whitespace-nowrap",
                  status.className,
                )}
              >
                {status.label}
              </span>
              <span className="inline-flex rounded-full bg-[#f3f6f8] px-2.5 py-[3px] text-[10px] font-semibold text-[#657587]">
                {item.templateName}
              </span>
            </div>
            {date || item.venue ? (
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-warm">
                {date ? (
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="size-3.5" aria-hidden />
                    {date}
                  </span>
                ) : null}
                {item.venue ? (
                  <span className="inline-flex min-w-0 items-center gap-1">
                    <MapPin className="size-3.5 shrink-0" aria-hidden />
                    <span className="truncate">{item.venue}</span>
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {item.status === "active" ? (
            <>
              <Link
                href={`/dashboard/tamu/${item.id}`}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#d8e3e8] bg-white px-2.5 text-[11px] font-bold text-charcoal transition-colors hover:border-teal hover:text-teal"
              >
                <Users className="size-3.5" aria-hidden />
                Tamu
              </Link>
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
            <>
              <Link
                href={`/dashboard/tamu/${item.id}`}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#d8e3e8] bg-white px-2.5 text-[11px] font-bold text-charcoal transition-colors hover:border-teal hover:text-teal"
              >
                <Users className="size-3.5" aria-hidden />
                Tamu
              </Link>
              <Link
                href={`/undangan/${item.id}`}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#d8e3e8] bg-white px-2.5 text-[11px] font-bold text-charcoal transition-colors hover:border-teal hover:text-teal"
              >
                <Pencil className="size-3.5" aria-hidden />
                Lanjut Edit
              </Link>
            </>
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
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-[#edf1f3] pt-3.5">
        {[
          { label: "Tamu", value: fmtInt(item.guests) },
          { label: "RSVP Hadir", value: fmtInt(item.attending) },
          { label: "Check-in", value: fmtInt(item.checkedIn) },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <strong className="block text-[15px] font-extrabold text-charcoal">{s.value}</strong>
            <span className="mt-0.5 block text-[10px] text-muted-warm">{s.label}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

const PER_PAGE = 6;

export function UndanganClient({ items }: { items: UndanganRow[] }) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "name">("newest");
  const [page, setPage] = useState(1);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: items.length };
    for (const item of items) {
      map[item.status] = (map[item.status] ?? 0) + 1;
    }
    return map;
  }, [items]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = items.filter((item) => {
      const matchFilter = filter === "all" || item.status === filter;
      const matchQuery =
        !q || item.title.toLowerCase().includes(q) || item.slug.toLowerCase().includes(q);
      return matchFilter && matchQuery;
    });
    if (sort === "name") {
      return [...list].sort((a, b) => a.title.localeCompare(b.title, "id"));
    }
    return list;
  }, [items, filter, search, sort]);

  const totalPages = Math.max(1, Math.ceil(visible.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageItems = paginate(visible, safePage, PER_PAGE);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[25px] font-bold tracking-[-0.7px] text-charcoal">Undangan Saya</h1>
          <p className="mt-1.5 text-xs text-muted-warm">
            Kelola semua undangan Anda — edit, publikasikan, dan pantau RSVP.
          </p>
        </div>
        <Link
          href="/dashboard/template"
          className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-teal px-4 text-xs font-bold text-white shadow-[0_4px_10px_rgba(13,148,136,0.16)] transition-colors hover:bg-teal-hover"
        >
          <Plus className="size-4" aria-hidden />
          Buat Undangan Baru
        </Link>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Total Undangan", value: items.length },
          { label: "Dipublikasikan", value: counts.active ?? 0 },
          {
            label: "Menunggu Bayar",
            value: counts.awaiting_payment ?? 0,
            warn: (counts.awaiting_payment ?? 0) > 0,
          },
          { label: "Draft", value: counts.draft ?? 0 },
        ].map((s) => (
          <article
            key={s.label}
            className="rounded-[15px] border border-border-warm bg-white p-4 shadow-[0_8px_24px_rgba(18,40,59,0.045)]"
          >
            <div className="text-[10px] font-bold tracking-wide text-muted-warm uppercase">
              {s.label}
            </div>
            <div className="mt-1.5 text-[24px] font-extrabold tracking-[-0.6px] text-charcoal">
              {fmtInt(s.value)}
            </div>
          </article>
        ))}
      </div>

      <section className="rounded-[15px] border border-border-warm bg-white p-5 shadow-[0_8px_24px_rgba(18,40,59,0.045)]">
        <div className="mb-3.5 flex flex-wrap gap-1.5" role="tablist" aria-label="Filter status undangan">
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

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[160px] flex-1">
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
              placeholder="Cari judul atau slug..."
              aria-label="Cari undangan"
              className="h-9 w-full rounded-lg border border-border-warm bg-white pr-2 pl-8 text-xs text-charcoal outline-none focus-visible:border-teal"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as "newest" | "name");
              setPage(1);
            }}
            aria-label="Urutkan"
            className="h-9 rounded-lg border border-border-warm bg-white px-2.5 text-xs text-charcoal outline-none focus-visible:border-teal"
          >
            <option value="newest">Terbaru</option>
            <option value="name">Nama A–Z</option>
          </select>
        </div>

        {visible.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-warm">
              {items.length === 0
                ? "Belum ada undangan. Pilih template favoritmu untuk mulai."
                : "Undangan tidak ditemukan."}
            </p>
            {items.length === 0 ? (
              <Link
                href="/dashboard/template"
                className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg bg-teal px-3.5 text-[11px] font-bold text-white transition-colors hover:bg-teal-hover"
              >
                <Plus className="size-3.5" aria-hidden />
                Buat Undangan Pertama
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="grid gap-3">
            {pageItems.map((item) => (
              <InvitationCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {visible.length > 0 ? (
          <p className="mt-3 text-center text-[10px] text-muted-warm">
            Menampilkan {pageItems.length} dari {visible.length} undangan
          </p>
        ) : null}
        <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} label="Navigasi halaman undangan" />
      </section>
    </div>
  );
}
