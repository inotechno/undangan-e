import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getSessionWithRoles } from "@/auth/guard";
import { writeAudit } from "@/modules/audit/log";
import { SECTION_IDS } from "@/modules/invitation";

export const instant = false;

type Ctx = { params: Promise<{ id: string }> };

const labelSchema = z.object({
  eyebrow: z.string().max(80).optional(),
  title: z.string().max(80).optional(),
});

const patchSchema = z
  .object({
    name: z.string().min(2).max(80).optional(),
    description: z.string().max(200).nullable().optional(),
    categoryId: z.string().uuid().optional(),
    status: z.enum(["active", "hidden"]).optional(),
    sort: z.number().int().min(0).max(9999).optional(),
    previewImageKey: z.string().max(400).nullable().optional(),
    sectionLabels: z.partialRecord(z.enum(SECTION_IDS), labelSchema).optional(),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), {
    message: "Tidak ada perubahan",
  });

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await getSessionWithRoles();
  if (!auth) return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  if (!auth.isAdmin) return NextResponse.json({ error: "Dilarang" }, { status: 403 });
  const { id } = await ctx.params;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON tidak valid" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Permintaan tidak valid" },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const set: Partial<typeof schema.templates.$inferInsert> = { updatedAt: new Date() };
  if (data.name !== undefined) set.name = data.name;
  if (data.description !== undefined) set.description = data.description;
  if (data.categoryId !== undefined) {
    const [cat] = await db
      .select({ id: schema.categories.id })
      .from(schema.categories)
      .where(eq(schema.categories.id, data.categoryId))
      .limit(1);
    if (!cat) return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });
    set.categoryId = data.categoryId;
  }
  if (data.status !== undefined) set.status = data.status;
  if (data.sort !== undefined) set.sort = data.sort;
  if (data.previewImageKey !== undefined) set.previewImageKey = data.previewImageKey;
  if (data.sectionLabels !== undefined) set.sectionLabels = data.sectionLabels;

  const [updated] = await db
    .update(schema.templates)
    .set(set)
    .where(eq(schema.templates.id, id))
    .returning({ id: schema.templates.id, slug: schema.templates.slug });
  if (!updated) return NextResponse.json({ error: "Template tidak ditemukan" }, { status: 404 });

  await writeAudit({
    actorId: auth.session.user.id,
    action: "template.update",
    entity: "template",
    entityId: id,
    meta: { slug: updated.slug, fields: Object.keys(data) },
  });

  return NextResponse.json({ ok: true, id: updated.id });
}
