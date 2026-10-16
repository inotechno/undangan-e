"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { TEMPLATE_REGISTRY } from "@/modules/invitation";

const CARDS = Object.values(TEMPLATE_REGISTRY).map((t) => ({
  slug: t.slug,
  name: t.name,
  category: t.category,
  description: t.description,
  signature: t.signature,
  layout: t.layout,
  preview: t.previewImage,
}));

const CATEGORIES = Array.from(new Set(CARDS.map((t) => t.category)));

export function TemplateGallery() {
  const searchParams = useSearchParams();
  const [category, setCategory] = useState(() => {
    const k = searchParams.get("kategori") ?? "";
    return CATEGORIES.includes(k) ? k : "";
  });
  const [search, setSearch] = useState("");

  const changeCategory = (cat: string) => {
    setCategory(cat);
    const url = new URL(window.location.href);
    if (cat) url.searchParams.set("kategori", cat);
    else url.searchParams.delete("kategori");
    window.history.replaceState(null, "", url);
  };

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return CARDS.filter((t) => {
      const matchCat = !category || t.category === category;
      const matchQ =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.signature.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [category, search]);

  return (
    <div>
      <div className="relative mb-5 max-w-md">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#8a99a6]"
          aria-hidden
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari template..."
          aria-label="Cari template"
          className="h-10 w-full rounded-full border border-border-warm bg-white pr-4 pl-9 text-sm text-charcoal outline-none focus-visible:border-teal"
        />
      </div>

      <div className="flex flex-wrap justify-center gap-2" role="tablist" aria-label="Filter kategori">
        <button
          type="button"
          role="tab"
          aria-selected={category === ""}
          onClick={() => changeCategory("")}
          className={cn(
            "rounded-full px-4 py-2 text-xs font-semibold transition-colors",
            category === ""
              ? "bg-teal text-white"
              : "border border-border-warm bg-white text-[#657587] hover:border-teal hover:text-teal",
          )}
        >
          Semua ({CARDS.length})
        </button>
        {CATEGORIES.map((cat) => {
          const n = CARDS.filter((t) => t.category === cat).length;
          return (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={category === cat}
              onClick={() => changeCategory(cat)}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-semibold transition-colors",
                category === cat
                  ? "bg-teal text-white"
                  : "border border-border-warm bg-white text-[#657587] hover:border-teal hover:text-teal",
              )}
            >
              {cat} ({n})
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <div className="mt-10 rounded-xl border border-border-warm bg-surface py-14 text-center">
          <p className="text-sm text-muted-warm">Template tidak ditemukan.</p>
        </div>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((tpl) => (
            <article
              key={tpl.slug}
              className="group flex h-full flex-col overflow-hidden rounded-xl border border-border-warm bg-surface transition-all hover:-translate-y-0.5 hover:border-teal/50 hover:shadow-[0_12px_28px_rgba(13,148,136,0.12)]"
            >
              <Link
                href={`/template/${tpl.slug}`}
                className="relative flex aspect-[4/5] items-center justify-center overflow-hidden bg-muted focus-visible:outline-2 focus-visible:outline-teal"
              >
                <Image
                  src={tpl.preview}
                  alt={`Pratinjau template ${tpl.name}`}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
                <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-teal-dark backdrop-blur-sm">
                  {tpl.category}
                </span>
              </Link>
              <div className="flex flex-1 flex-col gap-2 p-5">
                <h2 className="text-base font-semibold text-charcoal">{tpl.name}</h2>
                <p className="text-sm leading-6 text-muted-warm">{tpl.signature}</p>
                <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
                  <Link
                    href={`/template/${tpl.slug}`}
                    className="inline-flex h-9 items-center rounded-lg bg-teal px-4 text-xs font-bold text-white transition-colors hover:bg-teal-hover"
                  >
                    Lihat Detail →
                  </Link>
                  <button
                    type="button"
                    onClick={() => window.open(`/template/${tpl.slug}/live`, "_blank", "noopener,noreferrer")}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#d8e3e8] bg-white px-3 text-xs font-bold text-charcoal transition-colors hover:border-teal hover:text-teal"
                  >
                    <Eye className="size-3.5" aria-hidden />
                    Demo POV Tamu
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
