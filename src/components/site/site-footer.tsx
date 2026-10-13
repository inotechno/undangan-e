import Link from "next/link";
import { Send } from "lucide-react";
import { UndanganELogo } from "@/components/brand/undangan-e-logo";

const CURRENT_YEAR = 2026;

const FOOTER_LINKS: Array<{ title: string; links: Array<{ href: string; label: string }> }> = [
  {
    title: "Produk",
    links: [
      { href: "/template", label: "Template" },
      { href: "/harga", label: "Harga" },
      { href: "/", label: "Fitur" },
    ],
  },
  {
    title: "Bantuan",
    links: [
      { href: "/faq", label: "FAQ" },
      { href: "/panduan", label: "Panduan" },
      { href: "/panduan#kontak", label: "Kontak" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/faq#privasi", label: "Privasi" },
      { href: "/faq#syarat", label: "Syarat & Ketentuan" },
      { href: "/faq#lisensi", label: "Lisensi Template" },
    ],
  },
];

const SOCIAL_LINKS = [
  { label: "Instagram", href: "#" },
  { label: "TikTok", href: "#" },
  { label: "YouTube", href: "#" },
  { label: "Facebook", href: "#" },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-charcoal text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <UndanganELogo variant="undangane-compact" width={140} className="brightness-0 invert" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
              Platform undangan digital modern untuk berbagai jenis acara.
              Mudah, elegan, dan lengkap.
            </p>
            <div className="mt-6 flex gap-3">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="flex size-10 items-center justify-center rounded-lg bg-white/10 transition-colors hover:bg-white/20"
                  aria-label={social.label}
                >
                  <span className="text-xs font-medium">{social.label.charAt(0)}</span>
                </a>
              ))}
            </div>
          </div>

          {FOOTER_LINKS.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                {group.title}
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-white/70">
                {group.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link href={link.href} className="transition-colors hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Newsletter
            </h3>
            <p className="mt-4 text-sm text-white/70">
              Dapatkan info promo &amp; template terbaru dari kami.
            </p>
            <form className="mt-4 flex gap-2">
              <input
                type="email"
                placeholder="Email Anda"
                className="h-10 w-full min-w-0 flex-1 rounded-lg border border-white/20 bg-white/10 px-3 text-sm text-white placeholder:text-white/50 focus:border-white/40 focus:outline-none"
              />
              <button
                type="submit"
                className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-teal transition-colors hover:bg-teal-hover"
                aria-label="Subscribe newsletter"
              >
                <Send className="size-4" />
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-8 text-sm text-white/50">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p>© {CURRENT_YEAR} UndanganE. Seluruh hak cipta dilindungi.</p>
            <div className="flex gap-6">
              <Link href="#" className="transition-colors hover:text-white">Tentang Kami</Link>
              <Link href="#" className="transition-colors hover:text-white">Karir</Link>
              <Link href="#" className="transition-colors hover:text-white">Peta Situs</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
