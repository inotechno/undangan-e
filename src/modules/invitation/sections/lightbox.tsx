"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LightboxItem {
  image: string;
  caption?: string;
}

/**
 * Lightbox fullscreen: swipe kiri/kanan, zoom (klik/dblclick), keyboard nav.
 */
export function Lightbox({
  items,
  index,
  onClose,
  onNavigate,
}: {
  items: LightboxItem[];
  index: number;
  onClose: () => void;
  onNavigate: (idx: number) => void;
}) {
  const [zoomed, setZoomed] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const item = items[index];

  const prev = useCallback(() => {
    if (index > 0) onNavigate(index - 1);
  }, [index, onNavigate]);

  const next = useCallback(() => {
    if (index < items.length - 1) onNavigate(index + 1);
  }, [index, items.length, onNavigate]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, prev, next]);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Close */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
        aria-label="Tutup"
      >
        <X className="size-6" aria-hidden />
      </button>

      {/* Counter */}
      <span className="absolute top-5 left-1/2 z-10 -translate-x-1/2 text-sm font-medium text-white/70">
        {index + 1} / {items.length}
      </span>

      {/* Prev */}
      {index > 0 ? (
        <button
          type="button"
          onClick={prev}
          className="absolute left-3 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 sm:left-6"
          aria-label="Sebelumnya"
        >
          <ChevronLeft className="size-7" aria-hidden />
        </button>
      ) : null}

      {/* Next */}
      {index < items.length - 1 ? (
        <button
          type="button"
          onClick={next}
          className="absolute right-3 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 sm:right-6"
          aria-label="Selanjutnya"
        >
          <ChevronRight className="size-7" aria-hidden />
        </button>
      ) : null}

      {/* Image */}
      <figure
        className="relative max-h-[85vh] max-w-[92vw] select-none"
        onTouchStart={(e) => setTouchStart(e.touches[0]!.clientX)}
        onTouchEnd={(e) => {
          if (touchStart === null) return;
          const diff = e.changedTouches[0]!.clientX - touchStart;
          if (diff > 50) prev();
          else if (diff < -50) next();
          setTouchStart(null);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image}
          alt={item.caption ?? `Foto ${index + 1}`}
          onClick={() => setZoomed((z) => !z)}
          className={cn(
            "max-h-[85vh] max-w-[92vw] rounded-lg object-contain transition-transform duration-300",
            zoomed ? "scale-150 cursor-zoom-out" : "cursor-zoom-in",
          )}
          draggable={false}
        />

        {/* Zoom hint */}
        <button
          type="button"
          onClick={() => setZoomed((z) => !z)}
          className="absolute right-2 bottom-2 rounded-full bg-black/50 p-2 text-white/80 transition-colors hover:bg-black/70"
          aria-label={zoomed ? "Zoom out" : "Zoom in"}
        >
          {zoomed ? <ZoomOut className="size-4" aria-hidden /> : <ZoomIn className="size-4" aria-hidden />}
        </button>

        {item.caption ? (
          <figcaption className="mt-3 text-center text-sm text-white/70">
            {item.caption}
          </figcaption>
        ) : null}
      </figure>
    </div>
  );
}
