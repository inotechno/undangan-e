"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, LayoutList, BadgePercent, Settings2 } from "lucide-react";
import { UndanganELogo } from "@/components/brand/undangan-e-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { signOut } from "@/auth/client";

export function AppHeader({ userName, isAdmin }: { userName: string; isAdmin?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 border-b border-border-warm bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" aria-label="UndanganE — dashboard" className="shrink-0">
            <UndanganELogo variant="undangane-brand" width={130} />
          </Link>
          <nav aria-label="Navigasi dashboard" className="hidden items-center gap-1 sm:flex">
            <Link
              href="/dashboard"
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-warm transition-colors hover:text-charcoal",
                pathname.startsWith("/dashboard") && "bg-accent text-charcoal",
              )}
            >
              <LayoutList className="size-4" aria-hidden />
              Undangan Saya
            </Link>
            {isAdmin ? (
              <>
                <Link
                  href="/admin/pricing"
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-warm transition-colors hover:text-charcoal",
                    pathname.startsWith("/admin/pricing") && "bg-accent text-charcoal",
                  )}
                >
                  <Settings2 className="size-4" aria-hidden />
                  Harga
                </Link>
                <Link
                  href="/admin/vouchers"
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-warm transition-colors hover:text-charcoal",
                    pathname.startsWith("/admin/vouchers") && "bg-accent text-charcoal",
                  )}
                >
                  <BadgePercent className="size-4" aria-hidden />
                  Voucher
                </Link>
              </>
            ) : null}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden max-w-[180px] truncate text-sm text-muted-warm sm:block">
            {userName}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void signOut().then(() => router.push("/masuk"));
            }}
          >
            <LogOut className="size-4" aria-hidden />
            Keluar
          </Button>
        </div>
      </div>
    </header>
  );
}
