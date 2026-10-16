import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import {
  invitationConfigSchema,
  parseConfig,
  type InvitationConfig,
  type EventType,
} from "@/modules/invitation";
import { writeAudit } from "@/modules/audit/log";
import { hasPaidOrderForInvitation } from "@/modules/payments/orders";
import { slugSchema, slugify } from "./slug";

export { slugSchema, slugify };

async function slugAvailable(slug: string, excludeId?: string): Promise<boolean> {
  // Unique constraint global (termasuk baris ter-soft-delete) — jangan filter deletedAt.
  const rows = await db
    .select({ id: schema.invitations.id })
    .from(schema.invitations)
    .where(eq(schema.invitations.slug, slug))
    .limit(1);
  if (rows.length === 0) return true;
  return excludeId ? rows[0]!.id === excludeId : false;
}

export async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const root = slugify(base);
  if (await slugAvailable(root, excludeId)) return root;
  for (let i = 2; i <= 50; i++) {
    const candidate = `${root}-${i}`;
    if (await slugAvailable(candidate, excludeId)) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}

export interface InvitationListItem {
  id: string;
  slug: string;
  eventType: string;
  status: string;
  config: InvitationConfig;
  publishedAt: Date | null;
  expiresAt: Date | null;
  updatedAt: Date;
  templateName: string;
  templateSlug: string;
  templatePreview: string | null;
}

function mapRow(row: {
  id: string;
  slug: string;
  eventType: string;
  status: string;
  config: unknown;
  publishedAt: Date | null;
  expiresAt: Date | null;
  updatedAt: Date;
  templateName: string;
  templateSlug: string;
  templatePreview: string | null;
}): InvitationListItem {
  return {
    id: row.id,
    slug: row.slug,
    eventType: row.eventType,
    status: row.status,
    config: parseConfig(row.config),
    publishedAt: row.publishedAt,
    expiresAt: row.expiresAt,
    updatedAt: row.updatedAt,
    templateName: row.templateName,
    templateSlug: row.templateSlug,
    templatePreview: row.templatePreview,
  };
}

const baseSelect = {
  id: schema.invitations.id,
  slug: schema.invitations.slug,
  eventType: schema.invitations.eventType,
  status: schema.invitations.status,
  config: schema.invitations.config,
  publishedAt: schema.invitations.publishedAt,
  expiresAt: schema.invitations.expiresAt,
  updatedAt: schema.invitations.updatedAt,
  templateName: schema.templates.name,
  templateSlug: schema.templates.slug,
  templatePreview: schema.templates.previewImageKey,
};

export async function listInvitations(ownerId: string): Promise<InvitationListItem[]> {
  const rows = await db
    .select(baseSelect)
    .from(schema.invitations)
    .innerJoin(schema.templates, eq(schema.invitations.templateId, schema.templates.id))
    .where(and(eq(schema.invitations.ownerId, ownerId), isNull(schema.invitations.deletedAt)))
    .orderBy(desc(schema.invitations.updatedAt))
    .limit(1000);
  return rows.map(mapRow);
}

export async function getInvitationForActor(
  id: string,
  actorId: string,
  isAdmin: boolean,
): Promise<InvitationListItem | null> {
  const rows = await db
    .select({ ...baseSelect, ownerId: schema.invitations.ownerId })
    .from(schema.invitations)
    .innerJoin(schema.templates, eq(schema.invitations.templateId, schema.templates.id))
    .where(and(eq(schema.invitations.id, id), isNull(schema.invitations.deletedAt)))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  if (!isAdmin && row.ownerId !== actorId) return null;
  return mapRow(row);
}

export async function createInvitation(input: {
  ownerId: string;
  templateId: string;
  eventType?: EventType;
  title: string;
}): Promise<{ id: string; slug: string }> {
  const slug = await uniqueSlug(input.title);
  const [tpl] = await db
    .select({ id: schema.templates.id })
    .from(schema.templates)
    .where(eq(schema.templates.id, input.templateId))
    .limit(1);
  if (!tpl) throw new Error("TEMPLATE_NOT_FOUND");

  const defaultDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  // Jadwal default supaya tab Jadwal langsung punya baris acara (dan location picker/peta tampil).
  const firstScheduleTitle = input.eventType === "pernikahan" ? "Akad Nikah" : "Acara";
  const config = invitationConfigSchema.parse({
    event: {
      date: defaultDate,
      schedules: [{ title: firstScheduleTitle, start: defaultDate, venue: "" }],
    },
  });

  const created = await db
    .insert(schema.invitations)
    .values({
      id: crypto.randomUUID(),
      ownerId: input.ownerId,
      templateId: tpl.id,
      slug,
      eventType: input.eventType ?? "pernikahan",
      status: "draft",
      config,
    })
    .returning({ id: schema.invitations.id, slug: schema.invitations.slug });

  await writeAudit({
    actorId: input.ownerId,
    action: "invitation.created",
    entity: "invitation",
    entityId: created[0]!.id,
    meta: { slug: created[0]!.slug, templateId: tpl.id },
  });
  return created[0]!;
}

