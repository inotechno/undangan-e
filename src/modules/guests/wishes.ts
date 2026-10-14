import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";

/* ── Skema ───────────────────────────────────────────────── */

export const rsvpSchema = z.object({
  status: z.enum(["attending", "declined"]),
  guestCode: z.string().trim().min(6).max(40),
  note: z.string().trim().max(200).optional(),
});

export const wishSchema = z.object({
  name: z.string().trim().min(2).max(60),
  message: z.string().trim().min(2).max(500),
  guestCode: z.string().trim().min(6).max(40).optional(),
});

export const wishModerationSchema = z.object({
  status: z.enum(["visible", "hidden"]),
});

export interface RsvpStats {
  attending: number;
  declined: number;
  pending: number;
  total: number;
}

export async function rsvpStatsForInvitation(invitationId: string): Promise<RsvpStats> {
  const [row] = await db
    .select({
      attending: sql<number>`count(*) filter (where ${schema.guests.rsvp} = 'attending')`,
      declined: sql<number>`count(*) filter (where ${schema.guests.rsvp} = 'declined')`,
      pending: sql<number>`count(*) filter (where ${schema.guests.rsvp} = 'pending')`,
      total: count(),
    })
    .from(schema.guests)
    .where(eq(schema.guests.invitationId, invitationId));
  return {
    attending: Number(row?.attending ?? 0),
    declined: Number(row?.declined ?? 0),
    pending: Number(row?.pending ?? 0),
    total: row?.total ?? 0,
  };
}

/* ── RSVP publik (tamu via link personal) ────────────────── */

export async function submitRsvp(
  invitationId: string,
  input: z.infer<typeof rsvpSchema>,
): Promise<{ ok: true; rsvp: "attending" | "declined" } | { ok: false; error: string; status: number }> {
  const [guest] = await db
    .select({ id: schema.guests.id, rsvp: schema.guests.rsvp })
    .from(schema.guests)
    .where(and(eq(schema.guests.invitationId, invitationId), eq(schema.guests.guestCode, input.guestCode)))
    .limit(1);
  if (!guest) return { ok: false, error: "Tamu tidak dikenal — buka undangan melalui tautan personal Anda", status: 404 };

  await db.update(schema.guests).set({ rsvp: input.status }).where(eq(schema.guests.id, guest.id));
  return { ok: true, rsvp: input.status };
}

/* ── Buku tamu publik ────────────────────────────────────── */

export interface WishRow {
  id: string;
  name: string;
  message: string;
  status: "visible" | "hidden";
  createdAt: string;
}

export async function submitWish(
  invitationId: string,
  input: z.infer<typeof wishSchema>,
): Promise<{ ok: true; wish: WishRow } | { ok: false; error: string; status: number }> {
  // Anti-spam sederhana: maksimal 3 ucapan per nama per undangan
  const [dupCount] = await db
    .select({ n: count() })
    .from(schema.guestbookEntries)
    .where(
      and(
        eq(schema.guestbookEntries.invitationId, invitationId),
        eq(schema.guestbookEntries.name, input.name),
      ),
    );
  if ((dupCount?.n ?? 0) >= 3) {
    return { ok: false, error: "Anda sudah mengirim beberapa ucapan. Terima kasih!", status: 429 };
  }

  const [created] = await db
    .insert(schema.guestbookEntries)
    .values({
      id: crypto.randomUUID(),
      invitationId,
      name: input.name,
      message: input.message,
    })
    .returning();

  return {
    ok: true,
    wish: {
      id: created.id,
      name: created.name,
      message: created.message,
      status: created.status,
      createdAt: created.createdAt.toISOString(),
    },
  };
}

/* ── Moderasi buku tamu (owner) ──────────────────────────── */

export async function listWishesForOwner(
  invitationId: string,
): Promise<{ items: WishRow[]; visible: number; hidden: number }> {
  const rows = await db
    .select()
    .from(schema.guestbookEntries)
    .where(eq(schema.guestbookEntries.invitationId, invitationId))
    .orderBy(desc(schema.guestbookEntries.createdAt))
    .limit(200);

  const [stat] = await db
    .select({
      visible: sql<number>`count(*) filter (where ${schema.guestbookEntries.status} = 'visible')`,
      hidden: sql<number>`count(*) filter (where ${schema.guestbookEntries.status} = 'hidden')`,
    })
    .from(schema.guestbookEntries)
    .where(eq(schema.guestbookEntries.invitationId, invitationId));

  return {
    items: rows.map((r) => ({
      id: r.id,
      name: r.name,
      message: r.message,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    })),
    visible: Number(stat?.visible ?? 0),
    hidden: Number(stat?.hidden ?? 0),
  };
}

export async function moderateWish(
  invitationId: string,
  wishId: string,
  status: "visible" | "hidden",
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const [updated] = await db
    .update(schema.guestbookEntries)
    .set({ status })
    .where(and(eq(schema.guestbookEntries.id, wishId), eq(schema.guestbookEntries.invitationId, invitationId)))
    .returning({ id: schema.guestbookEntries.id });
  if (!updated) return { ok: false, error: "Ucapan tidak ditemukan", status: 404 };
  return { ok: true };
}

