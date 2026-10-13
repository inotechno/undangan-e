import type { Metadata } from "next";
import { listAdminInvitations } from "@/modules/admin/server";
import { AdminInvitationsClient } from "./invitations-client";

export const instant = false;

export const metadata: Metadata = {
  title: "Manajemen Undangan — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminInvitationsPage() {
  const items = await listAdminInvitations();
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[25px] font-bold tracking-[-0.7px]">Manajemen Undangan</h1>
        <p className="mt-1.5 text-xs text-[#687b88]">
          Pantau publikasi dan status undangan di seluruh platform.
        </p>
      </div>
      <AdminInvitationsClient items={items} />
    </div>
  );
}
