"use client";

import type { ThemeTokens } from "../types";

/* ── Util deterministik ──────────────────────────────────── */

function rnd(i: number, salt: number, mod: number): number {
  return ((i * 9973 + salt * 7919 + 17) % mod) + (i % 3) * 0.37;
}

const KEYFRAMES = `
@keyframes inv-fall { from { transform: translate3d(0,-12vh,0); } to { transform: translate3d(0,112vh,0); } }
@keyframes inv-fall-rot { from { transform: translate3d(0,-12vh,0) rotate(0deg); } to { transform: translate3d(0,112vh,0) rotate(540deg); } }
@keyframes inv-sway { 0%,100% { transform: translateX(-14px) rotate(-12deg); } 50% { transform: translateX(14px) rotate(14deg); } }
@keyframes inv-twine { 0%,100% { opacity: 0.25; transform: scale(0.7) rotate(0deg); } 50% { opacity: 1; transform: scale(1.15) rotate(20deg); } }
@keyframes inv-drift-y { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-16px); } }
@keyframes inv-cross { from { transform: translateX(-12vw) translateY(0); } to { transform: translateX(112vw) translateY(-40px); } }
@keyframes inv-bob { 0%,100% { transform: translateY(0) rotate(-6deg); } 50% { transform: translateY(-18px) rotate(8deg); } }
@keyframes inv-wing { 0%,100% { transform: scaleX(1); } 50% { transform: scaleX(0.35); } }
@keyframes inv-rise { from { transform: translate3d(0,112vh,0); } to { transform: translate3d(0,-12vh,0); } }
@keyframes inv-wobble { 0%,100% { transform: translateX(-10px); } 50% { transform: translateX(10px); } }
@keyframes inv-glow { 0%,100% { opacity: 0.18; transform: scale(1); } 50% { opacity: 0.42; transform: scale(1.12); } }
@keyframes inv-pan { from { background-position: 0 0, 0 24px, 24px -24px, -24px 0; } to { background-position: 48px 48px, 48px 72px, 72px 24px, 24px 48px; } }
@media (prefers-reduced-motion: reduce) {
  .inv-p { animation: none !important; }
}
`;

function Layer({ children }: { children: React.ReactNode }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-20 overflow-hidden">
      <style>{KEYFRAMES}</style>
      {children}
    </div>
  );
}

/* ── Bentuk vektor ───────────────────────────────────────── */

function Petal({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full" style={{ fill: color }}>
      <path d="M12 2C9 6 5 8 5 13a7 7 0 0 0 14 0c0-5-4-7-7-11z" />
    </svg>
  );
}

function Star({ color, size }: { color: string; size: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={{ fill: color }}>
      <path d="M12 0l2.4 9.6L24 12l-9.6 2.4L12 24l-2.4-9.6L0 12l9.6-2.4z" />
    </svg>
  );
}

function Butterfly({ color, wingColor }: { color: string; wingColor: string }) {
  return (
    <svg viewBox="0 0 48 40" className="h-full w-auto">
      <g className="inv-p" style={{ animation: "inv-wing 0.55s ease-in-out infinite", transformOrigin: "24px 20px" }}>
        <ellipse cx="14" cy="13" rx="11" ry="9" style={{ fill: color }} />
        <ellipse cx="15" cy="28" rx="8" ry="7" style={{ fill: wingColor }} />
      </g>
      <g className="inv-p" style={{ animation: "inv-wing 0.55s ease-in-out infinite", transformOrigin: "24px 20px" }}>
        <ellipse cx="34" cy="13" rx="11" ry="9" style={{ fill: color }} />
        <ellipse cx="33" cy="28" rx="8" ry="7" style={{ fill: wingColor }} />
      </g>
      <rect x="22.6" y="8" width="2.8" height="24" rx="1.4" style={{ fill: "#3b3230" }} />
    </svg>
  );
}

/* ── Layer per jenis partikel ────────────────────────────── */

