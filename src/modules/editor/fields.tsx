"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function Field({
  label,
  hint,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor} className="text-xs font-semibold">
        {label}
      </Label>
      {hint ? <p className="text-muted-warm mt-0.5 mb-1.5 text-[11px]">{hint}</p> : null}
      {children}
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  hint,
  placeholder,
  type = "text",
  className,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  placeholder?: string;
  type?: string;
  className?: string;
  error?: string;
}) {
  const id = `f-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn("h-10", error && "border-red-400", className)}
      />
      {error ? <p className="mt-1 text-[11px] text-red-600">{error}</p> : null}
    </Field>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  hint,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  placeholder?: string;
  rows?: number;
}) {
  const id = `f-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <Textarea
        id={id}
        value={value}
        placeholder={placeholder}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm"
      />
    </Field>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  const id = `f-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <Field label={label} htmlFor={id}>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-input bg-background h-10 w-full rounded-lg border px-3 text-sm"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label className="text-xs font-semibold">{label}</Label>
      <div className="mt-1.5 flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="size-9 shrink-0 cursor-pointer rounded-md border bg-white p-0.5"
          aria-label={`Pilih warna ${label}`}
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 font-mono text-xs"
        />
      </div>
    </div>
  );
}

/** Input gambar: upload ke /api/invitations/[id]/media atau ketik URL manual. */
export function MediaField({
  label,
  value,
  onChange,
  invitationId,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  invitationId: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/invitations/${invitationId}/media`, {
        method: "POST",
        body: fd,
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Upload gagal");
        return;
      }
      onChange(data.url);
    } catch {
      setError("Gagal terhubung ke server");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Label className="text-xs font-semibold">{label}</Label>
      <div className="mt-1.5 flex items-start gap-3">
        <div className="bg-muted relative size-16 shrink-0 overflow-hidden rounded-lg border">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element -- pratinjau media user
            <img key={value} src={value} alt="" className="size-full object-cover" />
          ) : (
            <ImagePlus className="text-muted-warm absolute top-1/2 left-1/2 size-5 -translate-x-1/2 -translate-y-1/2" aria-hidden />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="URL gambar atau upload…"
            className="h-9 text-xs"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="border-input bg-background inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-medium hover:bg-muted disabled:opacity-60"
            >
              {busy ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <ImagePlus className="size-3.5" aria-hidden />}
              Upload gambar
            </button>
            {value ? (
              <button
                type="button"
                onClick={() => onChange("")}
                className="text-muted-warm text-xs hover:text-red-600"
              >
                Hapus
              </button>
            ) : null}
          </div>
          {hint ? <p className="text-muted-warm text-[11px]">{hint}</p> : null}
          {error ? <p className="text-[11px] text-red-600">{error}</p> : null}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
