import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/auth/guard";
import { getTemplate } from "@/modules/invitation";
import { TemplateEditForm, type TemplateEditInitial } from "./template-edit-form";

export const instant = false;

export const metadata: Metadata = {
  title: "Kelola Template — Admin",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ id: string }> };

export default async function AdminTemplateEditPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;

  const [row] = await db
    .select({
      id: schema.templates.id,
      slug: schema.templates.slug,
      name: schema.templates.name,
      description: schema.templates.description,
      categoryId: schema.templates.categoryId,
      previewImageKey: schema.templates.previewImageKey,
      sectionLabels: schema.templates.sectionLabels,
      status: schema.templates.status,
      sort: schema.templates.sort,
    })
    .from(schema.templates)
    .where(eq(schema.templates.id, id))
    .limit(1);
  if (!row) notFound();

  const categories = await db
    .select({ id: schema.categories.id, name: schema.categories.nameId, slug: schema.categories.slug })
    .from(schema.categories)
    .orderBy(schema.categories.sort);

  const def = getTemplate(row.slug);

  const initial: TemplateEditInitial = {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? "",
    categoryId: row.categoryId,
    previewImageKey: row.previewImageKey ?? "",
    sectionLabels: (row.sectionLabels ?? {}) as TemplateEditInitial["sectionLabels"],
    status: row.status,
    sort: row.sort,
    layout: def?.layout ?? "full_bleed",
    categories,
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[25px] font-bold tracking-[-0.7px]">Kelola Template</h1>
          <p className="mt-1.5 text-xs text-[#687b88]">
            {row.name} <span className="font-mono text-teal-dark">/{row.slug}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/template/${row.slug}/live`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-[#e4ebee] bg-white px-3 py-1.5 text-xs font-bold text-[#536a78] transition-colors hover:border-teal hover:text-teal"
          >
            Demo POV Tamu
          </a>
          <Link
            href="/admin/templates"
            className="rounded-lg border border-[#e4ebee] bg-white px-3 py-1.5 text-xs font-bold text-[#536a78] transition-colors hover:border-teal hover:text-teal"
          >
            ← Kembali
          </Link>
        </div>
      </div>
      <TemplateEditForm initial={initial} />
    </div>
  );
}
