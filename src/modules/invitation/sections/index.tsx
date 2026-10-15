import Image from "next/image";
import { MapPin, CalendarDays, Clock, Heart, Sparkles, Gift, Quote } from "lucide-react";
import { ScrollReveal } from "@/components/site/scroll-reveal";
import { cn } from "@/lib/utils";
import { decorationSrc } from "../theme";
import {
  DEFAULT_EYEBROWS,
  sectionLabel,
  type GuestContext,
  type InvitationConfig,
  type SectionId,
  type SectionLabels,
  type ThemeTokens,
  type WishItem,
} from "../types";
import { CopyButton, Countdown, ScrollCue } from "./interactive";
import { GuestbookForm, GuestQrCard, RsvpForm } from "./guest-interactive";

export interface SectionContext {
  config: InvitationConfig;
  theme: ThemeTokens;
  guest?: GuestContext | null;
  wishes?: WishItem[];
  mode?: "live" | "preview";
  labels?: SectionLabels | null;
  /** Label judul section dari config user (override label template). */
  userLabels?: SectionLabels | null;
  /** Slug undangan publik (dipakai form RSVP/ucapan untuk POST /api/i/[slug]/…). */
  slug?: string;
}

const fmtDate = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(iso).toLocaleDateString("id-ID", opts);

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

function Ornament({ kind, className }: { kind: ThemeTokens["decorations"]; className?: string }) {
  const src = decorationSrc(kind);
  if (!src) return null;
  return (
    <Image
      src={src}
      alt=""
      aria-hidden
      width={160}
      height={48}
      unoptimized
      className={cn("mx-auto h-8 w-auto opacity-70", className)}
    />
  );
}

function SectionShell({
  id,
  children,
  className,
  innerClassName,
}: {
  id?: SectionId;
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
}) {
  return (
    <section id={id} className={cn("px-5 py-14 sm:px-8 sm:py-20", className)}>
      <div className={cn("mx-auto max-w-2xl", innerClassName)}>{children}</div>
    </section>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <ScrollReveal className="mb-8 text-center">
      {eyebrow ? (
        <p className="mb-2 text-[11px] font-semibold tracking-[0.28em] uppercase opacity-60">{eyebrow}</p>
      ) : null}
      <h2 className="text-2xl font-bold sm:text-3xl" style={{ fontFamily: "var(--inv-heading)" }}>
        {title}
      </h2>
    </ScrollReveal>
  );
}

/* ── Cover ───────────────────────────────────────────────── */

/** Frame foto lingkaran dengan ring emas (untuk cover style "framed"). */
function FramedPhoto({ src, alt, shape }: { src: string; alt: string; shape: "circle" | "arch" | "rounded" }) {
  const radius = shape === "circle" ? "9999px" : shape === "arch" ? "9999px 9999px 24px 24px" : "24px";
  const aspect = shape === "arch" ? "3 / 4" : "1 / 1";
  return (
    <div className="relative mx-auto mb-8 w-56 sm:w-72">
      {/* Ring luar */}
      <div
        className="absolute -inset-2 sm:-inset-3"
        style={{
          borderRadius: radius,
          border: "2px solid color-mix(in srgb, var(--inv-accent) 50%, #d4af37)",
          opacity: 0.5,
        }}
        aria-hidden
      />
      {/* Ring dalam */}
      <div
        className="absolute -inset-1 sm:-inset-1.5"
        style={{
          borderRadius: radius,
          border: "1px solid color-mix(in srgb, var(--inv-accent) 30%, #d4af37)",
          opacity: 0.7,
        }}
        aria-hidden
      />
      <div
        className="relative overflow-hidden"
        style={{ borderRadius: radius, aspectRatio: aspect }}
      >
        <Image src={src} alt={alt} fill sizes="(max-width: 640px) 224px, 288px" className="object-cover" />
      </div>
    </div>
  );
}

/** Nama cover: horizontal ("A & B") atau vertical (A / & / B). */
function CoverNames({ names, orientation }: { names: string; orientation: "horizontal" | "vertical" }) {
  if (orientation === "vertical") {
    const parts = names.split(/\s*&\s*/);
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="text-3xl leading-tight font-bold sm:text-5xl" style={{ fontFamily: "var(--inv-heading)" }}>
          {parts[0]}
        </span>
        <span className="text-lg opacity-60">&amp;</span>
        <span className="text-3xl leading-tight font-bold sm:text-5xl" style={{ fontFamily: "var(--inv-heading)" }}>
          {parts[1] ?? ""}
        </span>
      </div>
    );
  }
  return (
    <h1
      className="max-w-xl text-4xl leading-[1.15] font-bold text-balance sm:text-6xl"
      style={{ fontFamily: "var(--inv-heading)" }}
    >
      {names}
    </h1>
  );
}

