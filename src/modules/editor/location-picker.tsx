"use client";

import { Loader2, MapPin, Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";

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

export function LocationPicker({ lat, lng, onChange }: LocationPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const boxRef = useRef<HTMLDivElement>(null);

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
  }

  function clear() {
    setQuery("");
    setResults([]);
    setOpen(false);
    onChange(undefined, undefined, "");
  }

  const hasPin = lat != null && lng != null;
  const embedUrl = hasPin
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng! - 0.005}%2C${lat! - 0.003}%2C${lng! + 0.005}%2C${lat! + 0.003}&layer=mapnik&marker=${lat}%2C${lng}`
    : null;

  return (
    <div ref={boxRef} className="relative space-y-2">
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
        <ul className="absolute z-50 max-h-48 w-full overflow-auto rounded-lg border border-border-warm bg-white shadow-lg">
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
        <div className="overflow-hidden rounded-lg border border-border-warm">
          <iframe src={embedUrl} className="h-40 w-full" loading="lazy" title="Pratinjau lokasi" />
        </div>
      ) : null}
    </div>
  );
}
