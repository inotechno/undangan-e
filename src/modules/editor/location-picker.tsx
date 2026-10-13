"use client";

import { CheckCircle2, Loader2, MapPin, MousePointerClick, Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
}

interface LocationPickerProps {
  lat?: number;
  lng?: number;
  onChange: (lat?: number, lng?: number, label?: string) => void;
}

const BBOX_PAD_LNG = 0.005;
const BBOX_PAD_LAT = 0.003;

export function LocationPicker({ lat, lng, onChange }: LocationPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [pickMode, setPickMode] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const boxRef = useRef<HTMLDivElement>(null);
  const mapWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 3) { setResults([]); setOpen(false); return; }
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(q)}`,
        { headers: { Accept: "application/json" } },
      );
      const data = (await res.json()) as NominatimResult[];
      setResults(data);
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  function onQueryChange(v: string) {
    setQuery(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void search(v), 400);
  }

  function pick(r: NominatimResult) {
    const la = parseFloat(r.lat);
    const lo = parseFloat(r.lon);
    const label = r.name || r.display_name.split(",").slice(0, 2).join(",").trim();
    onChange(la, lo, label);
    setQuery(r.display_name);
    setOpen(false);
    setPickMode(false);
  }

  function clear() {
    setQuery("");
    setResults([]);
    setOpen(false);
    setPickMode(false);
    onChange(undefined, undefined, "");
  }

  function onMapClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!pickMode || lat == null || lng == null || !mapWrapRef.current) return;
    const rect = mapWrapRef.current.getBoundingClientRect();
    const fx = (e.clientX - rect.left) / rect.width;
    const fy = (e.clientY - rect.top) / rect.height;
    const west = lng - BBOX_PAD_LNG;
    const east = lng + BBOX_PAD_LNG;
    const north = lat + BBOX_PAD_LAT;
    const south = lat - BBOX_PAD_LAT;
    const newLng = west + fx * (east - west);
    const newLat = north - fy * (north - south);
    onChange(newLat, newLng, undefined);
    setPickMode(false);
  }

  const hasPin = lat != null && lng != null;
  const embedUrl = hasPin
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng! - BBOX_PAD_LNG}%2C${lat! - BBOX_PAD_LAT}%2C${lng! + BBOX_PAD_LNG}%2C${lat! + BBOX_PAD_LAT}&layer=mapnik&marker=${lat}%2C${lng}`
    : null;
  const gmapsUrl = hasPin ? `https://www.google.com/maps?q=${lat},${lng}` : null;

  return (
    <div ref={boxRef} className="relative space-y-2 sm:col-span-2">
      <Label className="text-xs font-semibold">Cari lokasi di peta</Label>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-[#8a99a6]" aria-hidden />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={() => { if (results.length) setOpen(true); }}
          placeholder="Ketik alamat atau nama tempat…"
          className="h-9 w-full rounded-lg border border-border-warm bg-white pr-8 pl-8 text-xs text-charcoal outline-none focus-visible:border-teal"
        />
        {query ? (
          <button type="button" onClick={clear} className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-warm hover:text-red-600" aria-label="Hapus lokasi">
            <X className="size-3.5" aria-hidden />
          </button>
        ) : null}
        {searching ? (
          <Loader2 className="absolute top-1/2 right-2 size-3.5 -translate-y-1/2 animate-spin text-teal" aria-hidden />
        ) : null}
      </div>
      {open && results.length > 0 ? (
        <ul className="absolute z-50 max-h-56 w-full overflow-auto rounded-lg border border-border-warm bg-white shadow-lg">
          {results.map((r, i) => (
            <li key={i}>
              <button type="button" onClick={() => pick(r)} className="w-full px-3 py-2 text-left text-xs hover:bg-[#f2f8f8]">
                <MapPin className="mr-1.5 inline size-3 text-teal" aria-hidden />
                {r.display_name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {embedUrl ? (
        <>
          <div
            ref={mapWrapRef}
            onClick={onMapClick}
            className={cn(
              "relative overflow-hidden rounded-lg border border-border-warm",
              pickMode && "cursor-crosshair ring-2 ring-teal/40",
            )}
          >
            <iframe
              src={embedUrl}
              className={cn("h-72 w-full sm:h-96", pickMode && "pointer-events-none")}
              loading="lazy"
              title="Pratinjau lokasi"
            />
            {pickMode ? (
              <div className="absolute inset-0 grid place-items-center bg-teal/10 backdrop-blur-[1px]">
                <p className="rounded-full bg-teal px-3 py-1.5 text-[11px] font-bold text-white shadow">
                  Klik titik tujuan di peta…
                </p>
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {hasPin ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-soft px-2.5 py-1 text-[10px] font-bold text-teal-dark">
                <CheckCircle2 className="size-3" aria-hidden />
                Tautan Google Maps terisi otomatis
              </span>
            ) : null}
            {hasPin ? (
              <a
                href={gmapsUrl!}
                target="_blank"
                rel="noreferrer"
                className="truncate text-[10px] font-semibold text-teal underline-offset-2 hover:underline"
              >
                {gmapsUrl}
              </a>
            ) : null}
            <button
              type="button"
              onClick={() => setPickMode((v) => !v)}
              className={cn(
                "ml-auto inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold transition-colors",
                pickMode
                  ? "border-teal bg-teal text-white"
                  : "border-border-warm text-[#536477] hover:border-teal/60 hover:text-teal",
              )}
            >
              <MousePointerClick className="size-3" aria-hidden />
              {pickMode ? "Mode klik aktif" : "Klik di peta"}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
