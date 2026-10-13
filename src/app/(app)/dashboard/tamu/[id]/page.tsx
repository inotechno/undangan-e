import { notFound } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { requireAuth } from "@/auth/guard";
import { db, schema } from "@/db";
import { env } from "@/core/config";
import { listGuests, type GuestRow, type GuestStats } from "@/modules/guests/server";
import { listWishesForOwner, type WishRow } from "@/modules/guests/wishes";
import { GuestManager } from "./guest-manager";

export const metadata = { title: "Kelola Tamu" };

export const instant = false;

type Params = { params: Promise<{ id: string }> };

export default async function TamuDetailPage({ params }: Params) {
  const { session } = await requireAuth();
  const { id } = await params;

  const [inv] = await db
    .select({ id: schema.invitations.id, slug: schema.invitations.slug, status: schema.invitations.status })
    .from(schema.invitations)
    .where(
      and(
        eq(schema.invitations.id, id),
        eq(schema.invitations.ownerId, session.user.id),
        isNull(schema.invitations.deletedAt),
      ),
    )
    .limit(1);
  if (!inv) notFound();

  const [guestResult, wishes] = await Promise.all([
    listGuests(inv.id, session.user.id, false, {}, env.APP_URL),
    listWishesForOwner(inv.id),
  ]);
  if (!guestResult) notFound();

  return (
    <GuestManager
      invitationId={inv.id}
      slug={inv.slug}
      isActive={inv.status === "active"}
      appUrl={env.APP_URL}
      initialItems={guestResult.items as GuestRow[]}
      initialStats={guestResult.stats as GuestStats}
      initialWishes={wishes.items as WishRow[]}
      wishVisible={wishes.visible}
      wishHidden={wishes.hidden}
    />
  );
}
