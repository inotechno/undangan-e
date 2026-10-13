"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { UndanganELogo } from "@/components/brand/undangan-e-logo";
import {
  BookOpen,
  Crown,
  ExternalLink,
  Gift,
  Home,
  LayoutGrid,
  LogOut,
  MessageSquare,
  Menu,
  Palette,
  Receipt,
  Settings,
  Users,
  X,
} from "lucide-react";
import { signOut } from "@/auth/client";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Home;
  soon?: boolean;
  /** Hanya aktif saat pathname persis href (default: prefix match). */
  exact?: boolean;
  /** Aktif saat pathname diawali salah satu href ini (untuk state alternatif). */
  activePrefixes?: string[];
};

const MAIN_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Home, exact: true },
  { href: "/dashboard/undangan", label: "Undangan Saya", icon: LayoutGrid },
  { href: "/dashboard/template", label: "Template", icon: Palette },
  { href: "/dashboard/tamu", label: "Tamu & RSVP", icon: Users, activePrefixes: ["/dashboard/tamu"] },
  { href: "/dashboard/pesanan", label: "Pesanan & Pembayaran", icon: Receipt },
  { href: "/dashboard", label: "Gift Digital", icon: Gift, soon: true },
  { href: "/dashboard", label: "Pesan & Ucapan", icon: MessageSquare, soon: true },
  { href: "/dashboard", label: "Buku Tamu", icon: BookOpen, soon: true },
];