function CoverContent({ ctx, subtitle }: { ctx: SectionContext; subtitle?: string }) {
  const { config, guest, theme } = ctx;
  const coverCfg = config.cover;
  const names = config.event.couple
    ? `${config.event.couple.brideName} & ${config.event.couple.groomName}`
    : (config.event.celebrant?.name ?? config.event.host?.name ?? config.event.title ?? "Undangan");
  const orn = decorationSrc(theme.decorations);
  const spacing = coverCfg?.spacing ?? 0;
  const spacingPx = spacing > 0 ? `${spacing * 2}px` : undefined;

  // Nama orang yang diundang (bisa pakai nama dari cover, atau default)
  const guestName = guest?.name ?? "";

  return (
    <div
      className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-6 text-center"
      style={{
        color: coverCfg?.style === "framed" || coverCfg?.style === "minimal" ? "var(--inv-text)" : "#fff",
        paddingTop: spacingPx,
        paddingBottom: spacingPx,
      }}
    >
      {orn ? (
        <Image
          src={orn}
          alt=""
          aria-hidden
          width={120}
          height={40}
          unoptimized
          className={cn(
            "mx-auto mb-6 h-7 w-auto",
            coverCfg?.style === "photo_overlay" ? "opacity-85 [filter:brightness(0)_invert(1)]" : "opacity-70",
          )}
        />
      ) : null}

      {/* Eyebrow / judul acara */}
      <p
        className={cn(
          "text-[11px] font-semibold tracking-[0.32em] uppercase",
          coverCfg?.style === "photo_overlay" ? "opacity-85" : "opacity-55",
        )}
      >
        {subtitle}
      </p>

      {/* Divider */}
      <div className="mx-auto my-6 flex items-center justify-center gap-3" aria-hidden>
        <span className={cn("h-px w-12", coverCfg?.style === "photo_overlay" ? "bg-white/50" : "bg-current opacity-25")} />
        <span className={cn("text-xs leading-none", coverCfg?.style === "photo_overlay" ? "opacity-80" : "opacity-40")}>✦</span>
        <span className={cn("h-px w-12", coverCfg?.style === "photo_overlay" ? "bg-white/50" : "bg-current opacity-25")} />
      </div>

      {/* Foto berbingkai (style "framed") */}
      {coverCfg?.style === "framed" && (config.seo.coverImage ?? config.event.photo) ? (
        <FramedPhoto
          src={config.seo.coverImage ?? config.event.photo!}
          alt={config.seo.title ?? "Foto sampul"}
          shape={coverCfg.frameShape ?? "circle"}
        />
      ) : null}

      {/* Nama */}
      <CoverNames names={names} orientation={coverCfg?.nameOrientation ?? "horizontal"} />

      {/* Tanggal */}
      <p
        className={cn(
          "mt-5 text-sm tracking-wide sm:text-base",
          coverCfg?.style === "photo_overlay" ? "text-white/85" : "opacity-70",
        )}
      >
        {fmtDate(config.event.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
      </p>

      {/* Kalimat pembuka (opsional) */}
      {coverCfg?.openingText ? (
        <p
          className={cn(
            "mt-6 max-w-md text-[13px] leading-relaxed sm:text-sm",
            coverCfg.style === "photo_overlay" ? "text-white/75" : "opacity-60",
          )}
        >
          {coverCfg.openingText}
        </p>
      ) : null}

      {/* Kartu nama tamu */}
      {guestName ? (
        <div
          className={cn(
            "mt-8 rounded-2xl border px-6 py-4 backdrop-blur",
            coverCfg?.style === "photo_overlay"
              ? "border-white/30 bg-white/10 text-white"
              : "border-current/15 bg-black/[0.04]",
          )}
        >
          <p className={cn("text-[10px] font-semibold tracking-[0.2em] uppercase", coverCfg?.style === "photo_overlay" ? "text-white/60" : "opacity-45")}>
            {coverCfg?.guestPreText || "Kepada Yth."}
          </p>
          <p className="mt-1.5 text-base font-bold sm:text-lg">{guestName}</p>
          {coverCfg?.guestPostText ? (
            <p className={cn("mt-1 text-[11px]", coverCfg.style === "photo_overlay" ? "text-white/60" : "opacity-45")}>
              {coverCfg.guestPostText}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-12">
        <ScrollCue />
      </div>
    </div>
  );
}

function Cover({ ctx }: { ctx: SectionContext }) {
  const { config, theme } = ctx;
  const cover = config.seo.coverImage ?? config.event.photo;
  const style = config.cover?.style ?? "photo_overlay";

  // ── Style "framed" & "minimal": background solid dari palette ──
  if (style === "framed" || style === "minimal") {
    const bgGradient =
      theme.palette.bg === "#0F172A" || theme.palette.bg === "#0B1220"
        ? `linear-gradient(160deg, ${theme.palette.bg}, color-mix(in srgb, ${theme.palette.accent} 18%, ${theme.palette.bg}))`
        : `linear-gradient(160deg, color-mix(in srgb, ${theme.palette.bg} 92%, #000), color-mix(in srgb, ${theme.palette.bg} 80%, ${theme.palette.accent} 8%))`;
    return (
      <header id="cover" className="relative min-h-dvh overflow-hidden" style={{ background: bgGradient }}>
        <CoverContent ctx={ctx} subtitle={config.event.title ?? DEFAULT_EYEBROWS[config.event.type]} />
      </header>
    );
  }

  // ── Style "photo_overlay" (default lama): foto full-bleed + overlay gelap ──
  return (
    <header id="cover" className="relative min-h-dvh overflow-hidden">
      {cover ? (
        <Image
          src={cover}
          alt={config.seo.title ?? "Foto sampul undangan"}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--inv-accent)] to-[var(--inv-accent-soft)]" />
      )}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.68), rgba(0,0,0,0.34), color-mix(in srgb, var(--inv-accent) 40%, rgba(0,0,0,0.72)))",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-3 border border-white/20 sm:inset-5"
      />
      <CoverContent ctx={ctx} subtitle={config.event.title ?? DEFAULT_EYEBROWS[config.event.type]} />
    </header>
  );
}

/* ── Couple / host ───────────────────────────────────────── */

function Couple({ ctx }: { ctx: SectionContext }) {
  const { config, theme } = ctx;
  const couple = config.event.couple;

  if (couple) {
    return (
      <SectionShell id="couple" className="relative">
        <ScrollReveal className="text-center">
          <p className="text-[11px] font-semibold tracking-[0.3em] uppercase opacity-60">
            Assalamu&apos;alaikum Warahmatullahi Wabarakatuh
          </p>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed opacity-75">
            Dengan memohon rahmat dan ridho Allah SWT, kami bermaksud menyelenggarakan pernikahan putra-putri kami:
          </p>
          <Ornament kind={theme.decorations} className="my-7" />
          <div className="grid gap-8 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <div>
              {couple.bridePhoto ? (
                <div
                  className="mx-auto mb-4 w-fit overflow-hidden border-2"
                  style={{ borderRadius: "var(--inv-radius)", borderColor: "var(--inv-accent)" }}
                >
                  <Image
                    src={couple.bridePhoto}
                    alt={couple.brideName}
                    width={200}
                    height={260}
                    className="h-[260px] w-[200px] object-cover"
                  />
                </div>
              ) : null}
              <h3 className="text-3xl font-bold" style={{ fontFamily: "var(--inv-heading)" }}>
                {couple.brideName}
              </h3>
              {couple.brideParents ? (
                <p className="mt-2 text-sm leading-relaxed opacity-70">{couple.brideParents}</p>
              ) : null}
            </div>
            <div className="mx-auto flex size-14 items-center justify-center rounded-full" style={{ background: "var(--inv-accent-soft)" }}>
              <Heart className="size-6" style={{ color: "var(--inv-accent)" }} aria-hidden />
            </div>
            <div>
              {couple.groomPhoto ? (
                <div
                  className="mx-auto mb-4 w-fit overflow-hidden border-2"
                  style={{ borderRadius: "var(--inv-radius)", borderColor: "var(--inv-accent)" }}
                >
                  <Image
                    src={couple.groomPhoto}
                    alt={couple.groomName}
                    width={200}
                    height={260}
                    className="h-[260px] w-[200px] object-cover"
                  />
                </div>
              ) : null}
              <h3 className="text-3xl font-bold" style={{ fontFamily: "var(--inv-heading)" }}>
                {couple.groomName}
              </h3>
              {couple.groomParents ? (
                <p className="mt-2 text-sm leading-relaxed opacity-70">{couple.groomParents}</p>
              ) : null}
            </div>
          </div>
          {couple.hashtag ? (
            <p className="mt-8 text-sm font-semibold" style={{ color: "var(--inv-accent)" }}>
              {couple.hashtag}
            </p>
          ) : null}
        </ScrollReveal>
      </SectionShell>
    );
  }

  const host = config.event.host;
  const celebrant = config.event.celebrant;
  if (!host && !celebrant) return null;

  return (
    <SectionShell id="couple">
      <ScrollReveal className="text-center">
        <Sparkles className="mx-auto size-6" style={{ color: "var(--inv-accent)" }} aria-hidden />
        <h3 className="mt-4 text-3xl font-bold" style={{ fontFamily: "var(--inv-heading)" }}>
          {celebrant?.name ?? host?.name}
        </h3>
        <p className="mt-2 text-sm opacity-70">
          {host?.role ?? (celebrant?.age ? `Ke-{celebrant.age} tahun` : "")}
        </p>
      </ScrollReveal>
    </SectionShell>
  );
}

/* ── Event info ──────────────────────────────────────────── */

function EventInfo({ ctx }: { ctx: SectionContext }) {
  const { config } = ctx;
  const date = new Date(config.event.date);
  const lb = sectionLabel("event_info", ctx.labels, ctx.userLabels);

  return (
    <SectionShell id="event_info" className="relative">
      <SectionHeading eyebrow={lb.eyebrow} title={lb.title} />
      <ScrollReveal>
        <div
          className="overflow-hidden rounded-[var(--inv-radius)] border text-center"
          style={{ borderColor: "var(--inv-accent)", background: "var(--inv-surface)" }}
        >
          <div className="px-6 py-8" style={{ background: "var(--inv-accent-soft)" }}>
            <p className="text-xs font-semibold tracking-[0.24em] uppercase opacity-70">
              {date.toLocaleDateString("id-ID", { weekday: "long" })}
            </p>
            <p className="mt-2 text-5xl font-bold tabular-nums" style={{ fontFamily: "var(--inv-heading)" }}>
              {date.getDate()}
            </p>
            <p className="text-sm font-semibold tracking-widest uppercase opacity-75">
              {date.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="space-y-3 px-6 py-6 text-sm">
            <p className="flex items-center justify-center gap-2">
              <Clock className="size-4 shrink-0" style={{ color: "var(--inv-accent)" }} aria-hidden />
              {fmtTime(config.event.date)} WIB
            </p>
            {config.event.schedules[0] ? (
              <p className="flex items-start justify-center gap-2 text-left">
                <MapPin className="mt-0.5 size-4 shrink-0" style={{ color: "var(--inv-accent)" }} aria-hidden />
                <span>
                  {config.event.schedules[0].venue}
                  {config.event.schedules[0].address ? (
                    <span className="block text-xs opacity-65">{config.event.schedules[0].address}</span>
                  ) : null}
                </span>
              </p>
            ) : null}
          </div>
        </div>
      </ScrollReveal>
    </SectionShell>
  );
}

/* ── Countdown ───────────────────────────────────────────── */

function CountdownSection({ ctx }: { ctx: SectionContext }) {
  return (
    <SectionShell id="countdown" className="py-10 sm:py-14">
      <ScrollReveal>
        <Countdown target={ctx.config.event.date} label="Menuju hari bahagia" />
      </ScrollReveal>
    </SectionShell>
  );
}

/* ── Schedule & maps ─────────────────────────────────────── */

function ScheduleMaps({ ctx }: { ctx: SectionContext }) {
  const { config, theme } = ctx;
  const schedules = config.event.schedules;
  if (schedules.length === 0) return null;
  const lb = sectionLabel("schedule_maps", ctx.labels, ctx.userLabels);

  return (
    <SectionShell id="schedule_maps">
      <SectionHeading eyebrow={lb.eyebrow} title={lb.title} />
      <div className="space-y-4">
        {schedules.map((schedule, index) => (
          <ScrollReveal key={`${schedule.title}-${index}`}>
            <div
              className="rounded-[var(--inv-radius)] border p-5 sm:p-6"
              style={{ borderColor: "var(--inv-accent)", background: "var(--inv-surface)" }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-bold" style={{ fontFamily: "var(--inv-heading)" }}>
                    {schedule.title}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm opacity-75">
                    <CalendarDays className="size-4" style={{ color: "var(--inv-accent)" }} aria-hidden />
                    {fmtDate(schedule.start, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm opacity-75">
                    <Clock className="size-4" style={{ color: "var(--inv-accent)" }} aria-hidden />
                    {fmtTime(schedule.start)}
                    {schedule.end ? ` – ${fmtTime(schedule.end)}` : ""} WIB
                  </p>
                </div>
                <span
                  className="rounded-full px-3 py-1 text-[10px] font-bold tracking-widest uppercase"
                  style={{ background: "var(--inv-accent-soft)", color: "var(--inv-accent)" }}
                >
                  {index === 0 ? "Utama" : `Acara ${index + 1}`}
                </span>
              </div>
              <div className="mt-4 border-t pt-4 text-sm" style={{ borderColor: "var(--inv-accent-soft)" }}>
                <p className="font-semibold">{schedule.venue}</p>
                {schedule.address ? <p className="mt-0.5 opacity-70">{schedule.address}</p> : null}
                {schedule.lat != null && schedule.lng != null ? (
                  <div
                    className="mt-3 overflow-hidden rounded-[var(--inv-radius)] border"
                    style={{ borderColor: "var(--inv-accent-soft)" }}
                  >
                    <iframe
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${schedule.lng - 0.005}%2C${schedule.lat - 0.003}%2C${schedule.lng + 0.005}%2C${schedule.lat + 0.003}&layer=mapnik&marker=${schedule.lat}%2C${schedule.lng}`}
                      className="h-64 w-full sm:h-80"
                      loading="lazy"
                      title={`Peta ${schedule.venue}`}
                    />
                  </div>
                ) : null}
                {schedule.mapUrl ? (
                  <a
                    href={schedule.mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-bold text-white"
                    style={{ background: "var(--inv-accent)" }}
                  >
                    <MapPin className="size-3.5" aria-hidden />
                    Buka Google Maps
                  </a>
                ) : null}
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
      <Ornament kind={theme.decorations} className="mt-8" />
    </SectionShell>
  );
}

/* ── Story ───────────────────────────────────────────────── */

function Story({ ctx }: { ctx: SectionContext }) {
  const { config, theme } = ctx;
  if (config.story.length === 0) return null;
  const lb = sectionLabel("story", ctx.labels, ctx.userLabels);

  return (
    <SectionShell id="story">
      <SectionHeading eyebrow={lb.eyebrow} title={lb.title} />
      <ol className="relative space-y-8 border-l-2 pl-6" style={{ borderColor: "var(--inv-accent-soft)" }}>
        {config.story.map((item, index) => (
          <ScrollReveal key={`${item.title}-${index}`} className="relative">
            <span
              className="absolute top-1.5 -left-[31px] size-3 rounded-full border-2 border-white"
              style={{ background: "var(--inv-accent)" }}
              aria-hidden
            />
            {item.year ? (
              <p className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: "var(--inv-accent)" }}>
                {item.year}
              </p>
            ) : null}
            <h3 className="mt-1 text-lg font-bold" style={{ fontFamily: "var(--inv-heading)" }}>
              {item.title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed opacity-75">{item.text}</p>
            {item.image ? (
              <Image
                src={item.image}
                alt={item.title}
                width={800}
                height={440}
                loading="lazy"
                className="mt-3 h-44 w-full rounded-[var(--inv-radius)] object-cover"
              />
            ) : null}
          </ScrollReveal>
        ))}
      </ol>
      <Ornament kind={theme.decorations} className="mt-8" />
    </SectionShell>
  );
}

/* ── Gallery ─────────────────────────────────────────────── */

function Gallery({ ctx }: { ctx: SectionContext }) {
  const { config } = ctx;
  if (config.gallery.length === 0) return null;
  const lb = sectionLabel("gallery", ctx.labels, ctx.userLabels);

  return (
    <SectionShell id="gallery">
      <SectionHeading eyebrow={lb.eyebrow} title={lb.title} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {config.gallery.map((item, index) => (
          <ScrollReveal
            key={`${item.image}-${index}`}
            className={cn("col-span-2 sm:col-span-1", index % 3 === 0 && "sm:col-span-2")}
          >
            <figure className="relative overflow-hidden rounded-[var(--inv-radius)]">
              <Image
                src={item.image}
                alt={item.caption ?? `Galeri ${index + 1}`}
                width={900}
                height={600}
                loading="lazy"
                className="h-52 w-full object-cover transition-transform duration-500 hover:scale-105"
              />
              {item.caption ? (
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 text-xs text-white opacity-0 transition-opacity hover:opacity-100">
                  {item.caption}
                </figcaption>
              ) : null}
            </figure>
          </ScrollReveal>
        ))}
      </div>
    </SectionShell>
  );
}

/* ── Gift ────────────────────────────────────────────────── */

function GiftSection({ ctx }: { ctx: SectionContext }) {
  const { config } = ctx;
  if (!config.gift.enabled || config.gift.accounts.length === 0) return null;
  const lb = sectionLabel("gift", ctx.labels, ctx.userLabels);

  return (
    <SectionShell id="gift">
      <SectionHeading eyebrow={lb.eyebrow} title={lb.title} />
      <ScrollReveal>
        <div
          className="rounded-[var(--inv-radius)] border p-5 text-center sm:p-6"
          style={{ borderColor: "var(--inv-accent)", background: "var(--inv-surface)" }}
        >
          <Gift className="mx-auto size-5" style={{ color: "var(--inv-accent)" }} aria-hidden />
          <p className="mx-auto mt-3 max-w-md text-xs leading-relaxed opacity-70">
            {config.gift.instructions ??
              "Doa restu Anda adalah hadiah terindah. Jika ingin memberi tanda kasih, dapat ditransfer ke:"}
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {config.gift.accounts.map((account) => (
              <div
                key={`${account.bank}-${account.number}`}
                className="rounded-[var(--inv-radius)] p-4 text-left"
                style={{ background: "var(--inv-accent-soft)" }}
              >
                <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--inv-accent)" }}>
                  {account.bank}
                </p>
                <p className="mt-1 font-mono text-base font-bold">{account.number}</p>
                <p className="text-xs opacity-70">a.n. {account.holder}</p>
                <CopyButton
                  value={account.number}
                  className="mt-3"
                />
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>
    </SectionShell>
  );
}

/* ── RSVP / guestbook / qr: aktif hanya dengan konteks tamu ─ */

function GuestGate({ ctx, children, hint }: { ctx: SectionContext; children: React.ReactNode; hint: string }) {
  if (!ctx.guest) {
    return (
      <SectionShell>
        <div
          className="rounded-[var(--inv-radius)] border border-dashed p-6 text-center text-xs opacity-70"
          style={{ borderColor: "var(--inv-accent)" }}
        >
          {hint}
        </div>
      </SectionShell>
    );
  }
  return <>{children}</>;
}

function RSVP({ ctx }: { ctx: SectionContext }) {
  const lb = sectionLabel("rsvp", ctx.labels, ctx.userLabels);
  return (
    <SectionShell id="rsvp">
      <SectionHeading eyebrow={lb.eyebrow} title={lb.title} />
      <GuestGate ctx={ctx} hint="Isi RSVP tersedia jika Anda membuka undangan melalui tautan personal.">
        {ctx.guest ? (
          <RsvpForm slug={ctx.slug} guest={ctx.guest} mode={ctx.mode ?? "live"} />
        ) : null}
      </GuestGate>
    </SectionShell>
  );
}

function Guestbook({ ctx }: { ctx: SectionContext }) {
  const lb = sectionLabel("guestbook", ctx.labels, ctx.userLabels);
  return (
    <SectionShell id="guestbook">
      <SectionHeading eyebrow={lb.eyebrow} title={lb.title} />
      <GuestGate ctx={ctx} hint="Kolom ucapan terbuka melalui tautan personal Anda.">
        {ctx.guest ? (
          <GuestbookForm slug={ctx.slug} guest={ctx.guest} mode={ctx.mode ?? "live"} />
        ) : null}
      </GuestGate>
    </SectionShell>
  );
}

function QrPass({ ctx }: { ctx: SectionContext }) {
  const lb = sectionLabel("qr_pass", ctx.labels, ctx.userLabels);
  return (
    <GuestGate ctx={ctx} hint="Kartu QR tamu tersedia melalui tautan personal Anda.">
      <SectionShell id="qr_pass">
        <SectionHeading eyebrow={lb.eyebrow} title={lb.title} />
        {ctx.guest ? <GuestQrCard guest={ctx.guest} /> : null}
      </SectionShell>
    </GuestGate>
  );
}

/* ── Wishes list ─────────────────────────────────────────── */

function WishesList({ ctx }: { ctx: SectionContext }) {
  const wishes = ctx.wishes ?? [];
  if (wishes.length === 0) return null;
  const lb = sectionLabel("wishes_list", ctx.labels);

  return (
    <SectionShell id="wishes_list">
      <SectionHeading eyebrow={lb.eyebrow} title={lb.title} />
      <div className="space-y-3">
        {wishes.map((wish) => (
          <ScrollReveal key={wish.id}>
            <div
              className="rounded-[var(--inv-radius)] border p-4"
              style={{ borderColor: "var(--inv-accent-soft)", background: "var(--inv-surface)" }}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold">{wish.name}</p>
                <p className="text-[11px] opacity-60">{wish.createdAt}</p>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed opacity-80">{wish.message}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </SectionShell>
  );
}

/* ── Doa ─────────────────────────────────────────────────── */

function Doa({ ctx }: { ctx: SectionContext }) {
  const text = ctx.config.doa.text;
  if (!text) return null;
  const lb = sectionLabel("doa", ctx.labels, ctx.userLabels);
  return (
    <SectionShell id="doa" className="text-center">
      <SectionHeading eyebrow={lb.eyebrow} title={lb.title} />
      <ScrollReveal>
        <p className="mx-auto max-w-lg text-sm leading-loose opacity-80 italic" style={{ fontFamily: "var(--inv-body)" }}>
          {text}
        </p>
      </ScrollReveal>
    </SectionShell>
  );
}

/* ── Info ────────────────────────────────────────────────── */

function Info({ ctx }: { ctx: SectionContext }) {
  const items = ctx.config.info.items;
  if (items.length === 0) return null;
  const lb = sectionLabel("info", ctx.labels, ctx.userLabels);
  return (
    <SectionShell id="info">
      <SectionHeading eyebrow={lb.eyebrow} title={lb.title} />
      <div className="space-y-3">
        {items.map((item, i) => (
          <ScrollReveal key={i}>
            <div
              className="flex items-start gap-3 rounded-[var(--inv-radius)] border p-4"
              style={{ borderColor: "var(--inv-accent-soft)", background: "var(--inv-surface)" }}
            >
              <div className="mt-0.5 shrink-0">
                <Sparkles className="size-4" style={{ color: "var(--inv-accent)" }} aria-hidden />
              </div>
              <div>
                <p className="text-sm font-bold">{item.title}</p>
                <p className="mt-0.5 text-sm leading-relaxed opacity-80">{item.text}</p>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </SectionShell>
  );
}

/* ── Kado ────────────────────────────────────────────────── */

function Kado({ ctx }: { ctx: SectionContext }) {
  const kado = ctx.config.kado;
  if (!kado.address && !kado.recipient) return null;
  const lb = sectionLabel("kado", ctx.labels, ctx.userLabels);
  return (
    <SectionShell id="kado">
      <SectionHeading eyebrow={lb.eyebrow} title={lb.title} />
      <ScrollReveal>
        <div
          className="rounded-[var(--inv-radius)] border p-5 text-center"
          style={{ borderColor: "var(--inv-accent-soft)", background: "var(--inv-surface)" }}
        >
          <Gift className="mx-auto size-6" style={{ color: "var(--inv-accent)" }} aria-hidden />
          {kado.recipient ? <p className="mt-3 text-sm font-bold">Kepada: {kado.recipient}</p> : null}
          {kado.address ? <p className="mt-1 text-sm leading-relaxed opacity-80">{kado.address}</p> : null}
          {kado.notes ? <p className="mt-2 text-xs opacity-60">{kado.notes}</p> : null}
        </div>
      </ScrollReveal>
    </SectionShell>
  );
}

/* ── Video ───────────────────────────────────────────────── */

function toYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m?.[1] ?? null;
}

function Video({ ctx }: { ctx: SectionContext }) {
  const video = ctx.config.video;
  if (!video.url) return null;
  const ytId = toYouTubeId(video.url);
  const lb = sectionLabel("video", ctx.labels, ctx.userLabels);
  return (
    <SectionShell id="video">
      <SectionHeading eyebrow={lb.eyebrow} title={video.title || lb.title} />
      <ScrollReveal>
        <div className="overflow-hidden rounded-[var(--inv-radius)] border" style={{ borderColor: "var(--inv-accent-soft)" }}>
          {ytId ? (
            <div className="relative aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${ytId}`}
                title={video.title || "Video"}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <video src={video.url} controls className="w-full" />
          )}
        </div>
      </ScrollReveal>
    </SectionShell>
  );
}

/* ── Live ────────────────────────────────────────────────── */

function Live({ ctx }: { ctx: SectionContext }) {
  const live = ctx.config.live;
  if (!live.url) return null;
  const lb = sectionLabel("live", ctx.labels, ctx.userLabels);
  const ytId = toYouTubeId(live.url);
  return (
    <SectionShell id="live">
      <SectionHeading eyebrow={lb.eyebrow} title={live.title || lb.title} />
      <ScrollReveal>
        <div className="overflow-hidden rounded-[var(--inv-radius)] border" style={{ borderColor: "var(--inv-accent-soft)" }}>
          {ytId ? (
            <div className="relative aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${ytId}`}
                title={live.title || "Live"}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="flex aspect-video items-center justify-center" style={{ background: "var(--inv-accent-soft)" }}>
              <a href={live.url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold underline" style={{ color: "var(--inv-accent)" }}>
                Buka siaran langsung
              </a>
            </div>
          )}
        </div>
      </ScrollReveal>
    </SectionShell>
  );
}

/* ── Prokes ──────────────────────────────────────────────── */

function Prokes({ ctx }: { ctx: SectionContext }) {
  const items = ctx.config.prokes.items;
  if (items.length === 0) return null;
  const lb = sectionLabel("prokes", ctx.labels, ctx.userLabels);
  return (
    <SectionShell id="prokes">
      <SectionHeading eyebrow={lb.eyebrow} title={lb.title} />
      <div className="space-y-2">
        {items.map((item, i) => (
          <ScrollReveal key={i}>
            <div className="flex items-start gap-3 text-sm">
              <span className="mt-1 size-1.5 shrink-0 rounded-full" style={{ background: "var(--inv-accent)" }} aria-hidden />
              <p className="leading-relaxed opacity-80">{item}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </SectionShell>
  );
}

/* ── Adab ────────────────────────────────────────────────── */

function Adab({ ctx }: { ctx: SectionContext }) {
  const items = ctx.config.adab.items;
  if (items.length === 0) return null;
  const lb = sectionLabel("adab", ctx.labels, ctx.userLabels);
  return (
    <SectionShell id="adab">
      <SectionHeading eyebrow={lb.eyebrow} title={lb.title} />
      <div className="space-y-2">
        {items.map((item, i) => (
          <ScrollReveal key={i}>
            <div className="flex items-start gap-3 text-sm">
              <span className="mt-1 size-1.5 shrink-0 rounded-full" style={{ background: "var(--inv-accent)" }} aria-hidden />
              <p className="leading-relaxed opacity-80">{item}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </SectionShell>
  );
}

/* ── Closing ─────────────────────────────────────────────── */

function Closing({ ctx }: { ctx: SectionContext }) {
  const { config, theme } = ctx;
  const names = config.event.couple
    ? `${config.event.couple.brideName} & ${config.event.couple.groomName}`
    : (config.event.celebrant?.name ?? config.event.host?.name ?? config.event.title ?? "");

  return (
    <footer id="closing" className="relative overflow-hidden px-6 py-16 text-center sm:py-20" style={{ background: "var(--inv-accent-soft)" }}>
      <ScrollReveal>
        <Quote className="mx-auto size-6" style={{ color: "var(--inv-accent)" }} aria-hidden />
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed opacity-80">
          Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Anda berkenan hadir untuk memberikan doa restu.
        </p>
        <p className="mt-6 text-2xl font-bold sm:text-3xl" style={{ fontFamily: "var(--inv-heading)" }}>
          {names}
        </p>
        <Ornament kind={theme.decorations} className="mt-6" />
        <p className="mt-8 text-[11px] tracking-[0.2em] uppercase opacity-60">
          Dibuat dengan UndanganE
        </p>
      </ScrollReveal>
    </footer>
  );
}

/* ── Registry ────────────────────────────────────────────── */

const SECTION_COMPONENTS: Record<SectionId, (({ ctx }: { ctx: SectionContext }) => React.ReactNode) | null> = {
  cover: Cover,
  couple: Couple,
  doa: Doa,
  event_info: EventInfo,
  countdown: CountdownSection,
  schedule_maps: ScheduleMaps,
  info: Info,
  story: Story,
  gallery: Gallery,
  gift: GiftSection,
  kado: Kado,
  video: Video,
  live: Live,
  rsvp: RSVP,
  guestbook: Guestbook,
  qr_pass: QrPass,
  wishes_list: WishesList,
  prokes: Prokes,
  adab: Adab,
  closing: Closing,
  music_player: null,
};

export function renderSection(id: SectionId, ctx: SectionContext): React.ReactNode {
  const Component = SECTION_COMPONENTS[id];
  if (!Component) return null;
  return <Component ctx={ctx} />;
}

export { Cover };
