import type { Metadata } from "next";
import Link from "next/link";
import {
  Users,
  LayoutTemplate,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Music,
  MapPin,
  MessageSquareHeart,
  Heart,
  PartyPopper,
  Baby,
  BookOpenCheck,
  CalendarDays,
  Star,
  Quote,
  ChevronDown,
  Mail,
  Clock,
  Gift,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/site/scroll-reveal";
import { Counter } from "@/components/site/counter";
import { env } from "@/core/config";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const FEATURES = [
  {
    icon: LayoutTemplate,
    title: "Template Elegan",
    description:
      "Ratusan template untuk semua jenis acara dengan desain profesional.",
  },
  {
    icon: Sparkles,
    title: "Editor Mudah",
    description:
      "Ubah teks, warna, foto, musik lebih mudah dari tata letak dengan mudah.",
  },
  {
    icon: Users,
    title: "Kelola Tamu & RSVP",
    description:
      "Tamu daftar hadir dengan mudah, pantau RSVP secara real-time.",
  },
  {
    icon: Music,
    title: "Musik & Galeri",
    description: "Tambahkan musik latar dan galeri foto untuk kesan yang lebih personal.",
  },
  {
    icon: Gift,
    title: "Gift Digital",
    description: "Sampaikan informasi hadiah dengan aman dan rapi.",
  },
  {
    icon: MessageSquareHeart,
    title: "Bagikan Sekali, Terima Kasih",
    description:
      "Bagikan link undangan, QR Code, atau WhatsApp dengan mudah.",
  },
] as const;

const STEPS = [
  {
    number: "1",
    title: "Pilih Template",
    description: "Pilih desain favorit dari pratayangan.",
    icon: LayoutTemplate,
  },
  {
    number: "2",
    title: "Sesuaikan Konten",
    description: "Isi informasi acara, edit desain, tambah foto dan musik.",
    icon: Sparkles,
  },
  {
    number: "3",
    title: "Kelola Tamu",
    description: "Tambah daftar tamu dan aktifkan RSVP.",
    icon: Users,
  },
  {
    number: "4",
    title: "Publikasikan",
    description: "Bayar sekali, undangan langsung aktif dan siap dibagikan.",
    icon: Send,
  },
] as const;

const EVENT_TYPES = [
  { icon: Heart, label: "Pernikahan", count: "90+ Template", bg: "bg-teal-soft", color: "text-teal" },
  { icon: Star, label: "Tunangan", count: "40+ Template", bg: "bg-amber-50", color: "text-amber-600" },
  { icon: PartyPopper, label: "Ulang Tahun", count: "35+ Template", bg: "bg-rose-50", color: "text-rose-500" },
  { icon: Baby, label: "Aqiqah", count: "30+ Template", bg: "bg-blue-50", color: "text-blue-500" },
  { icon: BookOpenCheck, label: "Khitanan", count: "25+ Template", bg: "bg-purple-50", color: "text-purple-500" },
  { icon: CalendarDays, label: "Seminar", count: "15+ Template", bg: "bg-emerald-50", color: "text-emerald-600" },
  { icon: Gift, label: "Acara Lainnya", count: "45+ Template", bg: "bg-orange-50", color: "text-orange-500" },
] as const;

const STATS = [
  { icon: Mail, value: "1.000+", label: "Undangan Dibuat" },
  { icon: Users, value: "50.000+", label: "Tamu Undangan" },
  { icon: Clock, value: "99,9%", label: "Uptime Server" },
  { icon: Star, value: "4,9", label: "Rating Pengguna" },
] as const;

const TEMPLATES = [
  { name: "Serenity", category: "Pernikahan • Elegan", color: "from-teal-400 to-emerald-500" },
  { name: "Aksara", category: "Pernikahan • Adat", color: "from-amber-400 to-orange-500" },
  { name: "Blossom", category: "Pernikahan • Floral", color: "from-rose-400 to-pink-500" },
  { name: "Minimalis", category: "Pernikahan • Modern", color: "from-slate-400 to-gray-500" },
  { name: "Royal", category: "Pernikahan • Luxury", color: "from-purple-400 to-indigo-500" },
] as const;

const TESTIMONIALS = [
  {
    name: "Dewi & Rizky",
    role: "Pernikahan, Jakarta",
    text: "Sangat mudah digunakan dan template-nya benar-benar elegan. Tamu kami juga suka dengan tampilannya!",
    rating: 5,
  },
  {
    name: "Budi Santoso",
    role: "Aqiqah Bilqis, Bandung",
    text: "Fitur RSVP sangat membantu, saya bisa memantau tamu yang hadir dengan mudah. Rekomendasi banget!",
    rating: 5,
  },
  {
    name: "Anisa Putri",
    role: "Ulang Tahun, Surabaya",
    text: "Desainnya modern dan banyak pilihan. Proses pembuatan juga cepat tanpa ribet.",
    rating: 5,
  },
] as const;

const FAQS = [
  {
    question: "Apakah semua template bisa digunakan?",
    answer:
      "Ya, semua template bisa digunakan untuk semua jenis acara. Pilih template yang paling cocok dengan acaramu.",
  },
  {
    question: "Berapa lama masa aktif undangan?",
    answer:
      "Undangan aktif permanen setelah publikasi. Tidak ada masa berlaku atau biaya perpanjangan.",
  },
  {
    question: "Apakah ada biaya tambahan?",
    answer:
      "Tidak ada biaya tambahan. Harga sudah termasuk semua fitur, hosting, dan support.",
  },
  {
    question: "Bagaimana cara menjadi reseller?",
    answer:
      "Daftar sebagai reseller dan dapatkan harga khusus. Hubungi tim kami untuk informasi lebih lanjut.",
  },
  {
    question: "Bagaimana cara membagikan undangan?",
    answer:
      "Undangan bisa dibagikan via link langsung, QR Code, atau integrasi WhatsApp. Tamu cukup klik untuk membuka.",
  },
] as const;

export default function LandingPage() {
  const siteUrl = env.APP_URL;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "UndanganE",
        url: siteUrl,
        logo: `${siteUrl}/brand/png/undangane-primary.png`,
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "UndanganE",
        publisher: { "@id": `${siteUrl}/#organization` },
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQS.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ─── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-teal-soft/40 via-background to-background">
        {/* Botanical background */}
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-80"
          style={{ backgroundImage: "url('/brand/deco/hero-botanical.svg')" }}
          aria-hidden
        />
        {/* Dot pattern overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #0D9488 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
          aria-hidden
        />
        {/* Soft glow orbs */}
        <div className="pointer-events-none absolute -left-32 top-20 size-96 rounded-full bg-teal/8 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -right-32 bottom-20 size-96 rounded-full bg-emerald-100 blur-3xl" aria-hidden />

        {/* Floating botanical decorations */}
        <div className="pointer-events-none absolute left-[6%] top-[12%] animate-float opacity-40" aria-hidden>
          <svg width="70" height="70" viewBox="0 0 70 70" fill="none">
            <path d="M35 5C35 5 42 18 42 30C42 42 35 55 35 55C35 55 28 42 28 30C28 18 35 5 35 5Z" fill="#0D9488" fillOpacity="0.25"/>
            <path d="M5 35C5 35 18 28 30 28C42 28 55 35 55 35C55 35 42 42 30 42C18 42 5 35 5 35Z" fill="#0D9488" fillOpacity="0.18"/>
          </svg>
        </div>
        <div className="pointer-events-none absolute right-[8%] top-[20%] animate-float-slow opacity-35" aria-hidden>
          <svg width="50" height="50" viewBox="0 0 50 50" fill="none">
            <circle cx="25" cy="25" r="10" stroke="#0D9488" strokeWidth="1.5" strokeOpacity="0.35"/>
            <circle cx="25" cy="25" r="4" fill="#0D9488" fillOpacity="0.3"/>
            <circle cx="25" cy="25" r="18" stroke="#0D9488" strokeWidth="0.5" strokeOpacity="0.2"/>
          </svg>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left content */}
            <div className="text-center lg:text-left">
              <ScrollReveal>
                <div className="inline-flex items-center gap-2 rounded-full bg-teal-soft px-4 py-2 text-sm font-medium text-teal">
                  <Sparkles className="size-4" aria-hidden />
                  Mudah · Elegan · Tanpa Ribet
                </div>
              </ScrollReveal>

              <ScrollReveal delay={100}>
                <h1 className="mt-6 font-heading text-4xl font-bold leading-tight text-charcoal sm:text-5xl lg:text-6xl">
                  Buat Undangan Digital
                  <br />
                  <span className="text-teal">untuk Momen Spesial Anda</span>
                </h1>
              </ScrollReveal>

              <ScrollReveal delay={200}>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-warm">
                  Pilih template favorit, sesuaikan dengan gaya Anda, bagikan ke
                  tamu lewat link atau QR, lengkap dengan RSVP, musik, galeri
                  dan banyak lagi.
                </p>
              </ScrollReveal>

              <ScrollReveal delay={300}>
                <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
                  <Button
                    size="lg"
                    className="h-12 px-8 text-base"
                    nativeButton={false}
                    render={<Link href="/daftar" />}
                  >
                    Buat Undangan Sekarang
                    <ArrowRight data-icon="inline-end" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 gap-2 px-8 text-base"
                    nativeButton={false}
                    render={<Link href="/template" />}
                  >
                    <PlayIcon />
                    Lihat Template
                  </Button>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={400}>
                <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-muted-warm sm:justify-center lg:justify-start">
                  {["Tanpa instalasi", "Bisa langsung dipakai", "Harga transparan", "Dukungan penuh"].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-teal" aria-hidden />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            </div>

            {/* Right - Device Mockup */}
            <ScrollReveal variant="right" className="relative hidden lg:block">
              <div className="relative mx-auto max-w-lg">
                {/* Background glow */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-teal/10 to-emerald-100 blur-2xl" aria-hidden />

                {/* Main device mockup */}
                <div className="relative">
                  {/* Laptop frame */}
                  <div className="rounded-t-2xl border-2 border-b-0 border-charcoal/20 bg-charcoal p-2 shadow-2xl">
                    <div className="aspect-[16/10] overflow-hidden rounded-t-lg bg-gradient-to-br from-rose-50 via-white to-teal-50">
                      {/* Wedding invitation preview inside laptop */}
                      <div className="flex h-full flex-col items-center justify-center p-6">
                        <div className="text-center">
                          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-warm">
                            The Wedding of
                          </p>
                          <p className="mt-2 font-heading text-2xl font-bold text-charcoal">
                            Aldi &amp; Salsabila
                          </p>
                          <p className="mt-1 text-sm text-muted-warm">
                            Minggu, 11 Desember 2024
                          </p>
                          <button
                            type="button"
                            tabIndex={-1}
                            className="mt-4 rounded-full bg-teal px-6 py-2 text-sm font-semibold text-white pointer-events-none"
                          >
                            Buka Undangan
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Laptop base */}
                  <div className="mx-auto h-3 w-32 rounded-b-lg bg-charcoal/30" aria-hidden />

                  {/* Phone overlay */}
                  <div className="absolute -bottom-8 -right-4 w-40 animate-float">
                    <div className="rounded-2xl border-2 border-charcoal/20 bg-charcoal p-1.5 shadow-xl">
                      <div className="aspect-[9/16] overflow-hidden rounded-xl bg-gradient-to-b from-rose-50 to-white">
                        <div className="flex h-full flex-col items-center justify-center p-3">
                          <div className="text-center">
                            <p className="text-[7px] uppercase tracking-[0.2em] text-muted-warm">
                              The Wedding of
                            </p>
                            <p className="mt-1 font-heading text-sm font-bold text-charcoal">
                              Aldi &amp; Salsabila
                            </p>
                            <p className="mt-0.5 text-[8px] text-muted-warm">
                              Minggu, 11 Desember 2024
                            </p>
                            {/* Countdown */}
                            <div className="mt-2 flex justify-center gap-1">
                              {["12", "08", "24", "36"].map((n, i) => (
                                <div key={i} className="rounded bg-white px-1 py-0.5 shadow-sm">
                                  <span className="text-[8px] font-bold text-charcoal">{n}</span>
                                </div>
                              ))}
                            </div>
                            <button
                              type="button"
                              tabIndex={-1}
                              className="mt-2 w-full rounded-full bg-teal py-1 text-[7px] font-semibold text-white pointer-events-none"
                            >
                              Buka Undangan
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Floating badges */}
                  <div className="absolute -left-8 top-20 animate-float-slow">
                    <div className="flex items-center gap-2 rounded-lg border border-border-warm bg-surface px-3 py-2 shadow-lg">
                      <CheckCircle2 className="size-4 text-teal" />
                      <span className="text-xs font-medium text-charcoal">RSVP: 120 hadir</span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ─── Stats ────────────────────────────────────────── */}
      <section className="relative border-y border-border-warm bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14">
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {STATS.map((stat, i) => (
              <ScrollReveal key={stat.label} delay={i * 100} className="flex items-center gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-teal-soft text-teal">
                  <stat.icon className="size-5" aria-hidden />
                </div>
                <div>
                  <p className="text-2xl font-heading font-bold text-charcoal sm:text-3xl">
                    <Counter value={stat.value} />
                  </p>
                  <p className="text-sm text-muted-warm">{stat.label}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Event Types ──────────────────────────────────── */}
      <section className="relative border-b border-border-warm bg-soft-warm">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <ScrollReveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-teal">
              Berbagai Pilihan
            </p>
            <h2 className="mt-2 heading-display">Untuk Setiap Acara Spesial</h2>
            <p className="mt-3 text-muted-warm">
              Tersedia berbagai pilihan template untuk berbagai jenis acara, dari
              pernikahan hingga acara persisnya.
            </p>
          </ScrollReveal>

          <div className="relative mt-12">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
              {EVENT_TYPES.map((event, i) => (
                <ScrollReveal key={event.label} delay={i * 60}>
                  <Link
                    href="/template"
                    className="group flex flex-col items-center gap-3 rounded-2xl border border-border-warm bg-surface p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:border-teal/40 hover:shadow-[0_8px_24px_rgb(13_148_136/0.12)]"
                  >
                    <div className={`flex size-14 items-center justify-center rounded-xl ${event.bg} ${event.color} transition-all duration-300 group-hover:scale-110`}>
                      <event.icon className="size-6" aria-hidden />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-charcoal">
                        {event.label}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-warm">
                        {event.count}
                      </p>
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Template Showcase ────────────────────────────── */}
      <section className="relative border-b border-border-warm bg-soft-surface overflow-hidden">
        {/* Mandala decoration */}
        <div
          className="pointer-events-none absolute -right-20 top-1/2 size-96 -translate-y-1/2 opacity-40"
          style={{ backgroundImage: "url('/brand/deco/mandala-floral.svg')", backgroundSize: "contain", backgroundRepeat: "no-repeat" }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <ScrollReveal className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-teal">
                Koleksi Pilihan
              </p>
              <h2 className="mt-2 heading-display">Template Undangan Terbaru</h2>
              <p className="mt-2 text-muted-warm">
                Ratusan template dengan desain profesional yang bisa langsung Anda gunakan.
              </p>
            </div>
            <Button
              variant="ghost"
              className="text-teal hover:text-teal-hover"
              nativeButton={false}
              render={<Link href="/template" />}
            >
              Lihat Semua Template
              <ArrowRight data-icon="inline-end" />
            </Button>
          </ScrollReveal>

          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {TEMPLATES.map((template, i) => (
              <ScrollReveal key={template.name} delay={i * 80}>
                <Link
                  href="/template"
                  className="group block overflow-hidden rounded-2xl border border-border-warm bg-surface transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgb(0_0_0/0.1)]"
                >
                  <div className={`aspect-[3/4] bg-gradient-to-br ${template.color} relative`}>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                      <Heart className="size-8 mb-2" fill="currentColor" />
                      <p className="font-heading text-lg font-bold">{template.name}</p>
                    </div>
                    <div className="absolute right-3 top-3 rounded-full bg-white/90 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <Heart className="size-4 text-rose-500" fill="currentColor" />
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-charcoal">{template.name}</h3>
                    <p className="mt-1 text-sm text-muted-warm">{template.category}</p>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Fitur Utama ──────────────────────────────────── */}
      <section className="relative border-b border-border-warm bg-soft-band">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <ScrollReveal>
                <p className="text-sm font-semibold uppercase tracking-wider text-teal">
                  Kenapa UndanganE?
                </p>
                <h2 className="mt-2 heading-display">
                  Semua yang Anda Butuhkan
                  <br />
                  dalam Satu Platform
                </h2>
                <p className="mt-4 leading-relaxed text-muted-warm">
                  Dari desain hingga pengelolaan tamu, semua fitur tersedia untuk
                  membuat undangan digital yang berkesan.
                </p>
              </ScrollReveal>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {FEATURES.map((feature, i) => (
                  <ScrollReveal key={feature.title} delay={i * 100}>
                    <div className="group rounded-xl border border-border-warm bg-surface p-5 transition-all duration-300 hover:border-teal/30 hover:shadow-[0_4px_16px_rgb(13_148_136/0.08)]">
                      <div className="flex size-11 items-center justify-center rounded-lg bg-teal-soft text-teal transition-colors duration-300 group-hover:bg-teal group-hover:text-white">
                        <feature.icon className="size-5" aria-hidden />
                      </div>
                      <h3 className="mt-3 text-sm font-semibold text-charcoal">
                        {feature.title}
                      </h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-warm">
                        {feature.description}
                      </p>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>

            {/* Phone mockup with botanical decoration */}
            <ScrollReveal variant="right" className="relative hidden lg:flex items-center justify-center">
              <div className="relative">
                {/* Vine border decoration */}
                <div className="absolute -inset-10 opacity-30" aria-hidden>
                  <div className="absolute left-0 top-0 h-full w-16 bg-[url('/brand/deco/vine-border.svg')] bg-contain bg-left bg-no-repeat" />
                  <div className="absolute right-0 top-0 h-full w-16 -scale-x-100 bg-[url('/brand/deco/vine-border.svg')] bg-contain bg-right bg-no-repeat" />
                </div>

                {/* Phone */}
                <div className="relative w-72 animate-float">
                  <div className="rounded-[2.5rem] border-[3px] border-charcoal/20 bg-charcoal p-2 shadow-[0_25px_80px_rgb(0_0_0/0.15)]">
                    <div className="aspect-[9/16] overflow-hidden rounded-[2rem] bg-gradient-to-b from-rose-50 via-white to-teal-50">
                      {/* Status bar */}
                      <div className="flex items-center justify-between px-6 pt-3 pb-1">
                        <span className="text-[10px] font-medium text-charcoal/60">09:41</span>
                        <div className="h-4 w-16 rounded-full bg-charcoal/10" />
                        <span className="text-[10px] font-medium text-charcoal/60">100%</span>
                      </div>

                      {/* Content */}
                      <div className="flex flex-col items-center gap-3 px-6 py-8">
                        <div className="flex size-16 items-center justify-center rounded-full bg-teal-soft animate-pulse-glow">
                          <Heart className="size-8 text-teal" fill="currentColor" />
                        </div>
                        <p className="text-center text-[10px] uppercase tracking-[0.25em] text-muted-warm">
                          The Wedding of
                        </p>
                        <p className="text-center font-heading text-2xl font-bold text-charcoal">
                          Aldi &amp; Salsabila
                        </p>
                        <p className="text-center text-xs text-muted-warm">
                          Minggu, 11 Desember 2024
                        </p>

                        {/* Countdown */}
                        <div className="mt-2 flex gap-2">
                          {["12", "08", "24", "36"].map((n, i) => (
                            <div key={i} className="flex h-12 w-10 flex-col items-center justify-center rounded-lg bg-white shadow-sm">
                              <span className="text-sm font-bold text-charcoal">{n}</span>
                              <span className="text-[8px] text-muted-warm">
                                {["Hari", "Jam", "Mnt", "Dtk"][i]}
                              </span>
                            </div>
                          ))}
                        </div>

                        <button
                          type="button"
                          tabIndex={-1}
                          className="mt-4 h-10 w-full rounded-full bg-teal text-sm font-semibold text-white pointer-events-none"
                        >
                          Buka Undangan
                        </button>

                        {/* Bottom icons */}
                        <div className="mt-4 flex justify-center gap-4 text-muted-warm">
                          {[MapPin, Music, Users, MessageSquareHeart].map((Icon, i) => (
                            <Icon key={i} className="size-4" aria-hidden />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Floating music note */}
                  <div className="absolute -right-4 top-1/3 animate-float-slow">
                    <div className="rounded-full bg-teal p-3 shadow-lg">
                      <Music className="size-4 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ─── Cara Kerja ───────────────────────────────────── */}
      <section className="relative border-b border-border-warm bg-soft-surface">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <ScrollReveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-teal">
              Cara Kerja
            </p>
            <h2 className="mt-2 heading-display">
              Buat Undangan Digital dalam 4 Langkah Mudah
            </h2>
            <p className="mt-3 text-muted-warm">
              Proses cepat, sederhana, dan bisa langsung Anda lakukan sendiri.
            </p>
          </ScrollReveal>

          <div className="relative mt-14">
            {/* Connection line */}
            <div className="absolute left-[15%] right-[15%] top-10 hidden h-0.5 bg-gradient-to-r from-teal/20 via-teal/30 to-teal/20 lg:block" aria-hidden />

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, i) => (
                <ScrollReveal key={step.number} delay={i * 150} className="relative">
                  <div className="flex flex-col items-center text-center">
                    {/* Number circle */}
                    <div className="relative z-10 flex size-20 items-center justify-center rounded-full bg-teal text-white shadow-lg">
                      <step.icon className="size-8" aria-hidden />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-charcoal">
                      {step.title}
                    </h3>
                    <p className="mt-2 max-w-[200px] text-sm text-muted-warm">
                      {step.description}
                    </p>
                  </div>
                  {/* Arrow connector — centered on the line */}
                  {i < STEPS.length - 1 && (
                    <div className="absolute -right-4 top-10 hidden -translate-y-1/2 lg:block" aria-hidden>
                      <ArrowRight className="size-5 text-teal/40" />
                    </div>
                  )}
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─────────────────────────────────── */}
      <section className="relative border-b border-border-warm bg-soft-warm">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <ScrollReveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-teal">
              Apa Kata Mereka?
            </p>
            <h2 className="mt-2 heading-display">Dipercaya untuk Berbagai Momen Spesial</h2>
            <p className="mt-3 text-muted-warm">
              Ribuan pengguna telah memperpanjang undangan digital mereka kepada UndanganE.
            </p>
          </ScrollReveal>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <ScrollReveal key={t.name} delay={i * 120}>
                <figure className="relative flex h-full flex-col rounded-2xl border border-border-warm bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgb(0_0_0/0.06)]">
                  {/* Quote mark */}
                  <div className="absolute -top-4 left-6 flex size-8 items-center justify-center rounded-full bg-teal text-white">
                    <Quote className="size-4" />
                  </div>
                  <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-charcoal">
                    &ldquo;{t.text}&rdquo;
                  </blockquote>
                  <figcaption className="mt-5 flex items-center gap-3 border-t border-border-warm pt-4">
                    <div className="flex size-10 items-center justify-center rounded-full bg-teal-soft text-sm font-semibold text-teal">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-charcoal">{t.name}</p>
                      <p className="text-xs text-muted-warm">{t.role}</p>
                    </div>
                  </figcaption>
                </figure>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ──────────────────────────────────────── */}
      <section className="relative border-b border-border-warm bg-soft-surface overflow-hidden">
        {/* Rings ornament background */}
        <div
          className="pointer-events-none absolute -left-24 top-1/2 size-80 -translate-y-1/2 opacity-30"
          style={{ backgroundImage: "url('/brand/deco/rings-ornament.svg')", backgroundSize: "contain", backgroundRepeat: "no-repeat" }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <ScrollReveal variant="left">
              <p className="text-sm font-semibold uppercase tracking-wider text-teal">
                Harga Transparan
              </p>
              <h2 className="mt-2 heading-display">
                Satu Harga,
                <br />
                Semua Template
              </h2>
              <p className="mt-4 leading-relaxed text-muted-warm">
                Nikmati akses ke seluruh template tanpa biaya tambahan.
                Harga jelas, tanpa langganan, tanpa biaya tersembunyi.
              </p>
              <div className="mt-8 space-y-4">
                {[
                  "Akses semua template",
                  "Semua fitur undangan",
                  "Bayar sekali per undangan",
                  "Harga khusus reseller tersedia",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="size-5 text-teal" aria-hidden />
                    <span className="text-charcoal">{item}</span>
                  </div>
                ))}
              </div>
            </ScrollReveal>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Reguler */}
              <ScrollReveal delay={100}>
                <div className="rounded-2xl border border-border-warm bg-surface p-6">
                  <p className="text-sm font-medium text-muted-warm">Reguler</p>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-heading font-bold text-charcoal">Rp 15.000</span>
                    <span className="text-sm text-muted-warm">/undangan</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-warm">
                    Untuk penggunaan personal
                  </p>
                  <ul className="mt-5 space-y-3">
                    {["Semua template", "Semua fitur undangan", "Masa aktif tanpa batas", "Dukungan pelanggan"].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="size-4 text-teal" aria-hidden />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-6 w-full"
                    variant="outline"
                    nativeButton={false}
                    render={<Link href="/daftar" />}
                  >
                    Buat Undangan Sekarang
                  </Button>
                </div>
              </ScrollReveal>

              {/* Reseller */}
              <ScrollReveal delay={200}>
                <div className="relative rounded-2xl border-2 border-teal bg-surface p-6 shadow-[0_8px_32px_rgb(13_148_136/0.1)]">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-teal px-3 py-1 text-xs font-semibold text-white">
                    Lebih Hemat
                  </div>
                  <p className="text-sm font-medium text-teal">Reseller</p>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-heading font-bold text-teal">Rp 10.000</span>
                    <span className="text-sm text-muted-warm">/undangan</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-warm">
                    Untuk reseller terdaftar
                  </p>
                  <ul className="mt-5 space-y-3">
                    {["Semua template", "Semua fitur undangan", "Masa aktif tanpa batas", "Dukungan prioritas"].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="size-4 text-teal" aria-hidden />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-6 w-full"
                    nativeButton={false}
                    render={<Link href="/daftar" />}
                  >
                    Daftar sebagai Reseller
                  </Button>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ──────────────────────────────────────────── */}
      <section className="relative border-b border-border-warm bg-soft-warm">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
          <ScrollReveal className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-teal">
              Pertanyaan yang Sering Diajukan
            </p>
            <h2 className="mt-2 heading-display">Pertanyaan Seputar UndanganE</h2>
            <Button
              variant="ghost"
              className="mt-4 text-teal hover:text-teal-hover"
              nativeButton={false}
              render={<Link href="/faq" />}
            >
              Lihat Semua FAQ
              <ArrowRight data-icon="inline-end" />
            </Button>
          </ScrollReveal>

          <div className="mt-10 space-y-4">
            {FAQS.map((faq, i) => (
              <ScrollReveal key={faq.question} delay={i * 80}>
                <details className="group rounded-xl border border-border-warm bg-surface p-5 transition-colors hover:border-teal/30">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-semibold text-charcoal marker:content-none">
                    {faq.question}
                    <ChevronDown className="size-5 shrink-0 text-muted-warm transition-transform group-open:rotate-180" aria-hidden />
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted-warm">
                    {faq.answer}
                  </p>
                </details>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-r from-teal via-teal to-emerald-600">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)",
            backgroundSize: "20px 20px",
          }}
          aria-hidden
        />
        <div className="pointer-events-none absolute -left-24 top-1/2 size-80 -translate-y-1/2 rounded-full bg-white/10 blur-[80px]" aria-hidden />
        <div className="pointer-events-none absolute -right-16 top-1/4 size-64 rounded-full bg-white/10 blur-[60px]" aria-hidden />

        <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-8 px-4 py-16 sm:px-6 sm:py-20 lg:flex-row lg:justify-between">
          <ScrollReveal>
            <p className="text-sm font-medium uppercase tracking-wider text-teal-100">
              Mulai Sekarang
            </p>
            <h2 className="mt-2 font-heading text-3xl font-bold text-white sm:text-4xl">
              Siap membuat undangan digital Anda?
            </h2>
            <p className="mt-3 max-w-xl text-teal-100">
              Bergabunglah dengan ribuan pengguna yang telah membuat
              momen mereka lebih berkesan bersama UndanganE.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={150}>
            <Button
              size="lg"
              className="h-12 bg-white px-8 text-base text-teal hover:bg-teal-soft"
              nativeButton={false}
              render={<Link href="/daftar" />}
            >
              Buat Undangan Sekarang
              <ArrowRight data-icon="inline-end" />
            </Button>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}

function PlayIcon() {
  return (
    <svg
      className="size-5"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
