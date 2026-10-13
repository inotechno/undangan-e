import Link from "next/link";
import { Check, ShieldCheck, Sparkles } from "lucide-react";
import { UndanganELogo } from "@/components/brand/undangan-e-logo";
import { cn } from "@/lib/utils";

type AuthMode = "masuk" | "daftar";

const BENEFITS = [
  "Ratusan template profesional",
  "Kelola tamu dan RSVP dengan mudah",
  "Sesuaikan foto, musik, dan desain",
  "Bagikan melalui tautan atau QR Code",
] as const;

const JOURNEY = [
  {
    title: "Buat akun Anda",
    description: "Daftar dengan email yang aktif.",
  },
  {
    title: "Pilih desain favorit",
    description: "Temukan template untuk berbagai momen.",
  },
  {
    title: "Sesuaikan dan bagikan",
    description: "Isi detail acara, kelola tamu, lalu bagikan tautannya.",
  },
] as const;

export function AuthShell({
  mode,
  children,
}: {
  mode: AuthMode;
  children: React.ReactNode;
}) {
  const isLogin = mode === "masuk";

  return (
    <div className="grid h-[100dvh] overflow-hidden lg:grid-cols-[minmax(0,1.02fr)_minmax(440px,0.98fr)]">
      {/* ── Visual panel ─────────────────────────────────── */}
      <aside
        className="relative hidden min-h-0 overflow-hidden px-8 py-8 lg:flex lg:flex-col lg:justify-between xl:px-14"
        style={{
          background:
            "radial-gradient(ellipse at 80% 18%, #d6efea 0, transparent 34%), linear-gradient(145deg, #f1f9f7, #fffdfa 60%, #e5f4f0)",
        }}
      >
        {/* Decorative rings */}
        <div
          className="pointer-events-none absolute -right-60 -top-60 size-[530px] rounded-full border border-[#b9e0da] shadow-[0_0_0_32px_rgba(214,239,234,0.27),0_0_0_68px_rgba(214,239,234,0.17)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-44 -left-52 size-[340px] rounded-full border border-[#b9e0da] shadow-[0_0_0_28px_rgba(214,239,234,0.22)]"
          aria-hidden
        />

        <Link
          href="/"
          aria-label="UndanganE — beranda"
          className="relative z-[1] w-fit"
        >
          <UndanganELogo variant="undangane-brand" width={170} />
        </Link>

        <div className="relative z-[1] my-6 max-w-[560px] lg:my-8">
          <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[1.1px] text-[#075e59]">
            <span className="h-0.5 w-6 rounded-full bg-teal" aria-hidden />
            {isLogin ? "Selamat datang kembali" : "Mulai perjalanan spesial Anda"}
          </p>
          <h1 className="mt-4 font-heading text-[clamp(2rem,3vw,3.25rem)] leading-[1.08] font-bold tracking-[-0.04em] text-[#142c3c]">
            {isLogin ? "Wujudkan Undangan Digital " : "Buat Undangan Digital "}
            <span className="text-teal">Impian Anda</span>
          </h1>
          <p className="mt-4 max-w-[470px] text-sm leading-[1.8] text-[#5f737e]">
            {isLogin
              ? "Masuk untuk mengelola undangan, memantau konfirmasi tamu, dan menyiapkan momen spesial Anda."
              : "Buat akun gratis dan mulai siapkan undangan yang indah, personal, dan mudah dibagikan kepada orang-orang terdekat."}
          </p>

          {isLogin ? (
            <ul className="mt-7 grid gap-3">
              {BENEFITS.map((benefit) => (
                <li
                  key={benefit}
                  className="flex items-center gap-3 text-[13px] font-semibold text-[#3c5158]"
                >
                  <span className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-[#d5f0e9] text-[#075e59]">
                    <Check className="size-3" aria-hidden />
                  </span>
                  {benefit}
                </li>
              ))}
            </ul>
          ) : (
            <ol className="mt-7 grid gap-4">
              {JOURNEY.map((step, i) => (
                <li key={step.title} className="flex gap-3.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-teal text-[13px] font-extrabold text-white shadow-[0_5px_12px_rgba(13,148,136,0.17)]">
                    {i + 1}
                  </span>
                  <span>
                    <strong className="block text-[13px] text-[#142c3c]">
                      {step.title}
                    </strong>
                    <span className="mt-0.5 block text-[11px] leading-relaxed text-[#697b88]">
                      {step.description}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Invitation preview stage */}
        <div className="relative z-[1] flex min-h-[180px] items-end justify-center xl:min-h-[245px] [@media(max-height:760px)]:hidden">
          <div
            className="absolute bottom-0 h-[210px] w-[300px] rounded-full bg-[#d5eee8] blur-[3px]"
            aria-hidden
          />
          {isLogin ? (
            <>
              <InviteCard className="size-[230px] -rotate-4" />
              <div className="absolute right-[calc(50%-195px)] bottom-3 w-[103px] rotate-[7deg] overflow-hidden rounded-[24px] border-[6px] border-[#233538] bg-white p-1 shadow-[0_16px_30px_rgba(21,63,59,0.16)]">
                <div className="relative flex h-[184px] items-center justify-center rounded-[15px] bg-gradient-to-br from-teal-500 via-emerald-600 to-teal-800">
                  <span className="absolute top-1.5 left-1/2 h-1.5 w-9 -translate-x-1/2 rounded-full bg-[#233538]" />
                  <div className="px-2 text-center font-serif text-white">
                    <p className="text-[6px] tracking-[0.15em]">THE WEDDING OF</p>
                    <p className="mt-0.5 text-[9px] leading-tight">
                      Aldi &amp;
                      <br />
                      Salsabila
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <InviteCard className="size-[190px] -rotate-8" />
              <InviteCard className="ml-6 -mt-2 size-[190px] rotate-8" tone="light" />
            </>
          )}
        </div>

        <div className="relative z-[1] mt-6 flex justify-between gap-3 text-[10px] text-[#81918f]">
          <span>© 2026 UndanganE</span>
          <span>Dirancang untuk momen yang berarti.</span>
        </div>
      </aside>

      {/* ── Form side ────────────────────────────────────── */}
      <main className="flex min-h-0 flex-col overflow-hidden bg-white px-5 py-3 sm:px-8 sm:py-4 xl:px-16">
        <div className="flex shrink-0 items-center gap-3">
          <Link
            href="/"
            aria-label="UndanganE — beranda"
            className="lg:hidden"
          >
            <UndanganELogo variant="undangane-brand" width={130} />
          </Link>
          <div className="ml-auto flex items-center gap-3 text-xs text-muted-warm">
            <span>{isLogin ? "Belum punya akun?" : "Sudah punya akun?"}</span>
            <Link
              href={isLogin ? "/daftar" : "/masuk"}
              className="rounded-[10px] border border-[#b8e1dc] bg-teal-soft/50 px-4 py-2 text-xs font-extrabold text-[#075e59] transition-colors hover:bg-teal-soft"
            >
              {isLogin ? "Daftar Gratis" : "Masuk"}
            </Link>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="mx-auto flex min-h-full w-full max-w-[440px] items-center py-3 sm:py-4">
            {children}
          </div>
        </div>

        <p className="shrink-0 pt-2 text-center text-[10px] leading-relaxed text-[#98a5a9] [@media(max-height:860px)]:hidden">
          Dengan {isLogin ? "masuk" : "mendaftar"}, Anda menyetujui{" "}
          <Link href="/faq#syarat" className="text-[#6f8588] underline-offset-2 hover:underline">
            Syarat &amp; Ketentuan
          </Link>{" "}
          dan{" "}
          <Link href="/faq#privasi" className="text-[#6f8588] underline-offset-2 hover:underline">
            Kebijakan Privasi
          </Link>{" "}
          UndanganE.
        </p>
      </main>
    </div>
  );
}

function InviteCard({
  className,
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  const isLight = tone === "light";
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border-[7px] border-white shadow-[0_24px_45px_rgba(21,63,59,0.13)]",
        isLight
          ? "bg-gradient-to-br from-amber-100 via-rose-50 to-teal-50"
          : "bg-gradient-to-br from-teal-500 via-emerald-600 to-teal-800",
        className
      )}
    >
      <div
        className={cn(
          "absolute inset-3.5 rounded border",
          isLight ? "border-[#142c3c]/25" : "border-white/70"
        )}
        aria-hidden
      />
      <div
        className={cn(
          "flex h-full flex-col items-center justify-center gap-1 px-3 pt-6 text-center font-serif",
          isLight ? "text-[#142c3c]" : "text-white [text-shadow:0_2px_7px_rgba(0,0,0,0.3)]"
        )}
      >
        <p className="flex items-center gap-1.5 text-[8px] tracking-[0.2em]">
          <Sparkles className="size-2.5" aria-hidden />
          THE WEDDING OF
        </p>
        <p className="text-lg leading-snug">Aldi &amp; Salsabila</p>
        <p className="text-[9px] tracking-wider">15 DESEMBER 2026</p>
      </div>
      <span
        className={cn(
          "absolute right-0 bottom-2 left-0 flex items-center justify-center gap-1 text-[7px]",
          isLight ? "text-[#697b88]" : "text-white/80"
        )}
      >
        <ShieldCheck className="size-2.5" aria-hidden />
        UndanganE
      </span>
    </div>
  );
}
