import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Montserrat } from "next/font/google";
import { env } from "@/core/config";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const heading = Montserrat({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(env.APP_URL),
  title: {
    default: "UndanganE — Buat Undangan Digital Gratis & Modern",
    template: "%s | UndanganE",
  },
  description:
    "Buat undangan digital pernikahan, tunangan, ulang tahun, aqiqah, dan acara lainnya. Bagikan via link atau QR, kelola RSVP dan buku tamu dalam satu dashboard.",
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "UndanganE",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${sans.variable} ${heading.variable} h-full`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
