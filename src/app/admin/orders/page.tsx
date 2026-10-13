import type { Metadata } from "next";
import { getAdminOverview, listAdminOrders } from "@/modules/admin/server";
import { AdminOrdersClient } from "./orders-client";

export const instant = false;

export const metadata: Metadata = {
  title: "Pesanan & Pembayaran — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminOrdersPage() {
  const [orders, overview] = await Promise.all([listAdminOrders(), getAdminOverview()]);
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[25px] font-bold tracking-[-0.7px]">Pesanan & Pembayaran</h1>
        <p className="mt-1.5 text-xs text-[#687b88]">
          Pantau publikasi undangan dan upgrade reseller.
        </p>
      </div>
      <AdminOrdersClient
        orders={orders}
        stats={{
          paid: overview.paidOrders,
          revenue: overview.revenueIdr,
          awaiting: overview.awaitingOrders,
          upgrade: overview.upgradePaid,
        }}
      />
    </div>
  );
}