function Petals({ theme }: { theme: ThemeTokens }) {
  const colors = [theme.palette.accent, theme.palette.accentSoft, "#ffffff", theme.palette.accent];
  return (
    <Layer>
      {Array.from({ length: 16 }, (_, i) => (
        <div
          key={i}
          className="inv-p absolute top-0"
          style={{
            left: `${rnd(i, 3, 96)}%`,
            width: `${10 + rnd(i, 5, 8)}px`,
            height: `${10 + rnd(i, 7, 8)}px`,
            opacity: 0.55 + rnd(i, 9, 4) / 10,
            animation: `inv-fall ${9 + rnd(i, 11, 8)}s linear infinite`,
            animationDelay: `-${rnd(i, 13, 12)}s`,
          }}
        >
          <div
            className="inv-p h-full w-full"
            style={{ animation: `inv-sway ${3 + rnd(i, 17, 3)}s ease-in-out infinite` }}
          >
            <Petal color={colors[i % colors.length]!} />
          </div>
        </div>
      ))}
    </Layer>
  );
}

function Sparkles({ theme }: { theme: ThemeTokens }) {
  const colors = [theme.palette.accent, "#ffffff", theme.palette.accentSoft, theme.palette.accent];
  return (
    <Layer>
      {Array.from({ length: 18 }, (_, i) => {
        const size = 6 + rnd(i, 3, 10);
        return (
          <div
            key={i}
            className="inv-p absolute"
            style={{
              left: `${rnd(i, 5, 96)}%`,
              top: `${rnd(i, 7, 88)}%`,
              animation: `inv-twine ${2.2 + rnd(i, 9, 3.5)}s ease-in-out infinite`,
              animationDelay: `-${rnd(i, 11, 4)}s`,
            }}
          >
            <Star color={colors[i % colors.length]!} size={size} />
          </div>
        );
      })}
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={`g-${i}`}
          className="inv-p absolute rounded-full blur-xl"
          style={{
            left: `${rnd(i, 21, 80)}%`,
            top: `${rnd(i, 23, 70)}%`,
            width: `${90 + rnd(i, 25, 70)}px`,
            height: `${90 + rnd(i, 27, 70)}px`,
            background: `radial-gradient(circle, ${theme.palette.accent}44, transparent 70%)`,
            animation: `inv-glow ${7 + rnd(i, 29, 5)}s ease-in-out infinite`,
            animationDelay: `-${rnd(i, 31, 6)}s`,
          }}
        />
      ))}
    </Layer>
  );
}

function Butterflies({ theme }: { theme: ThemeTokens }) {
  const main = theme.palette.accent;
  const alt = theme.palette.accentSoft;
  return (
    <Layer>
      {Array.from({ length: 8 }, (_, i) => (
        <div
          key={i}
          className="inv-p absolute"
          style={{
            left: 0,
            top: `${8 + rnd(i, 3, 70)}%`,
            width: `${26 + rnd(i, 5, 16)}px`,
            height: `${22 + rnd(i, 7, 14)}px`,
            opacity: 0.8,
            animation: `inv-cross ${13 + rnd(i, 9, 10)}s linear infinite`,
            animationDelay: `-${rnd(i, 11, 14)}s`,
          }}
        >
          <div
            className="inv-p h-full w-full"
            style={{ animation: `inv-bob ${2.6 + rnd(i, 13, 2)}s ease-in-out infinite` }}
          >
            <Butterfly color={i % 2 === 0 ? main : alt} wingColor={i % 2 === 0 ? alt : main} />
          </div>
        </div>
      ))}
    </Layer>
  );
}

const CONFETTI_COLORS = [
  "#F97316",
  "#FBBF24",
  "#F472B6",
  "#60A5FA",
  "#34D399",
  "#A78BFA",
];

function Confetti({ theme }: { theme: ThemeTokens }) {
  const colors = [...CONFETTI_COLORS, theme.palette.accent];
  return (
    <Layer>
      {Array.from({ length: 22 }, (_, i) => (
        <div
          key={i}
          className="inv-p absolute top-0"
          style={{
            left: `${rnd(i, 3, 96)}%`,
            width: `${7 + rnd(i, 5, 6)}px`,
            height: `${10 + rnd(i, 7, 8)}px`,
            borderRadius: rnd(i, 9, 2) > 1 ? "2px" : "50%",
            background: colors[i % colors.length],
            opacity: 0.85,
            animation: `inv-fall-rot ${5 + rnd(i, 11, 6)}s linear infinite`,
            animationDelay: `-${rnd(i, 13, 8)}s`,
          }}
        />
      ))}
    </Layer>
  );
}