const ACCOUNT_NAV: NavItem[] = [{ href: "/dashboard", label: "Pengaturan", icon: Settings, soon: true }];

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
    <nav className="grid gap-1" aria-label="Navigasi dashboard">
      {items.map((item, i) => {
        const active = item.activePrefixes
          ? item.activePrefixes.some((p) => pathname.startsWith(p))
          : item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
        if (item.soon) {
          return (
            <span
              key={`${item.label}-${i}`}
              className="flex items-center gap-3 rounded-[11px] px-3 py-2.5 text-[13px] text-[#9aa8b4] opacity-70"
              title="Segera hadir"
            >
              <item.icon className="size-[18px] shrink-0" aria-hidden />
              <span className="truncate">{item.label}</span>
              <span className="ml-auto rounded-md border border-border-warm bg-white px-1.5 py-0.5 text-[9px] font-bold text-muted-warm">
                Segera
              </span>
            </span>
          );
        }
        return (
          <Link
            key={`${item.label}-${i}`}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-[11px] px-3 py-2.5 text-[13px] transition-colors",
              active
                ? "bg-teal-soft font-bold text-teal-dark"
                : "text-[#536477] hover:bg-[#f2f8f8] hover:text-teal",
            )}
          >
            <item.icon className="size-[18px] shrink-0" aria-hidden />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarInner({
  userName,
  isAdmin,
  isReseller,
  onNavigate,
  onSignOut,
}: {
  userName: string;
  isAdmin: boolean;
  isReseller: boolean;
  onNavigate?: () => void;
  onSignOut: () => void;
}) {
  const pathname = usePathname();
  const roleLabel = isAdmin ? "Administrator" : isReseller ? "Reseller" : "Akun Reguler";

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto bg-white p-4 lg:p-4">
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="flex items-center gap-2.5 px-2 pt-1 pb-2 font-extrabold tracking-[-0.5px] text-charcoal"
      >
        <span className="grid size-[35px] shrink-0 place-items-center rounded-xl bg-teal shadow-[0_5px_12px_rgba(13,148,136,0.2)]">
          <UndanganELogo
            variant="undangane-icon"
            width={20}
            height={20}
            title="UndanganE"
            className="[&_path]:!fill-white"
          />
        </span>
        <span className="hidden lg:block">
          UndanganE
          <small className="block text-[7px] font-semibold tracking-[2px] text-muted-warm">
            UNDANGAN ELEKTRONIK
          </small>
        </span>
      </Link>

      <div>
        <p className="mb-2 px-3 text-[10px] font-extrabold tracking-[1.5px] text-[#9aa8b4] uppercase">
          Menu Utama
        </p>
        <NavList items={MAIN_NAV} pathname={pathname} onNavigate={onNavigate} />
      </div>

      <div>
        <p className="mb-2 px-3 text-[10px] font-extrabold tracking-[1.5px] text-[#9aa8b4] uppercase">
          Akun
        </p>
        <NavList items={ACCOUNT_NAV} pathname={pathname} onNavigate={onNavigate} />
      </div>

      <div className="mt-auto space-y-4">
        {isAdmin ? (
          <Link
            href="/admin"
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-[11px] border border-[#d5eeeb] bg-[#f2fafa] px-3 py-2.5 text-[13px] font-bold text-teal-dark transition-colors hover:border-teal hover:bg-teal-soft"
          >
            <ExternalLink className="size-[18px] shrink-0" aria-hidden />
            <span className="truncate">Buka Admin Console</span>
          </Link>
        ) : null}

        {!isReseller && !isAdmin ? (
          <div className="rounded-2xl border border-[#d5eeeb] bg-gradient-to-br from-[#eaf8f6] to-[#f7fbfb] p-4">
            <div className="mb-3 grid size-[35px] place-items-center rounded-xl bg-white text-[#a16207]">
              <Crown className="size-[18px]" aria-hidden />
            </div>
            <p className="mb-1.5 text-sm font-bold text-charcoal">Jadi Reseller UndanganE</p>
            <p className="mb-3 text-xs leading-relaxed text-muted-warm">
              Dapatkan harga khusus untuk setiap undangan yang Anda buat.
            </p>
            <Link
              href="/panduan#kontak"
              onClick={onNavigate}
              className="flex h-10 w-full items-center justify-center rounded-[10px] bg-teal text-xs font-bold text-white shadow-[0_4px_10px_rgba(13,148,136,0.13)] transition-colors hover:bg-teal-hover"
            >
              Daftar Reseller →
            </Link>
          </div>
        ) : null}

        <div className="flex items-center gap-2.5 border-t border-border-warm pt-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#d5efeb] text-sm font-extrabold text-teal-dark">
            {initials(userName)}
          </span>
          <span className="hidden min-w-0 flex-1 lg:block">
            <strong className="block truncate text-xs text-charcoal">{userName}</strong>
            <small className="mt-0.5 block text-[11px] text-muted-warm">{roleLabel}</small>
          </span>
          <button
            type="button"
            onClick={onSignOut}
            aria-label="Keluar dari akun"
            title="Keluar"
            className="hidden rounded-lg p-2 text-[#81939a] transition-colors hover:bg-[#f2f8f8] hover:text-teal lg:block"
          >
            <LogOut className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}

export function AppSidebar({
  userName,
  isAdmin,
  isReseller,
}: {
  userName: string;
  isAdmin: boolean;
  isReseller: boolean;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const signOutNow = () => {
    void signOut().then(() => {
      router.push("/masuk");
    });
  };

  return (
    <>
      {/* Desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] border-r border-border-warm bg-white lg:block">
        <SidebarInner
          userName={userName}
          isAdmin={isAdmin}
          isReseller={isReseller}
          onSignOut={signOutNow}
        />
      </aside>

      {/* Mobile trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Buka menu navigasi"
        className="fixed top-3 left-3 z-40 grid size-10 place-items-center rounded-xl border border-border-warm bg-white text-charcoal shadow-sm lg:hidden"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Tutup menu"
            className="absolute inset-0 bg-[#102832]/45"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[270px] border-r border-border-warm bg-white shadow-xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Tutup menu"
              className="absolute top-3.5 right-3 rounded-lg p-1.5 text-muted-warm hover:bg-[#f2f8f8]"
            >
              <X className="size-4" aria-hidden />
            </button>
            <SidebarInner
              userName={userName}
              isAdmin={isAdmin}
              isReseller={isReseller}
              onNavigate={() => setOpen(false)}
              onSignOut={signOutNow}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
