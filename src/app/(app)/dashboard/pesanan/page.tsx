import { requireAuth } from "@/auth/guard";
import { listOrdersForOwner } from "@/modules/payments/orders";
import { PesananClient, type PesananRow } from "./pesanan-client";

export const metadata = { title: "Pesanan & Pembayaran" };

/** Halaman privat: selalu dinamis (cek sesi + data per request). */
export const instant = false;

export default async function PesananPage() {
  const { session } = await requireAuth();
  const orders = await listOrdersForOwner(session.user.id);

  const rows: PesananRow[] = orders.map((o) => ({
    id: o.id,
    kind: o.kind,
    status: o.status,
    payableAmountIdr: o.payableAmountIdr,
    invitationId: o.invitationId,
    invitationSlug: o.invitationSlug,
    invitationTitle: o.invitationTitle,
    createdAt: o.createdAt,
    paidAt: o.paidAt,
  }));

  return <PesananClient items={rows} />;
}
