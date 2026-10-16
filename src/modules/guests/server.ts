import { randomBytes } from "node:crypto";
import { and, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { writeAudit } from "@/modules/audit/log";
import { signGuestPayload } from "./qr";

/* ── Skema input ─────────────────────────────────────────── */

export const guestCreateSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(60),
  phone: z.string().trim().max(30).nullable().optional(),
  groupName: z.string().trim().max(60).nullable().optional(),
  quota: z.coerce.number().int().min(1).max(50).default(1),
});

export const guestPatchSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  groupName: z.string().trim().max(60).nullable().optional(),
  quota: z.coerce.number().int().min(1).max(50).optional(),
  rsvp: z.enum(["pending", "attending", "declined"]).optional(),
});

export const guestListQuerySchema = z.object({
  q: z.string().trim().max(60).optional(),
  source: z.enum(["import", "manual", "link", "form"]).optional(),
  rsvp: z.enum(["pending", "attending", "declined"]).optional(),
});

export const guestImportRowSchema = z.object({
  name: z.string().trim().min(2).max(60),
  phone: z.string().trim().max(30).optional(),
  groupName: z.string().trim().max(60).optional(),
  quota: z.coerce.number().int().min(1).max(50).default(1),
});

/* ── Util ────────────────────────────────────────────────── */

/** Normalisasi nama (docs/10): lowercase, trim, spasi ganda → satu. */
export function normalizeGuestName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Kode tamu acak: 10 karakter base32-ish (sulit ditebak, aman di URL). */
export function generateGuestCode(): string {
  return randomBytes(8).toString("hex");
}

/* ── Tipe hasil ──────────────────────────────────────────── */

export interface GuestRow {
  id: string;
  name: string;
  phone: string | null;
  groupName: string | null;
  quota: number;
  rsvp: "pending" | "attending" | "declined";
  source: "import" | "manual" | "link" | "form";
  guestCode: string;
  personalUrl: string;
  checkedInAt: string | null;
  createdAt: string;
}

function toGuestRow(r: typeof schema.guests.$inferSelect, appUrl: string): GuestRow {
  return {
    id: r.id,
    name: r.name,
    phone: r.phone,
    groupName: r.groupName,
    quota: r.quota,
    rsvp: r.rsvp,
    source: r.source,
    guestCode: r.guestCode,
    personalUrl: `${appUrl}/i/INV_SLUG?g=${r.guestCode}`,
    checkedInAt: r.checkedInAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
  };
}

export interface GuestStats {
  total: number;
  attending: number;
  declined: number;
  pending: number;
  checkedIn: number;
  quotaSum: number;
}

/* ── Pemilik harus punya undangan ────────────────────────── */

async function assertOwnership(invitationId: string, actorId: string, isAdmin: boolean) {
  const [row] = await db
    .select({ id: schema.invitations.id, ownerId: schema.invitations.ownerId, slug: schema.invitations.slug })
    .from(schema.invitations)
    .where(and(eq(schema.invitations.id, invitationId), sql`${schema.invitations.deletedAt} is null`))
    .limit(1);
  if (!row) return null;
  if (!isAdmin && row.ownerId !== actorId) return null;
  return row;
}

/* ── CRUD ────────────────────────────────────────────────── */

export async function listGuests(
  invitationId: string,
  actorId: string,
  isAdmin: boolean,
  query: z.infer<typeof guestListQuerySchema>,
  appUrl: string,
): Promise<{ items: GuestRow[]; stats: GuestStats } | null> {
  const inv = await assertOwnership(invitationId, actorId, isAdmin);
  if (!inv) return null;

  const filters = [eq(schema.guests.invitationId, invitationId)];
  if (query.q) {
    const pattern = `%${query.q.replace(/[%_]/g, "\\$&")}%`;
    filters.push(or(ilike(schema.guests.name, pattern), ilike(schema.guests.groupName, pattern))!);
  }
  if (query.source) filters.push(eq(schema.guests.source, query.source));
  if (query.rsvp) filters.push(eq(schema.guests.rsvp, query.rsvp));

  const rows = await db
    .select()
    .from(schema.guests)
    .where(and(...filters))
    .orderBy(desc(schema.guests.createdAt))
    .limit(500);

  const [statRow] = await db
    .select({
      total: count(),
      attending: sql<number>`count(*) filter (where ${schema.guests.rsvp} = 'attending')`,
      declined: sql<number>`count(*) filter (where ${schema.guests.rsvp} = 'declined')`,
      pending: sql<number>`count(*) filter (where ${schema.guests.rsvp} = 'pending')`,
      checkedIn: sql<number>`count(*) filter (where ${schema.guests.checkedInAt} is not null)`,
      quotaSum: sql<number>`coalesce(sum(${schema.guests.quota}), 0)`,
    })
    .from(schema.guests)
    .where(eq(schema.guests.invitationId, invitationId));

  const stats: GuestStats = {
    total: statRow?.total ?? 0,
    attending: Number(statRow?.attending ?? 0),
    declined: Number(statRow?.declined ?? 0),
    pending: Number(statRow?.pending ?? 0),
    checkedIn: Number(statRow?.checkedIn ?? 0),
    quotaSum: Number(statRow?.quotaSum ?? 0),
  };

  return {
    items: rows.map((r) => {
      const base = toGuestRow(r, appUrl);
      base.personalUrl = `${appUrl}/i/${inv.slug}?g=${r.guestCode}`;
      return base;
    }),
    stats,
  };
}

