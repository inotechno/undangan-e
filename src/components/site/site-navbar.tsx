"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { UndanganELogo } from "@/components/brand/undangan-e-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/template", label: "Template" },
  { href: "/harga", label: "Harga" },
  { href: "/faq", label: "FAQ" },
  { href: "/panduan", label: "Panduan" },
] as const;

export function SiteNavbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md transition-all duration-300",
        scrolled
          ? "border-border-warm shadow-[0_1px_12px_rgb(0_0_0/0.06)]"
          : "border-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="UndanganE — beranda" className="shrink-0">
          <UndanganELogo variant="undangane-brand" width={140} />
        </Link>

        <nav aria-label="Navigasi utama" className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative rounded-lg px-3 py-2 text-sm font-medium text-muted-warm transition-colors hover:text-charcoal",
                pathname.startsWith(item.href) && "text-charcoal",
              )}
            >
              {item.label}
              {pathname.startsWith(item.href) ? (
                <span className="absolute bottom-0.5 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-teal" />
              ) : null}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/masuk" />}>
            Masuk
          </Button>
          <Button size="sm" nativeButton={false} render={<Link href="/daftar" />}>
            Daftar Gratis
          </Button>
        </div>

        <button
          type="button"
          className="inline-flex size-10 items-center justify-center rounded-lg text-charcoal md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Tutup menu" : "Buka menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open ? (
        <div id="mobile-nav" className="border-t border-border-warm md:hidden">
          <nav aria-label="Navigasi seluler" className="flex flex-col gap-1 px-4 py-3">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-charcoal hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-border-warm pt-3">
              <Button variant="outline" nativeButton={false} render={<Link href="/masuk" />}>
                Masuk
              </Button>
              <Button nativeButton={false} render={<Link href="/daftar" />}>Daftar Gratis</Button>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
