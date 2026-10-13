"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  LABELABLE_SECTIONS,
  SECTION_DEFAULT_LABELS,
  SECTION_LABELS,
  type SectionId,
  type SectionLabels,
} from "@/modules/invitation";

export interface TemplateEditInitial {
  id: string;
  slug: string;
  name: string;
  description: string;
  categoryId: string;
  previewImageKey: string;
  sectionLabels: SectionLabels;
  status: "active" | "hidden";
  sort: number;
  layout: "full_bleed" | "curtain" | "frame_device" | "slider";
  categories: { id: string; name: string; slug: string }[];
}

const labelCls = "text-[10px] font-bold tracking-wide text-[#687b88] uppercase";
const inputCls =
  "mt-1 h-9 w-full rounded-lg border border-[#e4ebee] bg-white px-2.5 text-xs outline-none focus-visible:border-teal";
const cardCls = "rounded-xl border border-[#e4ebee] bg-white p-5 shadow-[0_7px_22px_rgba(21,48,65,0.04)]";

export function TemplateEditForm({ initial }: { initial: TemplateEditInitial }) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [categoryId, setCategoryId] = useState(initial.categoryId);
  const [status, setStatus] = useState(initial.status);
  const [sort, setSort] = useState(String(initial.sort));
  const [preview, setPreview] = useState(initial.previewImageKey);
  const [labels, setLabels] = useState<SectionLabels>(initial.sectionLabels);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  function setLabel(id: SectionId, field: "eyebrow" | "title", value: string) {
    setLabels((prev) => {
      const next = { ...prev };
      const cur = { ...(next[id] ?? {}) };
      if (value) cur[field] = value;
      else delete cur[field];
      if (cur.eyebrow || cur.title) next[id] = cur;
      else delete next[id];
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/templates/${initial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          categoryId,
          status,
          sort: Number(sort) || 0,
          previewImageKey: preview.trim() || null,
          sectionLabels: labels,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMsg({ tone: "err", text: data.error ?? "Gagal menyimpan" });
        return;
      }
      setMsg({ tone: "ok", text: "Template tersimpan" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <section className={cardCls}>
        <h2 className="mb-4 text-[15px] font-bold">Informasi Template</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className={labelCls}>Nama</span>
            <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} className={inputCls} />
          </label>
          <label className="block">
            <span className={labelCls}>Kategori</span>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputCls}>
              {initial.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className={labelCls}>Deskripsi</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              maxLength={200}
              className="mt-1 w-full rounded-lg border border-[#e4ebee] bg-white px-2.5 py-2 text-xs outline-none focus-visible:border-teal"
            />
          </label>
          <label className="block">
            <span className={labelCls}>Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "active" | "hidden")}
              className={inputCls}
            >
              <option value="active">Terbit</option>
              <option value="hidden">Tersembunyi</option>
            </select>
          </label>
          <label className="block">
            <span className={labelCls}>Urutan</span>
            <input
              value={sort}
              onChange={(e) => setSort(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              className={inputCls}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className={labelCls}>Gambar thumbnail (URL)</span>
            <input value={preview} onChange={(e) => setPreview(e.target.value)} className={inputCls} placeholder="/templates/slug.png" />
          </label>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="relative h-[84px] w-[64px] shrink-0 overflow-hidden rounded-lg border border-[#e3eeeb] bg-gradient-to-br from-[#e6f3ef] to-[#fdfaf5]">
            {preview ? (
              <Image src={preview} alt="" fill sizes="64px" className="object-cover" />
            ) : (
              <span className="absolute inset-0 grid place-items-center text-xl text-teal/60" aria-hidden>
                ✉
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#687b88]">
            Kosongkan untuk memakai gambar bawaan. File statis di <code className="text-teal-dark">/templates/</code>.
          </p>
        </div>
      </section>

      <section className={cardCls}>
        <h2 className="text-[15px] font-bold">Label Judul Section</h2>
        <p className="mt-0.5 text-[11px] text-[#687b88]">
          Eyebrow & judul yang tampil di tiap section undangan. Kosongkan untuk memakai judul bawaan.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {LABELABLE_SECTIONS.map((id) => {
            const def = SECTION_DEFAULT_LABELS[id];
            const cur = labels[id] ?? {};
            return (
              <div key={id} className="rounded-lg border border-[#eef2f4] bg-[#fafcfc] p-3">
                <div className="mb-2 text-[11px] font-bold text-[#142c3c]">{SECTION_LABELS[id]}</div>
                <div className="grid gap-2">
                  <label className="block">
                    <span className={labelCls}>Eyebrow</span>
                    <input
                      value={cur.eyebrow ?? ""}
                      onChange={(e) => setLabel(id, "eyebrow", e.target.value)}
                      placeholder={def?.eyebrow ?? ""}
                      maxLength={80}
                      className="mt-1 h-8 w-full rounded-md border border-[#e4ebee] bg-white px-2 text-[11px] outline-none focus-visible:border-teal"
                    />
                  </label>
                  <label className="block">
                    <span className={labelCls}>Judul</span>
                    <input
                      value={cur.title ?? ""}
                      onChange={(e) => setLabel(id, "title", e.target.value)}
                      placeholder={def?.title ?? ""}
                      maxLength={80}
                      className="mt-1 h-8 w-full rounded-md border border-[#e4ebee] bg-white px-2 text-[11px] outline-none focus-visible:border-teal"
                    />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-9 items-center rounded-lg bg-teal px-5 text-xs font-bold text-white transition-colors hover:bg-teal-dark disabled:opacity-50"
        >
          {busy ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
        {msg ? (
          <span
            className={`rounded-lg px-3 py-2 text-[11px] font-semibold ${
              msg.tone === "ok" ? "bg-[#e9f8ef] text-[#15803d]" : "bg-[#fff0f2] text-[#be123c]"
            }`}
          >
            {msg.text}
          </span>
        ) : null}
      </div>
    </form>
  );
}
