"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const ELLIPSIS = "…";

function buildPages(page: number, totalPages: number): Array<number | "…"> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: Array<number | "…"> = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  if (start > 2) pages.push("…");
  for (let i = start; i <= end; i += 1) pages.push(i);
  if (end < totalPages - 1) pages.push("…");
  pages.push(totalPages);
  return pages;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  className,
  label = "Navigasi halaman",
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  label?: string;
}) {
  if (totalPages <= 1) return null;

  const go = (next: number) => {
    const clamped = Math.min(Math.max(next, 1), totalPages);
    if (clamped !== page) onPageChange(clamped);
  };

  return (
    <nav
      aria-label={label}
      className={cn("flex flex-wrap items-center justify-center gap-1.5 pt-4", className)}
    >
      <button
        type="button"
        onClick={() => go(page - 1)}
        disabled={page <= 1}
        aria-label="Halaman sebelumnya"
        className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#e4ebee] bg-white px-2.5 text-[11px] font-bold text-charcoal transition-colors hover:border-teal hover:text-teal disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronLeft className="size-3.5" aria-hidden />
        Prev
      </button>

      {buildPages(page, totalPages).map((item, idx) =>
        item === ELLIPSIS ? (
          <span
            key={`e-${idx}`}
            aria-hidden
            className="px-1.5 text-[11px] font-semibold text-[#9aabb7]"
          >
            {ELLIPSIS}
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => go(item)}
            aria-current={item === page ? "page" : undefined}
            aria-label={`Halaman ${item}`}
            className={cn(
              "inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-[11px] font-bold transition-colors",
              item === page
                ? "bg-teal text-white shadow-[0_3px_8px_rgba(13,148,136,0.18)]"
                : "border border-[#e4ebee] bg-white text-charcoal hover:border-teal hover:text-teal",
            )}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => go(page + 1)}
        disabled={page >= totalPages}
        aria-label="Halaman berikutnya"
        className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#e4ebee] bg-white px-2.5 text-[11px] font-bold text-charcoal transition-colors hover:border-teal hover:text-teal disabled:pointer-events-none disabled:opacity-40"
      >
        Next
        <ChevronRight className="size-3.5" aria-hidden />
      </button>
    </nav>
  );
}

/** Potong array sesuai halaman aktif (1-based). */
export function paginate<T>(items: T[], page: number, perPage: number): T[] {
  const start = (page - 1) * perPage;
  return items.slice(start, start + perPage);
}
