import type { Metadata } from "next";
import { getSessionWithRoles } from "@/auth/guard";
import { redirect } from "next/navigation";
import { PengaturanClient } from "./pengaturan-client";

export const metadata: Metadata = { title: "Pengaturan Akun" };

/** Halaman privat: selalu dinamis (cek sesi per request). */
export const instant = false;

export default async function PengaturanPage() {
  const data = await getSessionWithRoles();
  if (!data) redirect("/masuk");
  const { session, roles } = data;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[25px] font-bold tracking-[-0.7px]">Pengaturan Akun</h1>
        <p className="mt-1.5 text-xs text-[#687b88]">Kelola profil dan keamanan akun Anda.</p>
      </div>
      <PengaturanClient
        userName={session.user.name || session.user.email}
        userEmail={session.user.email}
        isReseller={roles.includes("reseller")}
        isAdmin={roles.includes("admin")}
      />
    </div>
  );
}
