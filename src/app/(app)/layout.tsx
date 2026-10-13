import type { Metadata } from "next";
import { requireAuth } from "@/auth/guard";
import { AppSidebar } from "@/components/app/sidebar";
import { AppTopbar } from "@/components/app/topbar";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** Dashboard bersifat privat & selalu dinamis (cek sesi per request). */
export const instant = false;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { session, roles } = await requireAuth();
  const userName = session.user.name || session.user.email;

  return (
    <div className="min-h-dvh bg-[#f6f9fa] text-charcoal">
      <AppSidebar
        userName={userName}
        isAdmin={roles.includes("admin")}
        isReseller={roles.includes("reseller")}
      />
      <div className="lg:pl-[248px]">
        <AppTopbar userName={userName} />
        <main className="mx-auto w-full max-w-[1700px] px-4 py-6 pb-12 sm:px-6 lg:px-8 lg:py-7">
          {children}
        </main>
      </div>
    </div>
  );
}
