"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Eye, Loader2, Plus, Search } from "lucide-react";
import { Pagination, paginate } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

export interface TemplateOption {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  previewImage: string | null;
  categoryId: string;
  categoryName: string;
}

interface CategoryChip {
  id: string;
  name: string;
}

function Steps({ current }: { current: 1 | 2 }) {
  const steps = [
    { n: 1, label: "Nama" },
    { n: 2, label: "Template" },
  ];
  return (
    <ol className="flex items-center gap-2" aria-label="Langkah pembuatan">
      {steps.map((s, i) => (
        <li key={s.n} className="flex items-center gap-2">
          <span
            className={cn(
              "grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-extrabold",
              s.n === current
                ? "bg-teal text-white"
                : s.n < current
                  ? "bg-teal-soft text-teal-dark"
                  : "border border-border-warm bg-white text-muted-warm",
            )}
          >
            {s.n < current ? <Check className="size-3.5" strokeWidth={3} aria-hidden /> : s.n}
          </span>
          <span
            className={cn(
              "text-[11px] font-bold",
              s.n === current ? "text-charcoal" : "text-muted-warm",
            )}
          >
            {s.label}
          </span>
          {i < steps.length - 1 ? (
            <span className="mx-1 h-px w-6 bg-border-warm sm:w-10" aria-hidden />
          ) : null}
        </li>
      ))}
    </ol>
  );
}

const PER_PAGE = 10;