export async function createGuest(
  invitationId: string,
  actorId: string,
  isAdmin: boolean,
  input: z.infer<typeof guestCreateSchema>,
  appUrl: string,
): Promise<{ ok: true; guest: GuestRow; duplicate?: false } | { ok: false; error: string; status: number }> {
  const inv = await assertOwnership(invitationId, actorId, isAdmin);
  if (!inv) return { ok: false, error: "Undangan tidak ditemukan", status: 404 };

  const nameNormalized = normalizeGuestName(input.name);
  const [existing] = await db
    .select({ id: schema.guests.id })
    .from(schema.guests)
    .where(and(eq(schema.guests.invitationId, invitationId), eq(schema.guests.nameNormalized, nameNormalized)))
    .limit(1);
  if (existing) {
    return { ok: false, error: `Nama "${input.name}" sudah ada di daftar tamu`, status: 409 };
  }

  const [totalRow] = await db
    .select({ n: count() })
    .from(schema.guests)
    .where(eq(schema.guests.invitationId, invitationId));
  if ((totalRow?.n ?? 0) >= 1000) {
    return { ok: false, error: "Jumlah tamu sudah mencapai batas 1000", status: 400 };
  }

  const guestCode = generateGuestCode();
  const qrHash = signGuestPayload(guestCode);
  const [created] = await db
    .insert(schema.guests)
    .values({
      id: crypto.randomUUID(),
      invitationId,
      name: input.name,
      nameNormalized,
      phone: input.phone || null,
      groupName: input.groupName || null,
      quota: input.quota,
      source: "manual",
      guestCode,
      qrHash,
    })
    .returning();

  await writeAudit({
    actorId,
    action: "guest.create",
    entity: "guest",
    entityId: created.id,
    meta: { invitationId, name: input.name },
  });

  const base = toGuestRow(created, appUrl);
  base.personalUrl = `${appUrl}/i/${inv.slug}?g=${guestCode}`;
  return { ok: true, guest: base };
}

export async function updateGuest(
  invitationId: string,
  guestId: string,
  actorId: string,
  isAdmin: boolean,
  patch: z.infer<typeof guestPatchSchema>,
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const inv = await assertOwnership(invitationId, actorId, isAdmin);
  if (!inv) return { ok: false, error: "Undangan tidak ditemukan", status: 404 };

  const [existing] = await db
    .select({ id: schema.guests.id })
    .from(schema.guests)
    .where(and(eq(schema.guests.id, guestId), eq(schema.guests.invitationId, invitationId)))
    .limit(1);
  if (!existing) return { ok: false, error: "Tamu tidak ditemukan", status: 404 };

  const set: Partial<typeof schema.guests.$inferInsert> = {};
  if (patch.name !== undefined) {
    const nameNormalized = normalizeGuestName(patch.name);
    const [dup] = await db
      .select({ id: schema.guests.id })
      .from(schema.guests)
      .where(
        and(
          eq(schema.guests.invitationId, invitationId),
          eq(schema.guests.nameNormalized, nameNormalized),
          sql`${schema.guests.id} <> ${guestId}`,
        ),
      )
      .limit(1);
    if (dup) return { ok: false, error: `Nama "${patch.name}" sudah dipakai tamu lain`, status: 409 };
    set.name = patch.name;
    set.nameNormalized = nameNormalized;
  }
  if (patch.phone !== undefined) set.phone = patch.phone || null;
  if (patch.groupName !== undefined) set.groupName = patch.groupName || null;
  if (patch.quota !== undefined) set.quota = patch.quota;
  if (patch.rsvp !== undefined) set.rsvp = patch.rsvp;
  if (Object.keys(set).length === 0) return { ok: false, error: "Tidak ada perubahan", status: 400 };

  await db.update(schema.guests).set(set).where(eq(schema.guests.id, guestId));

  await writeAudit({
    actorId,
    action: "guest.update",
    entity: "guest",
    entityId: guestId,
    meta: { invitationId, fields: Object.keys(set) },
  });
  return { ok: true };
}

