import { cn } from "@/lib/utils";
import { themeStyle } from "./theme";
import {
  DEFAULT_EYEBROWS,
  type GuestContext,
  type InvitationConfig,
  type SectionId,
  type SectionLabels,
  type ThemeTokens,
  type WishItem,
} from "./types";
import { renderSection, type SectionContext } from "./sections";
import { InvitationChrome } from "./sections/interactive";
import { DecorationLayer } from "./sections/particles";

export interface RendererProps {
  config: InvitationConfig;
  theme: ThemeTokens;
  layout: "full_bleed" | "curtain" | "frame_device" | "slider" | "paper";
  sections: Partial<Record<SectionId, boolean>>;
  guest?: GuestContext | null;
  wishes?: WishItem[];
  mode?: "live" | "preview";
  /** Label judul section override (dari DB template). */
  labels?: SectionLabels | null;
  /** Slug undangan (untuk form interaktif RSVP & buku tamu). */
  slug?: string;
}

/** Urutan baku section dalam undangan (docs/06). */
export const SECTION_ORDER: SectionId[] = [
  "couple",
  "doa",
  "event_info",
  "countdown",
  "schedule_maps",
  "info",
  "story",
  "gallery",
  "gift",
  "kado",
  "video",
  "live",
  "rsvp",
  "guestbook",
  "wishes_list",
  "prokes",
  "adab",
  "qr_pass",
  "closing",
];

/** Label navigasi per section (dipakai menu mengambang). */
export const SECTION_LABELS: Record<SectionId, string> = {
  cover: "Sampul",
  couple: "Mempelai",
  doa: "Doa",
  event_info: "Waktu & Tempat",
  countdown: "Hitung Mundur",
  schedule_maps: "Jadwal Acara",
  info: "Info",
  story: "Kisah Kami",
  gallery: "Galeri",
  gift: "Hadiah",
  kado: "Kado",
  video: "Video",
  live: "Live",
  rsvp: "RSVP",
  guestbook: "Buku Tamu",
  qr_pass: "Kartu QR",
  wishes_list: "Ucapan",
  prokes: "Prokes",
  adab: "Adab",
  closing: "Penutup",
  music_player: "Musik",
};

function FramePattern() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 opacity-[0.14]"
      style={{
        backgroundImage:
          "linear-gradient(45deg, var(--inv-accent) 25%, transparent 25%), linear-gradient(-45deg, var(--inv-accent) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--inv-accent) 75%), linear-gradient(-45deg, transparent 75%, var(--inv-accent) 75%)",
        backgroundSize: "28px 28px",
        backgroundPosition: "0 0, 0 14px, 14px -14px, -14px 0",
      }}
    />
  );
}

export function InvitationRenderer({
  config,
  theme,
  layout,
  sections,
  guest,
  wishes,
  mode = "live",
  labels,
  slug,
}: RendererProps) {
  const userLabels = config.sectionLabels ?? null;
  const ctx: SectionContext = { config, theme, guest, wishes, mode, labels, userLabels, slug };
  const visible = (id: SectionId) => sections[id] !== false;

  // Urutan: config.sectionOrder → SECTION_ORDER bawaan.
  const order = (config.sectionOrder?.length ? config.sectionOrder : SECTION_ORDER) as SectionId[];

  const cover = visible("cover") ? renderSection("cover", ctx) : null;
  const body = (
    <>
      {order.filter(visible).map((id) => (
        <div key={id}>{renderSection(id, ctx)}</div>
      ))}
    </>
  );

  const couple = config.event.couple;
  const chromeNames = couple
    ? `${couple.brideName} & ${couple.groomName}`
    : (config.event.celebrant?.name ?? config.event.host?.name ?? config.event.title ?? undefined);

  const navLabel = (id: SectionId) => {
    const u = userLabels?.[id]?.title;
    return u || SECTION_LABELS[id];
  };
  const menuItems = [
    ...(visible("cover") ? [{ id: "cover", label: SECTION_LABELS.cover }] : []),
    ...order.filter(visible).map((id) => ({ id, label: navLabel(id) })),
  ];

  const chrome = (
    <InvitationChrome
      mode={mode}
      cover={config.seo.coverImage ?? config.event.photo}
      eyebrow={config.event.title ?? DEFAULT_EYEBROWS[config.event.type]}
      names={chromeNames}
      dateLabel={new Date(config.event.date).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })}
      greeting={guest?.name ?? (couple ? "Bapak/Ibu/Saudara/i" : undefined)}
      musicTrack={visible("music_player") && config.music.enabled ? config.music.track : undefined}
      musicTitle={config.seo.title}
      autoplayMusic={config.music.autoplayAfterOpen}
      menuItems={menuItems}
    />
  );

  if (layout === "frame_device") {
    return (
      <div className="relative min-h-dvh overflow-hidden" style={themeStyle(theme)}>
        <FramePattern />
        <DecorationLayer theme={theme} />
        <div className="flex min-h-dvh items-start justify-center px-3 py-4 sm:px-6 sm:py-8">
          <div className="w-full max-w-[430px] overflow-hidden rounded-[28px] border-[6px] border-[#111] bg-[var(--inv-bg)] shadow-2xl">
            <div className="relative mx-auto h-6 overflow-hidden bg-[#111]">
              <span className="absolute top-1/2 left-1/2 h-2 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/70" />
            </div>
            <div className="relative">
              {cover}
              {body}
            </div>
          </div>
        </div>
        {chrome}
      </div>
    );
  }

  // ── Paper layout: background gelap + kartu kertas terpusat ──
  if (layout === "paper") {
    return (
      <div className="relative min-h-dvh overflow-hidden" style={themeStyle(theme)}>
        <DecorationLayer theme={theme} />
        <div className="flex min-h-dvh justify-center px-2 py-3 sm:px-4 sm:py-6">
          <div
            className="relative w-full max-w-[520px] overflow-hidden"
            style={{
              background: "var(--inv-surface)",
              borderRadius: "var(--inv-radius)",
              boxShadow:
                "0 25px 60px rgba(0,0,0,0.35), 0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
          >
            {/* Garis tepi kertas (subtle) */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-20"
              style={{
                border: "1px solid color-mix(in srgb, var(--inv-accent) 18%, transparent)",
                borderRadius: "var(--inv-radius)",
                margin: "8px",
                width: "calc(100% - 16px)",
                height: "calc(100% - 16px)",
              }}
            />
            <div className="relative">
              {cover}
              {body}
            </div>
          </div>
        </div>
        {chrome}
      </div>
    );
  }

  return (
    <div className={cn("relative min-h-dvh overflow-x-hidden")} style={themeStyle(theme)}>
      <DecorationLayer theme={theme} />
      {cover}
      {body}
      {chrome}
    </div>
  );
}
