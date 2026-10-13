import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAuth } from "@/auth/guard";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** Console admin privat: selalu dinamis. */
export const instant = false;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { session, roles } = await requireAuth();
  if (!roles.includes("admin")) redirect("/dashboard");

  const adminName = session.user.name || session.user.email;

  return (
    <div className="min-h-dvh bg-[#f5f8fa] text-[#142c3c]">
      <AdminSidebar adminName={adminName} />
      <div className="lg:pl-[252px]">
        <header className="sticky top-0 z-20 flex h-[70px] items-center justify-between gap-4 border-b border-[#e4ebee] bg-white px-4 lg:px-7">
          <div className="pl-11 text-xs text-[#687b88] lg:pl-0">
            UndanganE <span className="text-[#a2b0b7]">/</span>{" "}
            <strong className="text-[#142c3c]">Admin Console</strong>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="grid size-[34px] shrink-0 place-items-center rounded-full bg-[#e1efed] text-[11px] font-extrabold text-teal-dark">
              {adminName
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((w) => w[0]!.toUpperCase())
                .join("")}
            </span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1700px] px-4 py-6 pb-14 sm:px-6 lg:px-7 lg:py-7">
          {children}
        </main>
        <footer className="pb-8 text-center text-[10px] text-[#8a98a5]">
          UndanganE Admin Console
        </footer>
      </div>
    </div>
  );
}