export const configPatchSchema = z.object({
  config: z.unknown().optional(),
  slug: slugSchema.optional(),
});

export type ConfigPatchResult =
  | { ok: true; updatedAt: Date }
  | { ok: false; error: string; field?: "config" | "slug" };

export async function patchInvitation(
  id: string,
  actorId: string,
  isAdmin: boolean,
  body: z.infer<typeof configPatchSchema>,
  auditIp?: string | null,
): Promise<ConfigPatchResult> {
  const existing = await getInvitationForActor(id, actorId, isAdmin);
  if (!existing) return { ok: false, error: "Undangan tidak ditemukan" };

  const values: Partial<typeof schema.invitations.$inferInsert> = {};

  if (body.config !== undefined) {
    const parsed = invitationConfigSchema.safeParse(body.config);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const path = issue?.path.join(".") ?? "";
      return {
        ok: false,
        field: "config",
        error: `Konfigurasi tidak valid${path ? ` (${path}: ${issue?.message})` : ""}`,
      };
    }
    values.config = parsed.data;
  }

  if (body.slug !== undefined) {
    const slugParsed = slugSchema.safeParse(body.slug);
    if (!slugParsed.success) {
      return { ok: false, field: "slug", error: slugParsed.error.issues[0]?.message ?? "Slug tidak valid" };
    }
    const slug = slugParsed.data;
    if (slug !== existing.slug && !(await slugAvailable(slug, id))) {
      return { ok: false, field: "slug", error: `Slug "${slug}" sudah dipakai undangan lain` };
    }
    values.slug = slug;
  }

  if (Object.keys(values).length === 0) return { ok: false, error: "Tidak ada perubahan" };

  const updated = await db
    .update(schema.invitations)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(schema.invitations.id, id))
    .returning({ updatedAt: schema.invitations.updatedAt });

  await writeAudit({
    actorId,
    action: "invitation.updated",
    entity: "invitation",
    entityId: id,
    meta: { fields: Object.keys(values) },
    ip: auditIp ?? null,
  });
  return { ok: true, updatedAt: updated[0]!.updatedAt };
}

export async function publishInvitation(
  id: string,
  actorId: string,
  isAdmin: boolean,
): Promise<{ ok: true; slug: string } | { ok: false; error: string }> {
  const existing = await getInvitationForActor(id, actorId, isAdmin);
  if (!existing) return { ok: false, error: "Undangan tidak ditemukan" };

  // Fase 5: publikasi hanya setelah order paid (docs/05 §3).
  const hasPaid = await hasPaidOrderForInvitation(id);
  if (!hasPaid) return { ok: false, error: "Belum ada pembayaran untuk undangan ini" };

  const validityDays = 365;
  const expiresAt = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000);
  await db
    .update(schema.invitations)
    .set({ status: "active", publishedAt: new Date(), expiresAt, updatedAt: new Date() })
    .where(eq(schema.invitations.id, id));

  await writeAudit({
    actorId,
    action: "invitation.published",
    entity: "invitation",
    entityId: id,
    meta: { slug: existing.slug, expiresAt: expiresAt.toISOString() },
  });
  return { ok: true, slug: existing.slug };
}

export async function unpublishInvitation(
  id: string,
  actorId: string,
  isAdmin: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const existing = await getInvitationForActor(id, actorId, isAdmin);
  if (!existing) return { ok: false, error: "Undangan tidak ditemukan" };

  await db
    .update(schema.invitations)
    .set({ status: "draft", publishedAt: null, updatedAt: new Date() })
    .where(eq(schema.invitations.id, id));

  await writeAudit({
    actorId,
    action: "invitation.unpublished",
    entity: "invitation",
    entityId: id,
  });
  return { ok: true };
}

export async function softDeleteInvitation(
  id: string,
  actorId: string,
  isAdmin: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const existing = await getInvitationForActor(id, actorId, isAdmin);
  if (!existing) return { ok: false, error: "Undangan tidak ditemukan" };

  await db
    .update(schema.invitations)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(schema.invitations.id, id));

  await writeAudit({
    actorId,
    action: "invitation.deleted",
    entity: "invitation",
    entityId: id,
    meta: { slug: existing.slug },
  });
  return { ok: true };
}
