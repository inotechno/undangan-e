"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { UndanganELogo } from "@/components/brand/undangan-e-logo";
import {
  BadgePercent,
  BookOpen,
  Crown,
  Gauge,
  LayoutGrid,
  LogOut,
  Menu,
  Receipt,
  Settings,
  Users,
  X,
} from "lucide-react";
import { signOut } from "@/auth/client";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: typeof Users; soon?: boolean; exact?: boolean };

const OVERVIEW: NavItem[] = [{ href: "/admin", label: "Dashboard", icon: Gauge, exact: true }];

const PLATFORM: NavItem[] = [
  { href: "/admin/users", label: "Pengguna & Peran", icon: Users },
  { href: "/admin/invitations", label: "Undangan", icon: LayoutGrid },
  { href: "/admin/templates", label: "Template", icon: LayoutGrid },
  { href: "/admin/orders", label: "Pesanan & Pembayaran", icon: Receipt },
  { href: "/admin/resellers", label: "Program Reseller", icon: Crown },
  { href: "/admin/vouchers", label: "Voucher", icon: BadgePercent },
  { href: "/admin/pricing", label: "Harga & Pengaturan", icon: Settings },
];

const SYSTEM: NavItem[] = [
  { href: "/admin/audit", label: "Audit Log", icon: BookOpen },
  { href: "/admin/settings", label: "Pengaturan Platform", icon: Settings, soon: true },
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

function NavList({
  items,
  pathname,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="grid gap-1" aria-label="Navigasi admin">
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        if (item.soon) {
          return (
            <span
              key={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs text-[#839aa6] opacity-60"
              title="Segera hadir"
            >
              <item.icon className="size-[17px] shrink-0" aria-hidden />
              <span className="truncate">{item.label}</span>
            </span>
          );
        }
        return (
          <Link
            key={item.href + item.label}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs transition-colors",
              active
                ? "bg-[#0d94882c] font-extrabold text-[#91e2d7] shadow-[inset_3px_0_0_0_#0D9488]"
                : "text-[#c3d2da] hover:bg-[#203d4d] hover:text-white",
            )}
          >
            <item.icon className="size-[17px] shrink-0" aria-hidden />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarInner({
  adminName,
  onNavigate,
  onSignOut,
}: {
  adminName: string;
  onNavigate?: () => void;
  onSignOut: () => void;
}) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto bg-[#142c3c] p-4 text-[#dbe7ed]">
      <Link
        href="/admin"
        onClick={onNavigate}
        className="flex items-center gap-2.5 px-2 pt-1 pb-2 text-white"
      >
        <span className="grid size-[35px] shrink-0 place-items-center rounded-xl bg-teal">
          <UndanganELogo
            variant="undangane-icon"
            width={20}
            height={20}
            title="UndanganE"
            className="[&_path]:!fill-white"
          />
        </span>
        <span className="hidden min-w-0 lg:block">
          <span className="block text-[19px] leading-none font-extrabold tracking-[-0.7px]">
            UndanganE
          </span>
          <small className="mt-0.5 block text-[7px] tracking-[1.8px] text-[#9eb5bf]">
            ADMIN CONSOLE
          </small>
        </span>
        <span className="ml-auto hidden border border-[#3d5664] px-1.5 py-0.5 text-[8px] tracking-[1px] text-[#b7d8d3] lg:block">
          ADMIN
        </span>
      </Link>

      <div>
        <p className="mb-2 px-3 text-[9px] font-extrabold tracking-[1.7px] text-[#839aa6] uppercase">
          Overview
        </p>
        <NavList items={OVERVIEW} pathname={pathname} onNavigate={onNavigate} />
      </div>
      <div>
        <p className="mb-2 px-3 text-[9px] font-extrabold tracking-[1.7px] text-[#839aa6] uppercase">
          Manajemen Platform
        </p>
        <NavList items={PLATFORM} pathname={pathname} onNavigate={onNavigate} />
      </div>
      <div>
        <p className="mb-2 px-3 text-[9px] font-extrabold tracking-[1.7px] text-[#839aa6] uppercase">
          Sistem & Keamanan
        </p>
        <NavList items={SYSTEM} pathname={pathname} onNavigate={onNavigate} />
      </div>

      <div className="mt-auto space-y-4">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs text-[#c3d2da] transition-colors hover:bg-[#203d4d] hover:text-white"
        >
          <LayoutGrid className="size-[17px]" aria-hidden />
          Kembali ke Dashboard
        </Link>
        <div className="flex items-center gap-2 rounded-[10px] border border-[#2e4c5a] bg-[#1d3b4b] px-3 py-2.5 text-[10px] text-[#b9cbd2]">
          <span className="size-[7px] shrink-0 rounded-full bg-[#36c58a] shadow-[0_0_0_4px_rgba(54,197,138,0.12)]" aria-hidden />
          <span className="hidden lg:block">Server aktif · mode produksi</span>
        </div>
        <div className="flex items-center gap-2.5 border-t border-[#2b4654] pt-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#0d948833] text-xs font-extrabold text-[#91e2d7]">
            {initials(adminName)}
          </span>
          <span className="hidden min-w-0 flex-1 lg:block">
            <strong className="block truncate text-xs text-white">{adminName}</strong>
            <small className="mt-0.5 block text-[10px] text-[#839aa6]">Administrator</small>
          </span>
          <button
            type="button"
            onClick={onSignOut}
            aria-label="Keluar"
            title="Keluar"
            className="hidden rounded-lg p-2 text-[#839aa6] transition-colors hover:bg-[#203d4d] hover:text-white lg:block"
          >
            <LogOut className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminSidebar({ adminName }: { adminName: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const signOutNow = () => {
    void signOut().then(() => router.push("/masuk"));
  };

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[252px] bg-[#142c3c] lg:block">
        <SidebarInner adminName={adminName} onSignOut={signOutNow} />
      </aside>

      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Buka menu admin"
        className="fixed top-3 left-3 z-40 grid size-10 place-items-center rounded-xl bg-[#142c3c] text-white shadow-md lg:hidden"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Tutup menu"
            className="absolute inset-0 bg-[#102832]/60"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[270px] shadow-xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Tutup menu"
              className="absolute top-3.5 right-3 z-10 rounded-lg p-1.5 text-[#839aa6] hover:bg-[#203d4d]"
            >
              <X className="size-4" aria-hidden />
            </button>
            <SidebarInner
              adminName={adminName}
              onNavigate={() => setOpen(false)}
              onSignOut={signOutNow}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