export async function deleteGuest(
  invitationId: string,
  guestId: string,
  actorId: string,
  isAdmin: boolean,
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const inv = await assertOwnership(invitationId, actorId, isAdmin);
  if (!inv) return { ok: false, error: "Undangan tidak ditemukan", status: 404 };

  const [deleted] = await db
    .delete(schema.guests)
    .where(and(eq(schema.guests.id, guestId), eq(schema.guests.invitationId, invitationId)))
    .returning({ id: schema.guests.id, name: schema.guests.name });
  if (!deleted) return { ok: false, error: "Tamu tidak ditemukan", status: 404 };

  await writeAudit({
    actorId,
    action: "guest.delete",
    entity: "guest",
    entityId: guestId,
    meta: { invitationId, name: deleted.name },
  });
  return { ok: true };
}

/* ── Impor CSV (baris: nama,telepon,grup,kuota — header opsional) ── */

export async function importGuests(
  invitationId: string,
  actorId: string,
  isAdmin: boolean,
  csv: string,
): Promise<
  | { ok: true; imported: number; skipped: number; failures: { line: number; reason: string }[] }
  | { ok: false; error: string; status: number }
> {
  const inv = await assertOwnership(invitationId, actorId, isAdmin);
  if (!inv) return { ok: false, error: "Undangan tidak ditemukan", status: 404 };

  const lines = csv.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return { ok: false, error: "File kosong", status: 400 };
  if (lines.length > 1001) return { ok: false, error: "Maksimal 1000 baris per file", status: 400 };

  // Lewati header bila kolom pertama bukan data
  const dataLines = /^(nama|name)\b/i.test(lines[0] ?? "") ? lines.slice(1) : lines;

  const [totalRow] = await db
    .select({ n: count() })
    .from(schema.guests)
    .where(eq(schema.guests.invitationId, invitationId));
  let remaining = Math.max(0, 1000 - (totalRow?.n ?? 0));

  let imported = 0;
  let skipped = 0;
  const failures: { line: number; reason: string }[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < dataLines.length; i++) {
    const lineNo = i + (dataLines === lines ? 1 : 2);
    if (remaining <= 0) {
      failures.push({ line: lineNo, reason: "Batas 1000 tamu tercapai" });
      continue;
    }
    const cols = dataLines[i]!.split(",").map((c) => c.trim());
    const parsed = guestImportRowSchema.safeParse({
      name: cols[0] ?? "",
      phone: cols[1] || undefined,
      groupName: cols[2] || undefined,
      quota: cols[3] || 1,
    });
    if (!parsed.success) {
      failures.push({ line: lineNo, reason: parsed.error.issues[0]?.message ?? "Data tidak valid" });
      continue;
    }
    const nameNormalized = normalizeGuestName(parsed.data.name);
    if (seen.has(nameNormalized)) {
      skipped++;
      continue;
    }
    seen.add(nameNormalized);

    const [dup] = await db
      .select({ id: schema.guests.id })
      .from(schema.guests)
      .where(and(eq(schema.guests.invitationId, invitationId), eq(schema.guests.nameNormalized, nameNormalized)))
      .limit(1);
    if (dup) {
      skipped++;
      continue;
    }

    const guestCode = generateGuestCode();
    await db.insert(schema.guests).values({
      id: crypto.randomUUID(),
      invitationId,
      name: parsed.data.name,
      nameNormalized,
      phone: parsed.data.phone || null,
      groupName: parsed.data.groupName || null,
      quota: parsed.data.quota,
      source: "import",
      guestCode,
      qrHash: signGuestPayload(guestCode),
    });
    imported++;
    remaining--;
  }

  await writeAudit({
    actorId,
    action: "guest.import",
    entity: "invitation",
    entityId: invitationId,
    meta: { imported, skipped, failed: failures.length },
  });

  return { ok: true, imported, skipped, failures };
}