function Bokeh({ theme }: { theme: ThemeTokens }) {
  const colors = [theme.palette.accent, theme.palette.accentSoft, "#ffffff", theme.palette.accent];
  return (
    <Layer>
      {Array.from({ length: 10 }, (_, i) => (
        <div
          key={i}
          className="inv-p absolute rounded-full blur-[10px]"
          style={{
            left: `${rnd(i, 3, 90)}%`,
            top: `${rnd(i, 5, 82)}%`,
            width: `${26 + rnd(i, 7, 40)}px`,
            height: `${26 + rnd(i, 9, 40)}px`,
            background: colors[i % colors.length],
            opacity: 0.22 + rnd(i, 11, 18) / 100,
            animation: `inv-drift-y ${6 + rnd(i, 13, 8)}s ease-in-out infinite`,
            animationDelay: `-${rnd(i, 15, 6)}s`,
          }}
        />
      ))}
    </Layer>
  );
}

function Bubbles({ theme }: { theme: ThemeTokens }) {
  return (
    <Layer>
      {Array.from({ length: 14 }, (_, i) => {
        const size = 12 + rnd(i, 3, 28);
        return (
          <div
            key={i}
            className="inv-p absolute bottom-0 rounded-full"
            style={{
              left: `${rnd(i, 5, 94)}%`,
              width: `${size}px`,
              height: `${size}px`,
              border: `2px solid ${theme.palette.accent}`,
              background: `radial-gradient(circle at 32% 30%, #ffffff88, ${theme.palette.accentSoft}55)`,
              opacity: 0.7,
              animation: `inv-rise ${9 + rnd(i, 7, 8)}s linear infinite`,
              animationDelay: `-${rnd(i, 9, 10)}s`,
            }}
          >
            <div
              className="inv-p h-full w-full"
              style={{ animation: `inv-wobble ${2.4 + rnd(i, 11, 2)}s ease-in-out infinite` }}
            />
          </div>
        );
      })}
    </Layer>
  );
}

function GridFlow({ theme }: { theme: ThemeTokens }) {
  return (
    <Layer>
      <div
        className="inv-p absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: `linear-gradient(45deg, var(--inv-accent) 25%, transparent 25%), linear-gradient(-45deg, var(--inv-accent) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--inv-accent) 75%), linear-gradient(-45deg, transparent 75%, var(--inv-accent) 75%)`,
          backgroundSize: "48px 48px",
          animation: "inv-pan 18s linear infinite",
        }}
      />
      <div
        className="inv-p absolute inset-0 opacity-[0.16]"
        style={{
          background: `repeating-linear-gradient(0deg, transparent 0 58px, ${theme.palette.accent}33 58px 60px)`,
          animation: "inv-drift-y 10s ease-in-out infinite",
        }}
      />
      {Array.from({ length: 4 }, (_, i) => (
        <div
          key={i}
          className="inv-p absolute h-px w-full"
          style={{
            top: `${18 + i * 22}%`,
            background: `linear-gradient(90deg, transparent, ${theme.palette.accent}66, transparent)`,
            animation: `inv-glow ${4 + i}s ease-in-out infinite`,
            animationDelay: `-${i}s`,
          }}
        />
      ))}
    </Layer>
  );
}

/* ── Eksposur utama ──────────────────────────────────────── */

export function DecorationLayer({ theme }: { theme: ThemeTokens }) {
  switch (theme.particles) {
    case "petals":
      return <Petals theme={theme} />;
    case "sparkles":
      return <Sparkles theme={theme} />;
    case "butterflies":
      return <Butterflies theme={theme} />;
    case "confetti":
      return <Confetti theme={theme} />;
    case "bokeh":
      return <Bokeh theme={theme} />;
    case "bubbles":
      return <Bubbles theme={theme} />;
    case "grid":
      return <GridFlow theme={theme} />;
    default:
      return null;
  }
}
