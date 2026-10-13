import Link from "next/link";
import { redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAuth } from "@/auth/guard";
import { NewInvitationForm } from "./new-invitation-form";

export const metadata = { title: "Buat Undangan Baru" };

/** Halaman privat: selalu dinamis (sesi + katalog per request). */
export const instant = false;

export default async function NewInvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  await requireAuth();
  const sp = await searchParams;

  const [rows, catRows] = await Promise.all([
    db
      .select({
        id: schema.templates.id,
        slug: schema.templates.slug,
        name: schema.templates.name,
        description: schema.templates.description,
        previewImage: schema.templates.previewImageKey,
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

  if (rows.length === 0) redirect("/dashboard");

  const preselected = sp.template ? rows.find((t) => t.id === sp.template) : undefined;
  const categories = catRows
    .filter((c) => rows.some((t) => t.categoryId === c.id))
    .map((c) => ({ id: c.id, name: c.name }));

  return (
    <div>
      <nav className="mb-4">
        <Link
          href="/dashboard/template"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-warm transition-colors hover:text-charcoal"
        >
          ← Kembali ke katalog
        </Link>
      </nav>
      <NewInvitationForm
        templates={rows}
        categories={categories}
        initialTemplateId={preselected?.id ?? rows[0]?.id ?? ""}
      />
    </div>
  );
}
