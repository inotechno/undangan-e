import { z } from "zod";

export const SECTION_IDS = [
  "cover",
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
  "qr_pass",
  "wishes_list",
  "prokes",
  "adab",
  "closing",
  "music_player",
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

/* ── Label judul section (editable admin) ─────────────────── */

export interface SectionLabel {
  eyebrow?: string;
  title?: string;
}

export type SectionLabels = Partial<Record<SectionId, SectionLabel>>;

/** Judul bawaan tiap section — dipakai bila user/admin belum mengatur label. */
export const SECTION_DEFAULT_LABELS: SectionLabels = {
  doa: { eyebrow: "Bismillah", title: "Doa Pembuka" },
  event_info: { eyebrow: "Save the Date", title: "Waktu & Tempat" },
  schedule_maps: { eyebrow: "Rangkaian Acara", title: "Jadwal & Lokasi" },
  info: { eyebrow: "Informasi", title: "Info Tambahan" },
  story: { eyebrow: "Kisah Kami", title: "Perjalanan Cinta" },
  gallery: { eyebrow: "Momen Bahagia", title: "Galeri" },
  gift: { eyebrow: "Tanda Kasih", title: "Wedding Gift" },
  kado: { eyebrow: "Kado", title: "Kirim Kado" },
  video: { eyebrow: "Video", title: "Video Kami" },
  live: { eyebrow: "Live Streaming", title: "Siaran Langsung" },
  rsvp: { eyebrow: "Konfirmasi Kehadiran", title: "RSVP" },
  guestbook: { eyebrow: "Ucapan", title: "Buku Tamu" },
  qr_pass: { eyebrow: "Tiket Masuk", title: "Kartu QR Tamu" },
  wishes_list: { eyebrow: "Doa & Harapan", title: "Ucapan Tamu" },
  prokes: { eyebrow: "Protokol Kesehatan", title: "Prokes" },
  adab: { eyebrow: "Adab", title: "Adab Tamu" },
};

/** Gabungkan default → template → user (prioritas: user > template > default). */
export function sectionLabel(
  id: SectionId,
  templateLabels?: SectionLabels | null,
  userLabels?: SectionLabels | null,
): Required<SectionLabel> {
  const def = SECTION_DEFAULT_LABELS[id];
  const ov = userLabels?.[id] || templateLabels?.[id];
  return {
    eyebrow: ov?.eyebrow || def?.eyebrow || "",
    title: ov?.title || def?.title || "",
  };
}

/** Section yang judul/eyebrow-nya bisa diedit. */
export const LABELABLE_SECTIONS: SectionId[] = [
  "doa",
  "event_info",
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
  "qr_pass",
  "wishes_list",
  "prokes",
  "adab",
];

export const EVENT_TYPES = [
  "pernikahan",
  "tunangan",
  "ulang-tahun",
  "aqiqah",
  "khitanan",
  "keluarga",
  "seminar",
  "syukuran",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

/** Label pembuka cover per jenis acara (fallback bila event.title kosong). */
export const DEFAULT_EYEBROWS: Record<EventType, string> = {
  pernikahan: "The Wedding of",
  tunangan: "The Engagement of",
  "ulang-tahun": "Birthday Celebration",
  aqiqah: "Aqiqah Celebration",
  khitanan: "Khitanan Celebration",
  keluarga: "Family Celebration",
  seminar: "Seminar & Talk",
  syukuran: "Syukuran",
};

export const LAYOUT_FAMILIES = ["full_bleed", "curtain", "frame_device", "slider", "paper"] as const;
export type LayoutFamily = (typeof LAYOUT_FAMILIES)[number];

/* ── Cover config (opsional — semua punya default) ───────── */

export const COVER_STYLES = ["photo_overlay", "framed", "minimal"] as const;
export type CoverStyle = (typeof COVER_STYLES)[number];

export const COVER_FRAME_SHAPES = ["circle", "arch", "rounded"] as const;
export type CoverFrameShape = (typeof COVER_FRAME_SHAPES)[number];

export const NAME_ORIENTATIONS = ["horizontal", "vertical"] as const;
export type NameOrientation = (typeof NAME_ORIENTATIONS)[number];

export const coverConfigSchema = z
  .object({
    /** Gaya cover: photo full-bleed, foto berbingkai, atau minimal teks. */
    style: z.enum(COVER_STYLES).default("photo_overlay"),
    /** Bentuk frame foto (untuk style "framed"). */
    frameShape: z.enum(COVER_FRAME_SHAPES).default("circle"),
    /** Orientasi nama: horizontal ("A & B") atau vertical (A di atas B). */
    nameOrientation: z.enum(NAME_ORIENTATIONS).default("horizontal"),
    /** Kalimat sebelum nama tamu (default: "Kepada Yth."). */
    guestPreText: z.string().max(200).optional(),
    /** Kalimat setelah nama tamu. */
    guestPostText: z.string().max(200).optional(),
    /** Kalimat pembuka setelah nama (opsional). */
    openingText: z.string().max(500).optional(),
    /** Spacing vertikal ekstra (0–100, unit rem/10). */
    spacing: z.number().int().min(0).max(100).optional(),
    /** Teks tombol buka undangan. */
    buttonText: z.string().max(40).optional(),
  })
  .partial()
  .default({});

/* ── Theme tokens (docs/06 §2.2) ─────────────────────────── */

export const DECORATION_KINDS = ["floral", "geometric", "ornament", "none"] as const;
export const MOTION_KINDS = ["soft", "playful", "elegant"] as const;
export const PARTICLE_KINDS = [
  "petals",
  "sparkles",
  "butterflies",
  "confetti",
  "bokeh",
  "bubbles",
  "grid",
  "none",
] as const;

export interface ThemeTokens {
  palette: {
    bg: string;
    surface: string;
    text: string;
    accent: string;
    accentSoft: string;
  };
  fonts: { heading: string; body: string };
  radius: number;
  decorations: (typeof DECORATION_KINDS)[number];
  motion: (typeof MOTION_KINDS)[number];
  particles: (typeof PARTICLE_KINDS)[number];
}

export const themeTokensSchema = z.object({
  palette: z
    .object({
      bg: z.string(),
      surface: z.string(),
      text: z.string(),
      accent: z.string(),
      accentSoft: z.string(),
    })
    .partial()
    .default({}),
  fonts: z
    .object({ heading: z.string(), body: z.string() })
    .partial()
    .default({}),
  radius: z.number().int().min(0).max(32).optional(),
  decorations: z.enum(DECORATION_KINDS).optional(),
  motion: z.enum(MOTION_KINDS).optional(),
  particles: z.enum(PARTICLE_KINDS).optional(),
});

/* ── Konfigurasi undangan (docs/06 §5) ───────────────────── */

export const scheduleSchema = z.object({
  title: z.string(),
  start: z.string(),
  end: z.string().optional(),
  venue: z.string(),
  address: z.string().optional(),
  mapUrl: z.string().optional(),
  /** Koordinat hasil pencarian lokasi (opsional). */
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});

export const storyItemSchema = z.object({
  year: z.string().optional(),
  title: z.string(),
  text: z.string(),
  image: z.string().optional(),
});

export const galleryItemSchema = z.object({
  image: z.string(),
  caption: z.string().optional(),
});

export const giftAccountSchema = z.object({
  bank: z.string(),
  number: z.string(),
  holder: z.string(),
});

export const infoItemSchema = z.object({
  icon: z.string().optional(),
  title: z.string(),
  text: z.string(),
});

export const kadoConfigSchema = z
  .object({
    recipient: z.string().optional(),
    address: z.string().optional(),
    notes: z.string().optional(),
  })
  .default({});

export const videoConfigSchema = z
  .object({
    url: z.string().optional(),
    title: z.string().optional(),
  })
  .default({});

export const liveConfigSchema = z
  .object({
    url: z.string().optional(),
    title: z.string().optional(),
    platform: z.enum(["youtube", "zoom", "facebook", "other"]).default("youtube"),
  })
  .partial()
  .default({});

export const doaConfigSchema = z
  .object({
    text: z.string().max(1000).optional(),
  })
  .default({});

export const prokesConfigSchema = z
  .object({
    items: z.array(z.string().max(300)).default([]),
  })
  .default({ items: [] });

export const adabConfigSchema = z
  .object({
    items: z.array(z.string().max(300)).default([]),
  })
  .default({ items: [] });

export const invitationConfigSchema = z.object({
  seo: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      coverImage: z.string().optional(),
    })
    .default({}),
  event: z
    .object({
      type: z.enum(EVENT_TYPES).default("pernikahan"),
      title: z.string().optional(),
      date: z.string(),
      photo: z.string().optional(),
      couple: z
        .object({
          brideName: z.string(),
          groomName: z.string(),
          brideParents: z.string().optional(),
          groomParents: z.string().optional(),
          hashtag: z.string().optional(),
          /** Foto profil mempelai — hanya data; bentuk frame menyesuaikan desain template. */
          bridePhoto: z.string().optional(),
          groomPhoto: z.string().optional(),
        })
        .optional(),
      host: z.object({ name: z.string(), role: z.string().optional() }).optional(),
      celebrant: z.object({ name: z.string(), age: z.number().optional() }).optional(),
      schedules: z.array(scheduleSchema).default([]),
    }),
  story: z.array(storyItemSchema).default([]),
  gallery: z.array(galleryItemSchema).default([]),
  gift: z
    .object({
      enabled: z.boolean().default(false),
      instructions: z.string().optional(),
      accounts: z.array(giftAccountSchema).default([]),
    })
    .default({ enabled: false, accounts: [] }),
  music: z
    .object({
      enabled: z.boolean().default(false),
      track: z.string().optional(),
      autoplayAfterOpen: z.boolean().default(false),
    })
    .default({ enabled: false, autoplayAfterOpen: false }),
  sections: z.partialRecord(z.enum(SECTION_IDS), z.boolean()).default({}),
  /** Urutan section — jika kosong pakai SECTION_ORDER bawaan. */
  sectionOrder: z.array(z.enum(SECTION_IDS)).optional(),
  /** Label judul section yang diedit user (override label template). */
  sectionLabels: z.partialRecord(z.enum(SECTION_IDS), z.object({ eyebrow: z.string().optional(), title: z.string().optional() })).default({}),
  doa: doaConfigSchema,
  info: z.object({ items: z.array(infoItemSchema).default([]) }).default({ items: [] }),
  kado: kadoConfigSchema,
  video: videoConfigSchema,
  live: liveConfigSchema,
  prokes: prokesConfigSchema,
  adab: adabConfigSchema,
  theme: themeTokensSchema.default({ palette: {}, fonts: {} }),
  cover: coverConfigSchema,
});

export type InvitationConfig = z.infer<typeof invitationConfigSchema>;
export type Schedule = z.infer<typeof scheduleSchema>;
export type StoryItem = z.infer<typeof storyItemSchema>;
export type GalleryItem = z.infer<typeof galleryItemSchema>;

export interface GuestContext {
  name: string;
  code: string;
  quota: number;
  rsvp?: "pending" | "attending" | "declined";
  /** Payload QR kehadiran (opaque, v1.<code>.<mac>) — untuk ditampilkan di section QR. */
  qrPayload?: string;
}

export interface WishItem {
  id: string;
  name: string;
  message: string;
  createdAt: string;
}

/** Parse config JSONB dari DB; gagal → konfigurasi kosong (template default dipakai). */
export function parseConfig(raw: unknown): InvitationConfig {
  const parsed = invitationConfigSchema.safeParse(raw ?? {});
  if (parsed.success) return parsed.data;
  const fallback = invitationConfigSchema.safeParse({
    event: { date: new Date().toISOString() },
  });
  return fallback.success ? fallback.data : ({} as InvitationConfig);
}
