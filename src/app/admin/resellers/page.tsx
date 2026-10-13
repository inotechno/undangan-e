import type { Metadata } from "next";
import { requireAdmin } from "@/auth/guard";
import { listAdminResellers } from "@/modules/admin/server";
import { AdminResellersClient } from "./resellers-client";

export const instant = false;

export const metadata: Metadata = {
  title: "Program Reseller — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminResellersPage() {
  const { session } = await requireAdmin();
  const rows = await listAdminResellers();
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[25px] font-bold tracking-[-0.7px]">Program Reseller</h1>
        <p className="mt-1.5 text-xs text-[#687b88]">
          Pantau status reseller, order upgrade, dan aktivitas mereka.
        </p>
      </div>
      <AdminResellersClient rows={rows} currentUserId={session.user.id} />
    </div>
  );
}
