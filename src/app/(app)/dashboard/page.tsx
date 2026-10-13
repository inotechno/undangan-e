import { count, eq, sql } from "drizzle-orm";
import { requireAuth } from "@/auth/guard";
import { db, schema } from "@/db";
import { listInvitations, type InvitationListItem } from "@/modules/invitations/server";
import { listPayableOrdersForOwner } from "@/modules/payments/orders";
import {
  DashboardClient,
  type DashboardInvitation,
  type PopularTemplate,
} from "./dashboard-client";

/** Dashboard privat: selalu dinamis (cek sesi + data per request). */
export const instant = false;

function invitationTitle(item: {
  config: { seo: { title?: string }; event: { couple?: { brideName: string; groomName: string } } };
}): string {
  if (item.config.seo.title) return item.config.seo.title;
  const couple = item.config.event.couple;
  if (couple) return `${couple.brideName} & ${couple.groomName}`;
  return "Undangan tanpa judul";
}

function toRow(
  item: InvitationListItem,
  stats: { guests: number; attending: number; checkedIn: number },
  payOrderId: string | null,
): DashboardInvitation {
  const schedules = item.config.event.schedules;
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
    payOrderId,
  };
}

export default async function DashboardPage() {
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

  const rows = items.map((item) =>
    toRow(
      item,
      statsByInvitation.get(item.id) ?? { guests: 0, attending: 0, checkedIn: 0 },
      orderById.get(item.id) ?? null,
    ),
  );

  const tplRows = await db
    .select({
      id: schema.templates.id,
      name: schema.templates.name,
      description: schema.templates.description,
      preview: schema.templates.previewImageKey,
    })
    .from(schema.templates)
    .where(eq(schema.templates.status, "active"))
    .orderBy(schema.templates.sort)
    .limit(3);

  const templates: PopularTemplate[] = tplRows.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    preview: t.preview,
  }));

  return (
    <DashboardClient
      userName={session.user.name || session.user.email}
      items={rows}
      templates={templates}
    />
  );
}
