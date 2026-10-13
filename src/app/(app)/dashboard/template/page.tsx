import { asc, eq } from "drizzle-orm";
import { requireAuth } from "@/auth/guard";
import { db, schema } from "@/db";
import { TemplateBrowser, type CategoryChip, type TemplateCard } from "./template-browser";

export const metadata = { title: "Pilih Template" };

/** Halaman privat: selalu dinamis (cek sesi + katalog per request). */
export const instant = false;

export default async function TemplateGalleryPage() {
  await requireAuth();

  const [tplRows, catRows] = await Promise.all([
    db
      .select({
        id: schema.templates.id,
        slug: schema.templates.slug,
        name: schema.templates.name,
        description: schema.templates.description,
        preview: schema.templates.previewImageKey,
        categoryId: schema.templates.categoryId,
        categoryName: schema.categories.nameId,
      })
      .from(schema.templates)
      .innerJoin(schema.categories, eq(schema.templates.categoryId, schema.categories.id))
      .where(eq(schema.templates.status, "active"))
      .orderBy(asc(schema.templates.sort), asc(schema.templates.name)),
    db
      .select({
        id: schema.categories.id,
        name: schema.categories.nameId,
      })
      .from(schema.categories)
      .where(eq(schema.categories.active, true))
      .orderBy(asc(schema.categories.sort), asc(schema.categories.nameId)),
  ]);

  const templates: TemplateCard[] = tplRows.map((t) => ({
    id: t.id,
    slug: t.slug,
    name: t.name,
    description: t.description,
    preview: t.preview,
    categoryId: t.categoryId,
    categoryName: t.categoryName,
  }));
  const categories: CategoryChip[] = catRows.map((c) => ({ id: c.id, name: c.name }));

  return <TemplateBrowser templates={templates} categories={categories} />;
}
