import { count, eq, sql } from "drizzle-orm";
import { requireAuth } from "@/auth/guard";
import { db, schema } from "@/db";
import { listInvitations } from "@/modules/invitations/server";
import { listPayableOrdersForOwner } from "@/modules/payments/orders";
import { UndanganClient, type UndanganRow } from "./undangan-client";

export const metadata = { title: "Undangan Saya" };

/** Halaman privat: selalu dinamis (cek sesi + data per request). */
export const instant = false;

function invitationTitle(item: {
  config: { seo: { title?: string }; event: { couple?: { brideName: string; groomName: string } } };
}): string {
  if (item.config.seo.title) return item.config.seo.title;
  const couple = item.config.event.couple;
  if (couple) return `${couple.brideName} & ${couple.groomName}`;
  return "Undangan tanpa judul";
}

export default async function UndanganListPage() {
  const { session } = await requireAuth();
  const [items, payable] = await Promise.all([
    listInvitations(session.user.id),
    listPayableOrdersForOwner(session.user.id),
  ]);
  const orderById = new Map(payable.map((o) => [o.invitationId, o.id]));

  const guestRows =
    items.length === 0
      ? []
      : await db
          .select({
            invitationId: schema.guests.invitationId,
            guests: count(),
            attending: sql<number>`count(*) filter (where ${schema.guests.rsvp} = 'attending')`,
            checkedIn: sql<number>`count(*) filter (where ${schema.guests.checkedInAt} is not null)`,
          })
          .from(schema.guests)
          .innerJoin(schema.invitations, eq(schema.guests.invitationId, schema.invitations.id))
          .where(eq(schema.invitations.ownerId, session.user.id))
          .groupBy(schema.guests.invitationId);
  const statsByInvitation = new Map(
    guestRows.map((r) => [
      r.invitationId,
      { guests: r.guests, attending: Number(r.attending), checkedIn: Number(r.checkedIn) },
    ]),
  );

  const rows: UndanganRow[] = items.map((item) => {
    const schedules = item.config.event.schedules;
    const stats = statsByInvitation.get(item.id) ?? { guests: 0, attending: 0, checkedIn: 0 };
    return {
      id: item.id,
      slug: item.slug,
      title: invitationTitle(item),
      status: item.status,
      eventType: item.eventType,
      templateName: item.templateName,
      templatePreview: item.templatePreview,
      eventDate: item.config.event.date ?? null,
      venue: schedules && schedules.length > 0 ? (schedules[0]?.venue ?? null) : null,
      updatedAt: item.updatedAt.toISOString(),
      guests: stats.guests,
      attending: stats.attending,
      checkedIn: stats.checkedIn,
      payOrderId: orderById.get(item.id) ?? null,
    };
  });

  return <UndanganClient items={rows} />;
}
