import Link from "next/link";
import { count, eq, sql } from "drizzle-orm";
import { requireAuth } from "@/auth/guard";
import { db, schema } from "@/db";
import { listInvitations } from "@/modules/invitations/server";
import { TamuListClient } from "./tamu-list-client";

export const metadata = { title: "Tamu & RSVP" };

/** Halaman privat: selalu dinamis. */
export const instant = false;

function titleOf(item: {
  config: { seo: { title?: string }; event: { couple?: { brideName: string; groomName: string } } };
}): string {
  if (item.config.seo.title) return item.config.seo.title;
  const couple = item.config.event.couple;
  if (couple) return `${couple.brideName} & ${couple.groomName}`;
  return "Undangan tanpa judul";
}

export default async function TamuPage() {
  const { session } = await requireAuth();
  const items = await listInvitations(session.user.id);

  const guestRows =
    items.length === 0
      ? []
      : await db
          .select({
            invitationId: schema.guests.invitationId,
            total: count(),
            attending: sql<number>`count(*) filter (where ${schema.guests.rsvp} = 'attending')`,
          })
          .from(schema.guests)
          .innerJoin(schema.invitations, eq(schema.guests.invitationId, schema.invitations.id))
          .where(eq(schema.invitations.ownerId, session.user.id))
          .groupBy(schema.guests.invitationId);
  const stats = new Map(
    guestRows.map((r) => [r.invitationId, { total: r.total, attending: Number(r.attending) }]),
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[25px] font-bold tracking-[-0.7px] text-charcoal">Tamu & RSVP</h1>
        <p className="mt-1.5 text-xs text-muted-warm">
          Kelola daftar tamu, tautan personal, QR kehadiran, RSVP, dan buku tamu per undangan.
        </p>
      </div>

      {items.length === 0 ? (
        <section className="rounded-[15px] border border-border-warm bg-white p-10 text-center shadow-[0_8px_24px_rgba(18,40,59,0.045)]">
          <p className="text-sm text-muted-warm">Belum ada undangan. Buat undangan dulu untuk mulai mengelola tamu.</p>
          <Link
            href="/dashboard/template"
            className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg bg-teal px-3.5 text-[11px] font-bold text-white transition-colors hover:bg-teal-hover"
          >
            Buat Undangan
          </Link>
        </section>
      ) : (
        <TamuListClient
          items={items.map((item) => {
            const s = stats.get(item.id) ?? { total: 0, attending: 0 };
            return {
              id: item.id,
              slug: item.slug,
              title: titleOf(item),
              status: item.status,
              guests: s.total,
              attending: s.attending,
            };
          })}
        />
      )}
    </div>
  );
}
