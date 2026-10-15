import type { CSSProperties } from "react";
import type { ThemeTokens } from "./types";

/** Tipe override tema (cocok dengan keluaran zod `themeTokensSchema`). */
export interface ThemeOverride {
  palette?: Partial<ThemeTokens["palette"]>;
  fonts?: Partial<ThemeTokens["fonts"]>;
  radius?: number;
  decorations?: ThemeTokens["decorations"];
  motion?: ThemeTokens["motion"];
  particles?: ThemeTokens["particles"];
}

/** Daftar font aman (docs/06 §2.2) — hanya keluarga yang sudah dimuat + fallback sistem. */
export const FONT_PAIRS = {
  serif: {
    heading: `Georgia, "Times New Roman", serif`,
    body: `var(--font-sans), ui-sans-serif, system-ui, sans-serif`,
  },
  montserrat: {
    heading: `var(--font-heading), var(--font-sans), sans-serif`,
    body: `var(--font-sans), ui-sans-serif, system-ui, sans-serif`,
  },
  jakarta: {
    heading: `var(--font-sans), ui-sans-serif, system-ui, sans-serif`,
    body: `var(--font-sans), ui-sans-serif, system-ui, sans-serif`,
  },
  /** Script/calligraphy — untuk judul cover gaya elegan. */
  script: {
    heading: `var(--font-script), "Great Vibes", cursive, Georgia, serif`,
    body: `var(--font-sans), ui-sans-serif, system-ui, sans-serif`,
  },
} as const;

export type FontPairId = keyof typeof FONT_PAIRS;

export const DEFAULT_THEME: ThemeTokens = {
  palette: {
    bg: "#FAF8F6",
    surface: "#FFFFFF",
    text: "#373C3F",
    accent: "#0D9488",
    accentSoft: "#E6F5F2",
  },
  fonts: FONT_PAIRS.serif,
  radius: 16,
  decorations: "ornament",
  motion: "soft",
  particles: "none",
};

/** Gabungkan default template dengan override dari config undangan. */
export function resolveTheme(
  base: ThemeOverride | undefined,
  override: ThemeOverride | undefined,
): ThemeTokens {
  const merged: ThemeTokens = {
    palette: { ...DEFAULT_THEME.palette, ...base?.palette, ...override?.palette },
    fonts: { ...DEFAULT_THEME.fonts, ...base?.fonts, ...override?.fonts },
    radius: override?.radius ?? base?.radius ?? DEFAULT_THEME.radius,
    decorations: override?.decorations ?? base?.decorations ?? DEFAULT_THEME.decorations,
    motion: override?.motion ?? base?.motion ?? DEFAULT_THEME.motion,
    particles: override?.particles ?? base?.particles ?? DEFAULT_THEME.particles,
  };
  return merged;
}

/** CSS variables yang dipakai semua section undangan. */
export function themeStyle(theme: ThemeTokens): CSSProperties {
  return {
    "--inv-bg": theme.palette.bg,
    "--inv-surface": theme.palette.surface,
    "--inv-text": theme.palette.text,
    "--inv-accent": theme.palette.accent,
    "--inv-accent-soft": theme.palette.accentSoft,
    "--inv-heading": theme.fonts.heading,
    "--inv-body": theme.fonts.body,
    "--inv-radius": `${theme.radius}px`,
    color: theme.palette.text,
    background: theme.palette.bg,
    fontFamily: theme.fonts.body,
  } as CSSProperties;
}

export const MOTION_TRANSITION: Record<ThemeTokens["motion"], string> = {
  soft: "duration-700 ease-out",
  playful: "duration-500 ease-out",
  elegant: "duration-1000 ease-in-out",
};

/** Ornamen dekoratif per jenis (memakai aset SVG di /brand/deco). */
export function decorationSrc(kind: ThemeTokens["decorations"]): string | null {
  switch (kind) {
    case "floral":
      return "/brand/deco/elegant-divider.svg";
    case "ornament":
      return "/brand/deco/rings-ornament.svg";
    case "geometric":
      return "/brand/deco/section-divider.svg";
    case "none":
      return null;
  }
}
