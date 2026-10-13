import type { Metadata } from "next";
import { requireAdmin } from "@/auth/guard";
import { listAdminUsers } from "@/modules/admin/server";
import { AdminUsersClient } from "./users-client";

export const instant = false;

export const metadata: Metadata = {
  title: "Pengguna & Peran — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminUsersPage() {
  const { session } = await requireAdmin();
  const users = await listAdminUsers();
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[25px] font-bold tracking-[-0.7px]">Pengguna & Peran</h1>
        <p className="mt-1.5 text-xs text-[#687b88]">
          Kelola akun, status, dan kapabilitas dengan audit trail.
        </p>
      </div>
      <AdminUsersClient users={users} currentUserId={session.user.id} />
    </div>
  );
}
