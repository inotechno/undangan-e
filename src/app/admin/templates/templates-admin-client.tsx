"use client";

import Image from "next/image";
import { useState } from "react";
import { Pagination, paginate } from "@/components/ui/pagination";

export type AdminTemplateRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  sort: number;
  preview: string | null;
  categoryName: string | null;
};

const PER_PAGE = 10;

export function AdminTemplatesClient({ rows }: { rows: AdminTemplateRow[] }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const visible = paginate(rows, safePage, PER_PAGE);

  return (
    <section className="mb-4 rounded-xl border border-[#e4ebee] bg-white p-5 shadow-[0_7px_22px_rgba(21,48,65,0.04)]">
      <h2 className="mb-4 text-[15px] font-bold">Katalog Template</h2>
      <div className="grid gap-2.5">
        {visible.map((t) => (
          <article key={t.id} className="rounded-xl border border-[#e4ebee] bg-[#fafcfc] p-4">
            <div className="flex flex-wrap items-start gap-3.5">
              <div className="relative h-[84px] w-[64px] shrink-0 overflow-hidden rounded-lg border border-[#e3eeeb] bg-gradient-to-br from-[#e6f3ef] to-[#fdfaf5]">
                {t.preview ? (
                  <Image src={t.preview} alt="" fill sizes="64px" className="object-cover" />
                ) : (
                  <span className="absolute inset-0 grid place-items-center text-xl text-teal/60" aria-hidden>
                    ✉
                  </span>
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <strong className="block text-xs">{t.name}</strong>
                  <small className="block text-[10px] text-[#687b88]">{t.description}</small>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                  <a
                    href={`/admin/templates/${t.id}`}
                    className="rounded-md bg-teal px-2 py-1 text-[10px] font-bold text-white transition-colors hover:bg-teal-dark"
                  >
                    Kelola
                  </a>
                  <a
                    href={`/template/${t.slug}/live`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md border border-[#e4ebee] bg-white px-2 py-1 text-[10px] font-bold text-[#536a78] transition-colors hover:border-teal hover:text-teal"
                  >
                    Demo
                  </a>
                  <span
                    className={
                      "rounded-full px-2 py-[3px] text-[10px] font-bold " +
                      (t.status === "active" ? "bg-[#e9f8ef] text-[#15803d]" : "bg-[#f0f3f6] text-[#607080]")
                    }
                  >
                    {t.status === "active" ? "Terbit" : "Tersembunyi"}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-[#eef2f4] pt-3 sm:grid-cols-3">
              {[
                { label: "Slug", value: <span className="text-teal-dark">{t.slug}</span> },
                { label: "Kategori", value: t.categoryName ?? "—" },
                { label: "Urutan", value: t.sort },
              ].map((f) => (
                <div key={f.label}>
                  <div className="text-[9px] font-bold tracking-wide text-[#9aabb7] uppercase">{f.label}</div>
                  <div className="mt-0.5 text-[11px] text-[#425968]">{f.value}</div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      {rows.length > 0 ? (
        <p className="mt-3 text-center text-[10px] text-[#9aabb7]">
          Menampilkan {visible.length} dari {rows.length} template
        </p>
      ) : null}
      <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} label="Navigasi halaman template" />
    </section>
  );
}