/* ── Konteks tamu publik (auto-create docs/10) ───────────── */

export interface PublicGuestContext {
  name: string;
  code: string;
  quota: number;
  rsvp: "pending" | "attending" | "declined";
  rsvpSessions?: Array<{ scheduleIndex: number; status: "attending" | "declined" }>;
}

/**
 * Resolusi konteks tamu dari parameter URL:
 * - ?g=<code> dikenal → tampil; tidak dikenal → buat tamu baru (source=link)
 * - ?kepada=Nama → bind bila nama sama, kalau tidak → buat baru (source=link)
 */
export async function resolvePublicGuest(
  invitationId: string,
  input: { guestCode?: string; guestName?: string },
): Promise<PublicGuestContext | null> {
  if (input.guestCode) {
    const [row] = await db
      .select()
      .from(schema.guests)
      .where(and(eq(schema.guests.invitationId, invitationId), eq(schema.guests.guestCode, input.guestCode)))
      .limit(1);
    if (row) return { name: row.name, code: row.guestCode, quota: row.quota, rsvp: row.rsvp, rsvpSessions: row.rsvpSessions ?? [] };

    // Tamu tidak dikenal → buat baru (docs/10 default: buat baru)
    const [totalRow] = await db
      .select({ n: count() })
      .from(schema.guests)
      .where(eq(schema.guests.invitationId, invitationId));
    if ((totalRow?.n ?? 0) >= 1000) return null;

    const code = generateGuestCode();
    const [created] = await db
      .insert(schema.guests)
      .values({
        id: crypto.randomUUID(),
        invitationId,
        name: "Tamu",
        nameNormalized: `tamu-${code}`,
        source: "link",
        guestCode: code,
        qrHash: signGuestPayload(code),
      })
      .returning();
    return { name: created.name, code: created.guestCode, quota: created.quota, rsvp: created.rsvp };
  }

  if (input.guestName && input.guestName.trim().length >= 2) {
    const nameNormalized = normalizeGuestName(input.guestName);
    const [existing] = await db
      .select()
      .from(schema.guests)
      .where(and(eq(schema.guests.invitationId, invitationId), eq(schema.guests.nameNormalized, nameNormalized)))
      .limit(1);
    if (existing) return { name: existing.name, code: existing.guestCode, quota: existing.quota, rsvp: existing.rsvp, rsvpSessions: existing.rsvpSessions ?? [] };

    const [totalRow] = await db
      .select({ n: count() })
      .from(schema.guests)
      .where(eq(schema.guests.invitationId, invitationId));
    if ((totalRow?.n ?? 0) >= 1000) return null;

    const code = generateGuestCode();
    const [created] = await db
      .insert(schema.guests)
      .values({
        id: crypto.randomUUID(),
        invitationId,
        name: input.guestName.trim().slice(0, 60),
        nameNormalized,
        source: "link",
        guestCode: code,
        qrHash: signGuestPayload(code),
      })
      .returning();
    return { name: created.name, code: created.guestCode, quota: created.quota, rsvp: created.rsvp };
  }

  return null;
}

/* ── Check-in (buku tamu) ────────────────────────────────── */

export interface CheckInResult {
  ok: true;
  guest: { id: string; name: string; checkedInAt: string };
  duplicate: boolean;
}

export async function checkInGuest(
  invitationId: string,
  guestId: string,
  actorId: string,
  isAdmin: boolean,
): Promise<CheckInResult | { ok: false; error: string; status: number }> {
  const inv = await assertOwnership(invitationId, actorId, isAdmin);
  if (!inv) return { ok: false, error: "Undangan tidak ditemukan", status: 404 };

  const [guest] = await db
    .select()
    .from(schema.guests)
    .where(and(eq(schema.guests.id, guestId), eq(schema.guests.invitationId, invitationId)))
    .limit(1);
  if (!guest) return { ok: false, error: "Tamu tidak ditemukan", status: 404 };

  const now = new Date();
  const duplicate = guest.checkedInAt != null;

  if (!duplicate) {
    await db.update(schema.guests).set({ checkedInAt: now, checkedInBy: actorId }).where(eq(schema.guests.id, guestId));
  }

  await db.insert(schema.checkIns).values({
    id: crypto.randomUUID(),
    guestId,
    invitationId,
    scannedAt: now,
    actor: isAdmin ? "staff" : "owner",
    result: duplicate ? "duplicate" : "success",
  });

  return {
    ok: true,
    duplicate,
    guest: { id: guest.id, name: guest.name, checkedInAt: (duplicate ? guest.checkedInAt! : now).toISOString() },
  };
}

