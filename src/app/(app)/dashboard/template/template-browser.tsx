"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Eye, Search } from "lucide-react";
import { Pagination, paginate } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

export type TemplateCard = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  preview: string | null;
  categoryId: string;
  categoryName: string;
};

export type CategoryChip = { id: string; name: string };

const FALLBACK_EMOJI = "❀";
const PER_PAGE = 9;

function fmtCount(n: number) {
  return n.toLocaleString("id-ID");
}

export function TemplateBrowser({
  templates,
  categories,
}: {
  templates: TemplateCard[];
  categories: CategoryChip[];
}) {
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return templates.filter((t) => {
      const matchCat = !category || t.categoryId === category;
      const matchQ =
        !q ||
        t.name.toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q) ||
        t.categoryName.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [templates, category, search]);

  const totalPages = Math.max(1, Math.ceil(visible.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageItems = paginate(visible, safePage, PER_PAGE);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[25px] font-bold tracking-[-0.7px] text-charcoal">Pilih Template</h1>
        <p className="mt-1.5 text-xs text-muted-warm">
          Desain undangan siap pakai — warna &amp; isinya tetap bisa disesuaikan setelah dibuat.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
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
            placeholder="Cari template..."
            aria-label="Cari template"
            className="h-9 w-full rounded-lg border border-border-warm bg-white pr-2 pl-8 text-xs text-charcoal outline-none focus-visible:border-teal"
          />
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-1.5" role="tablist" aria-label="Filter kategori">
        <button
          key="all"
          type="button"
          role="tab"
          aria-selected={category === ""}
          onClick={() => {
            setCategory("");
            setPage(1);
          }}
          className={cn(
            "rounded-full px-3.5 py-2 text-[11px] font-semibold transition-colors",
            category === ""
              ? "bg-teal text-white"
              : "border border-transparent bg-[#f3f6f8] text-[#657587] hover:text-charcoal",
          )}
        >
          Semua ({fmtCount(templates.length)})
        </button>
        {categories.map((c) => {
          const n = templates.filter((t) => t.categoryId === c.id).length;
          if (n === 0) return null;
          return (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={category === c.id}
              onClick={() => {
                setCategory(c.id);
                setPage(1);
              }}
              className={cn(
                "rounded-full px-3.5 py-2 text-[11px] font-semibold transition-colors",
                category === c.id
                  ? "bg-teal text-white"
                  : "border border-transparent bg-[#f3f6f8] text-[#657587] hover:text-charcoal",
              )}
            >
              {c.name} ({fmtCount(n)})
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-[15px] border border-border-warm bg-white py-14 text-center shadow-[0_8px_24px_rgba(18,40,59,0.045)]">
          <p className="text-sm text-muted-warm">Template tidak ditemukan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pageItems.map((tpl) => (
            <Link
              key={tpl.id}
              href={`/dashboard/baru?template=${tpl.id}`}
              className="group overflow-hidden rounded-[15px] border border-border-warm bg-white shadow-[0_8px_24px_rgba(18,40,59,0.045)] transition-all hover:-translate-y-0.5 hover:border-teal/50 hover:shadow-[0_12px_28px_rgba(13,148,136,0.12)]"
            >
              <div className="relative aspect-[16/11] overflow-hidden bg-gradient-to-br from-[#e6f3ef] to-[#fdfaf5]">
                {tpl.preview ? (
                  <Image
                    src={tpl.preview}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                ) : (
                  <span
                    className="absolute inset-0 grid place-items-center text-[42px] text-teal/60"
                    aria-hidden
                  >
                    {FALLBACK_EMOJI}
                  </span>
                )}
                <span className="absolute top-2.5 left-2.5 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-teal-dark backdrop-blur-sm">
                  {tpl.categoryName}
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate text-[15px] font-bold tracking-[-0.2px] text-charcoal group-hover:text-teal">
                    {tpl.name}
                  </h3>
                  <ArrowRight
                    className="size-4 shrink-0 text-[#a2b0b7] transition-all group-hover:translate-x-0.5 group-hover:text-teal"
                    aria-hidden
                  />
                </div>
                {tpl.description ? (
                  <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-warm">
                    {tpl.description}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex h-8 items-center rounded-lg bg-teal-soft px-3 text-[11px] font-bold text-teal-dark">
                    Gunakan Template →
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.open(`/template/${tpl.slug}/live`, "_blank", "noopener,noreferrer");
                    }}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#d8e3e8] bg-white px-2.5 text-[11px] font-bold text-charcoal transition-colors hover:border-teal hover:text-teal"
                  >
                    <Eye className="size-3.5" aria-hidden />
                    Lihat Demo
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {visible.length > 0 ? (
        <p className="mt-4 text-center text-[10px] text-muted-warm">
          Menampilkan {pageItems.length} dari {visible.length} template
        </p>
      ) : null}
      <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} label="Navigasi halaman template" />

      <p className="mt-6 text-center text-[11px] text-muted-warm">
        Setelah memilih template, Anda akan mengisi nama undangan lalu membuka editor.
      </p>
    </div>
  );
}