export function NewInvitationForm({
  templates,
  categories,
  initialTemplateId,
}: {
  templates: TemplateOption[];
  categories: CategoryChip[];
  initialTemplateId?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [templateId, setTemplateId] = useState(
    initialTemplateId && templates.some((t) => t.id === initialTemplateId)
      ? initialTemplateId
      : (templates[0]?.id ?? ""),
  );
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const selected = templates.find((t) => t.id === templateId) ?? null;
  const titleValid = title.trim().length >= 2;

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return templates.filter((t) => {
      const matchCat = !category || t.categoryId === category;
      const matchQ =
        !q ||
        t.name.toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [templates, category, search]);

  const totalPages = Math.max(1, Math.ceil(visible.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageItems = paginate(visible, safePage, PER_PAGE);

  const canSubmit = !!templateId && titleValid;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || pending) return;
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, title }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; id?: string };
      if (!res.ok || !data.id) {
        setError(data.error ?? "Gagal membuat undangan");
        return;
      }
      router.push(`/undangan/${data.id}`);
    } catch {
      setError("Gagal terhubung ke server");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <fieldset disabled={pending} className="disabled:opacity-70">
        {/* Header */}
        <header className="mb-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-[25px] font-bold tracking-[-0.7px] text-charcoal">
                Buat Undangan Baru
              </h1>
              <p className="mt-1.5 text-xs text-muted-warm">
                {step === 1
                  ? "Langkah 1 — beri nama undangan Anda."
                  : "Langkah 2 — pilih desain template yang diinginkan."}
              </p>
            </div>
            {step === 2 && selected ? (
              <a
                href={`/template/${selected.slug}/live`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-[#d8e3e8] bg-white px-3 text-[11px] font-bold text-charcoal transition-colors hover:border-teal hover:text-teal"
              >
                <Eye className="size-3.5" aria-hidden />
                Demo &quot;{selected.name}&quot;
              </a>
            ) : null}
          </div>
          <div className="mt-4">
            <Steps current={step} />
          </div>
        </header>

        {/* Step 1: Nama undangan */}
        {step === 1 ? (
          <section className="rounded-[15px] border border-border-warm bg-white p-5 shadow-[0_8px_24px_rgba(18,40,59,0.045)]">
            <label htmlFor="title" className="text-sm font-bold text-charcoal">
              Nama undangan
            </label>
            <p className="mt-1 mb-2.5 text-xs text-muted-warm">
              Mis. &quot;Dinda &amp; Raka&quot; — dipakai untuk judul &amp; alamat otomatis (slug).
            </p>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Dinda & Raka"
              required
              minLength={2}
              maxLength={80}
              autoFocus
              className="h-11 w-full max-w-lg rounded-[10px] border border-border-warm bg-white px-3.5 text-sm text-charcoal outline-none transition-colors placeholder:text-[#a9b6c0] focus-visible:border-teal"
            />
            {!titleValid && title.length > 0 ? (
              <p className="mt-1.5 text-[11px] text-red-600">Minimal 2 karakter.</p>
            ) : null}
          </section>
        ) : null}

        {/* Step 2: Pilih template */}
        {step === 2 ? (
          <section className="rounded-[15px] border border-border-warm bg-white p-5 pb-24 shadow-[0_8px_24px_rgba(18,40,59,0.045)] sm:pb-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-[15px] font-bold text-charcoal">Pilih template</h2>
                <p className="mt-0.5 text-[11px] text-muted-warm">
                  {templates.length} desain tersedia — warna &amp; isinya tetap bisa diubah.
                </p>
              </div>
              <div className="relative min-w-[160px]">
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

            {categories.length > 1 ? (
              <div
                className="mb-4 flex flex-wrap gap-1.5"
                role="tablist"
                aria-label="Filter kategori"
              >
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
                    "rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors",
                    category === ""
                      ? "bg-teal text-white"
                      : "border border-transparent bg-[#f3f6f8] text-[#657587] hover:text-charcoal",
                  )}
                >
                  Semua ({templates.length})
                </button>
                {categories.map((c) => {
                  const n = templates.filter((t) => t.categoryId === c.id).length;
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
                        "rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors",
                        category === c.id
                          ? "bg-teal text-white"
                          : "border border-transparent bg-[#f3f6f8] text-[#657587] hover:text-charcoal",
                      )}
                    >
                      {c.name} ({n})
                    </button>
                  );
                })}
              </div>
            ) : null}

            {visible.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-warm">
                Template tidak ditemukan.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {pageItems.map((tpl) => {
                  const active = templateId === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setTemplateId(tpl.id)}
                      aria-pressed={active}
                      className={cn(
                        "group overflow-hidden rounded-xl border text-left transition-all",
                        active
                          ? "border-teal ring-2 ring-teal/30"
                          : "border-border-warm hover:border-teal/50",
                      )}
                    >
                      <div className="bg-muted relative aspect-[3/4] overflow-hidden">
                        {tpl.previewImage ? (
                          <Image
                            src={tpl.previewImage}
                            alt=""
                            fill
                            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 20vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                          />
                        ) : (
                          <span
                            className="absolute inset-0 grid place-items-center text-3xl text-teal/50"
                            aria-hidden
                          >
                            ❀
                          </span>
                        )}
                        <span
                          className={cn(
                            "absolute top-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-bold text-[#536777] backdrop-blur-sm",
                            active && "bg-teal text-white",
                          )}
                        >
                          {tpl.categoryName}
                        </span>
                        {active ? (
                          <span className="absolute top-2 right-2 grid size-6 place-items-center rounded-full bg-teal text-white shadow-md">
                            <Check className="size-3.5" strokeWidth={3} aria-hidden />
                          </span>
                        ) : null}
                      </div>
                      <div className="p-2.5">
                        <p
                          className={cn(
                            "truncate text-xs font-bold",
                            active ? "text-teal-dark" : "text-charcoal",
                          )}
                        >
                          {tpl.name}
                        </p>
                        {tpl.description ? (
                          <p className="mt-0.5 line-clamp-2 text-[10px] leading-relaxed text-muted-warm">
                            {tpl.description}
                          </p>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {visible.length > 0 ? (
              <p className="mt-3 text-center text-[10px] text-muted-warm">
                Menampilkan {pageItems.length} dari {visible.length} template
              </p>
            ) : null}
            <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} label="Navigasi halaman template" />
          </section>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-lg bg-[#fff0f2] px-3 py-2.5 text-sm font-semibold text-[#be123c]" role="alert">
            {error}
          </p>
        ) : null}

        {/* Spacer supaya sticky bar tidak menutupi kartu terakhir di mobile */}
        <div className="h-4 sm:hidden" />
      </fieldset>

      {/* Action bar sticky */}
      <div className="sticky bottom-0 z-40 -mx-4 mt-5 border-t border-border-warm bg-white/95 px-4 py-3 shadow-[0_-6px_20px_rgba(18,40,59,0.06)] backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            {step === 2 && selected ? (
              <>
                <div className="relative hidden h-11 w-9 shrink-0 overflow-hidden rounded-md border border-border-warm bg-[#eef5f4] sm:block">
                  {selected.previewImage ? (
                    <Image
                      src={selected.previewImage}
                      alt=""
                      fill
                      sizes="36px"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold tracking-wide text-muted-warm uppercase">
                    Template terpilih
                  </div>
                  <div className="truncate text-xs font-bold text-charcoal">
                    {selected.name}
                  </div>
                </div>
              </>
            ) : step === 2 ? (
              <div className="min-w-0">
                <div className="text-[10px] font-bold tracking-wide text-muted-warm uppercase">
                  Pilih template dulu
                </div>
                <div className="truncate text-xs font-bold text-charcoal">—</div>
              </div>
            ) : (
              <div className="min-w-0">
                <div className="text-[10px] font-bold tracking-wide text-muted-warm uppercase">
                  Nama undangan
                </div>
                <div className="truncate text-xs font-bold text-charcoal">
                  {title.trim() || "—"}
                </div>
              </div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {step === 2 ? (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex h-11 items-center gap-1.5 rounded-[10px] border border-border-warm bg-white px-4 text-xs font-bold text-charcoal transition-colors hover:border-teal hover:text-teal"
              >
                <ArrowLeft className="size-4" aria-hidden />
                Kembali
              </button>
            ) : null}
            {step === 1 ? (
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!titleValid}
                className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-teal px-5 text-xs font-bold text-white shadow-[0_4px_10px_rgba(13,148,136,0.2)] transition-colors hover:bg-teal-hover disabled:cursor-not-allowed disabled:opacity-45"
              >
                Lanjut — Pilih Template
                <ArrowLeft className="size-4 rotate-180" aria-hidden />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!canSubmit || pending}
                className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-teal px-5 text-xs font-bold text-white shadow-[0_4px_10px_rgba(13,148,136,0.2)] transition-colors hover:bg-teal-hover disabled:cursor-not-allowed disabled:opacity-45"
              >
                {pending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Plus className="size-4" aria-hidden />
                )}
                Buat &amp; Buka Editor
              </button>
            )}
          </div>
        </div>
        {step === 1 && !titleValid && title.length > 0 ? (
          <p className="mt-1.5 text-[10px] text-muted-warm">
            Isi nama undangan dulu (min. 2 karakter).
          </p>
        ) : null}
        {step === 2 && !canSubmit && !pending ? (
          <p className="mt-1.5 text-[10px] text-muted-warm">
            Pilih template terlebih dahulu.
          </p>
        ) : null}
      </div>
    </form>
  );
}