export async function deleteWish(
  invitationId: string,
  wishId: string,
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const [deleted] = await db
    .delete(schema.guestbookEntries)
    .where(and(eq(schema.guestbookEntries.id, wishId), eq(schema.guestbookEntries.invitationId, invitationId)))
    .returning({ id: schema.guestbookEntries.id });
  if (!deleted) return { ok: false, error: "Ucapan tidak ditemukan", status: 404 };
  return { ok: true };
}

/* ── Moderasi lintas undangan (dashboard) ────────────────── */

export interface AllWishRow {
  id: string;
  invitationId: string;
  invitationTitle: string;
  invitationSlug: string;
  name: string;
  message: string;
  status: "visible" | "hidden";
  createdAt: string;
}

export async function listWishesForOwnerAll(ownerId: string): Promise<{
  items: AllWishRow[];
  visible: number;
  hidden: number;
  total: number;
}> {
  // Ambil ID undangan milik user (non-deleted).
  const invRows = await db
    .select({ id: schema.invitations.id })
    .from(schema.invitations)
    .where(and(eq(schema.invitations.ownerId, ownerId), sql`${schema.invitations.deletedAt} IS NULL`));
  const invIds = invRows.map((r) => r.id);
  if (invIds.length === 0) return { items: [], visible: 0, hidden: 0, total: 0 };

  const rows = await db
    .select({
      id: schema.guestbookEntries.id,
      invitationId: schema.guestbookEntries.invitationId,
      name: schema.guestbookEntries.name,
      message: schema.guestbookEntries.message,
      status: schema.guestbookEntries.status,
      createdAt: schema.guestbookEntries.createdAt,
      invitationSlug: schema.invitations.slug,
      config: schema.invitations.config,
    })
    .from(schema.guestbookEntries)
    .innerJoin(schema.invitations, eq(schema.guestbookEntries.invitationId, schema.invitations.id))
    .where(inArray(schema.guestbookEntries.invitationId, invIds))
    .orderBy(desc(schema.guestbookEntries.createdAt))
    .limit(500);

  const [stat] = await db
    .select({
      visible: sql<number>`count(*) filter (where ${schema.guestbookEntries.status} = 'visible')`,
      hidden: sql<number>`count(*) filter (where ${schema.guestbookEntries.status} = 'hidden')`,
      total: count(),
    })
    .from(schema.guestbookEntries)
    .where(inArray(schema.guestbookEntries.invitationId, invIds));

  return {
    items: rows.map((r) => {
      const cfg = r.config as { seo?: { title?: string }; event?: { couple?: { brideName?: string; groomName?: string } } } | null;
      const title =
        cfg?.seo?.title ??
        (cfg?.event?.couple
          ? `${cfg.event.couple.brideName ?? ""} & ${cfg.event.couple.groomName ?? ""}`
          : r.invitationSlug);
      return {
        id: r.id,
        invitationId: r.invitationId,
        invitationTitle: title,
        invitationSlug: r.invitationSlug,
        name: r.name,
        message: r.message,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      };
    }),
    visible: Number(stat?.visible ?? 0),
    hidden: Number(stat?.hidden ?? 0),
    total: stat?.total ?? 0,
  };
}

/** Moderasi lintas undangan: verifikasi ownership dulu, lalu toggle. */
export async function moderateWishByOwner(
  ownerId: string,
  wishId: string,
  status: "visible" | "hidden",
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const [row] = await db
    .select({ id: schema.guestbookEntries.id, invitationId: schema.guestbookEntries.invitationId })
    .from(schema.guestbookEntries)
    .innerJoin(schema.invitations, eq(schema.guestbookEntries.invitationId, schema.invitations.id))
    .where(and(eq(schema.guestbookEntries.id, wishId), eq(schema.invitations.ownerId, ownerId)))
    .limit(1);
  if (!row) return { ok: false, error: "Ucapan tidak ditemukan", status: 404 };
  await db.update(schema.guestbookEntries).set({ status }).where(eq(schema.guestbookEntries.id, wishId));
  return { ok: true };
}

export async function deleteWishByOwner(
  ownerId: string,
  wishId: string,
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const [row] = await db
    .select({ id: schema.guestbookEntries.id })
    .from(schema.guestbookEntries)
    .innerJoin(schema.invitations, eq(schema.guestbookEntries.invitationId, schema.invitations.id))
    .where(and(eq(schema.guestbookEntries.id, wishId), eq(schema.invitations.ownerId, ownerId)))
    .limit(1);
  if (!row) return { ok: false, error: "Ucapan tidak ditemukan", status: 404 };
  await db.delete(schema.guestbookEntries).where(eq(schema.guestbookEntries.id, wishId));
  return { ok: true };
}