export interface CheckInRow {
  id: string;
  invitationId: string;
  invitationTitle: string;
  invitationSlug: string;
  guestId: string;
  guestName: string;
  groupName: string | null;
  rsvp: string;
  checkedInAt: string;
}

export interface CheckInStats {
  totalGuests: number;
  checkedIn: number;
  attending: number;
  notCheckedIn: number;
}

/** Rekap check-in lintas undangan milik owner (halaman Buku Tamu). */
export async function listCheckInsForOwner(
  ownerId: string,
  query: { invitationId?: string; q?: string } = {},
): Promise<{ items: CheckInRow[]; stats: CheckInStats; invitations: { id: string; title: string }[] }> {
  const invRows = await db
    .select({ id: schema.invitations.id, slug: schema.invitations.slug, config: schema.invitations.config })
    .from(schema.invitations)
    .where(and(eq(schema.invitations.ownerId, ownerId), sql`${schema.invitations.deletedAt} IS NULL`));
  const invIds = invRows.map((r) => r.id);
  if (invIds.length === 0) return { items: [], stats: { totalGuests: 0, checkedIn: 0, attending: 0, notCheckedIn: 0 }, invitations: [] };

  const titleOf = (r: { slug: string; config: unknown }) => {
    const cfg = r.config as { seo?: { title?: string }; event?: { couple?: { brideName?: string; groomName?: string } } } | null;
    return cfg?.seo?.title ?? (cfg?.event?.couple ? `${cfg.event.couple.brideName ?? ""} & ${cfg.event.couple.groomName ?? ""}` : r.slug);
  };
  const invitations = invRows.map((r) => ({ id: r.id, title: titleOf(r) }));

  const filters = [inArray(schema.guests.invitationId, invIds)];
  if (query.invitationId && invIds.includes(query.invitationId)) {
    filters.length = 0;
    filters.push(eq(schema.guests.invitationId, query.invitationId));
  }
  if (query.q) {
    const pattern = `%${query.q.replace(/[%_]/g, "\\$&")}%`;
    filters.push(or(ilike(schema.guests.name, pattern), ilike(schema.guests.groupName, pattern))!);
  }

  const rows = await db
    .select({
      id: schema.guests.id,
      invitationId: schema.guests.invitationId,
      name: schema.guests.name,
      groupName: schema.guests.groupName,
      rsvp: schema.guests.rsvp,
      checkedInAt: schema.guests.checkedInAt,
      slug: schema.invitations.slug,
      config: schema.invitations.config,
    })
    .from(schema.guests)
    .innerJoin(schema.invitations, eq(schema.guests.invitationId, schema.invitations.id))
    .where(and(...filters))
    .orderBy(desc(schema.guests.checkedInAt), desc(schema.guests.createdAt))
    .limit(1000);

  const titleMap = new Map(invRows.map((r) => [r.id, titleOf(r)]));
  const items: CheckInRow[] = rows
    .filter((r) => r.checkedInAt != null)
    .map((r) => ({
      id: r.id,
      invitationId: r.invitationId,
      invitationTitle: titleMap.get(r.invitationId) ?? r.slug,
      invitationSlug: r.slug,
      guestId: r.id,
      guestName: r.name,
      groupName: r.groupName,
      rsvp: r.rsvp,
      checkedInAt: r.checkedInAt!.toISOString(),
    }));

  // Stats (seluruh tamu di undangan terkait)
  const [statRow] = await db
    .select({
      totalGuests: count(),
      checkedIn: sql<number>`count(*) filter (where ${schema.guests.checkedInAt} is not null)`,
      attending: sql<number>`count(*) filter (where ${schema.guests.rsvp} = 'attending')`,
    })
    .from(schema.guests)
    .where(inArray(schema.guests.invitationId, query.invitationId && invIds.includes(query.invitationId) ? [query.invitationId] : invIds));

  const totalGuests = statRow?.totalGuests ?? 0;
  const checkedIn = Number(statRow?.checkedIn ?? 0);
  return {
    items,
    stats: {
      totalGuests,
      checkedIn,
      attending: Number(statRow?.attending ?? 0),
      notCheckedIn: totalGuests - checkedIn,
    },
    invitations,
  };
}
