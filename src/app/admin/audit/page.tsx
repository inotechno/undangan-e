import type { Metadata } from "next";
import { listAdminAudit } from "@/modules/admin/server";
import { AdminAuditClient } from "./audit-client";

export const instant = false;

export const metadata: Metadata = {
  title: "Audit Log — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminAuditPage() {
  const rows = await listAdminAudit();
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[25px] font-bold tracking-[-0.7px]">Audit Log</h1>
        <p className="mt-1.5 text-xs text-[#687b88]">
          Catatan tindakan administratif dan perubahan penting.
        </p>
      </div>
      <AdminAuditClient rows={rows} />
    </div>
  );
}
