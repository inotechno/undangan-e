import type { Metadata } from "next";
import { count, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/auth/guard";
import { AdminTemplatesClient } from "./templates-admin-client";

export const instant = false;

export const metadata: Metadata = {
  title: "Template — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminTemplatesPage() {
  await requireAdmin();
  const rows = await db
    .select({
      id: schema.templates.id,
      name: schema.templates.name,
      slug: schema.templates.slug,
      description: schema.templates.description,
      status: schema.templates.status,
      sort: schema.templates.sort,
      preview: schema.templates.previewImageKey,
      categoryName: schema.categories.nameId,
    })
    .from(schema.templates)
    .leftJoin(schema.categories, eq(schema.templates.categoryId, schema.categories.id))
    .orderBy(schema.templates.sort);

  const categoryRows = await db
    .select({
      id: schema.categories.id,
      name: schema.categories.nameId,
      slug: schema.categories.slug,
      count: count(schema.templates.id),
    })
    .from(schema.categories)
    .leftJoin(schema.templates, eq(schema.templates.categoryId, schema.categories.id))
    .groupBy(schema.categories.id, schema.categories.nameId, schema.categories.slug, schema.categories.sort)
    .orderBy(schema.categories.sort);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[25px] font-bold tracking-[-0.7px]">Template & Kategori</h1>
        <p className="mt-1.5 text-xs text-[#687b88]">Katalog template aktif dan kategori acara.</p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Total Template", value: rows.length },
          { label: "Aktif", value: rows.filter((r) => r.status === "active").length },
          { label: "Kategori", value: categoryRows.length },
          { label: "Batch 1", value: Math.min(rows.length, 6), note: "Siap dipakai" },
        ].map((s) => (
          <article
            key={s.label}
            className="rounded-xl border border-[#e4ebee] bg-white p-4 shadow-[0_7px_22px_rgba(21,48,65,0.04)]"
          >
            <div className="text-[10px] font-bold tracking-wide text-[#687b88] uppercase">{s.label}</div>
            <div className="mt-1.5 text-[24px] font-extrabold tracking-[-0.6px]">{s.value}</div>
            {s.note ? <div className="mt-1 text-[10px] text-[#687b88]">{s.note}</div> : null}
          </article>
        ))}
      </div>

      <AdminTemplatesClient
        rows={rows.map((t) => ({
          id: t.id,
          name: t.name,
          slug: t.slug,
          description: t.description,
          status: t.status,
          sort: t.sort,
          preview: t.preview,
          categoryName: t.categoryName,
        }))}
      />

      <section className="rounded-xl border border-[#e4ebee] bg-white p-5 shadow-[0_7px_22px_rgba(21,48,65,0.04)]">
        <h2 className="mb-4 text-[15px] font-bold">Kategori Acara</h2>
        <div className="grid gap-2.5">
          {categoryRows.map((c) => (
            <article
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e4ebee] bg-[#fafcfc] p-4"
            >
              <div className="min-w-0">
                <strong className="block text-xs">{c.name}</strong>
                <small className="block text-[10px] text-teal-dark">{c.slug}</small>
              </div>
              <span className="shrink-0 rounded-full bg-[#f0f4f5] px-2.5 py-1 text-[10px] font-bold text-[#607080]">
                {Number(c.count)} template
              </span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
