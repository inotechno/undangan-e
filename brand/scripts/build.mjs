import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const opentype = require("opentype.js");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outLogo = path.join(root, "logo");
const outGen = path.join(root, "generated");
mkdirSync(outLogo, { recursive: true });
mkdirSync(outGen, { recursive: true });

const TEAL = "#0D9488";
const CHARCOAL = "#373C3F";
const BLACK = "#000000";
const WHITE = "#FFFFFF";
const r2 = (n) => Math.round(n * 100) / 100;

// ---- icon source ----
const iconSvg = readFileSync(path.join(root, "src", "icon.svg"), "utf8");
const iconVb = iconSvg
  .match(/viewBox="([^"]+)"/)[1]
  .split(/\s+/)
  .map(Number);
const iconDs = [...iconSvg.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map((m) => m[1]);
const [, , IW, IH] = iconVb;

// ---- fonts ----
const loadFont = (file) => {
  const buf = readFileSync(file);
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
};
const bold = loadFont(path.join(root, "fonts", "Montserrat-Bold.ttf"));
const regular = loadFont(path.join(root, "fonts", "Montserrat-Regular.ttf"));

const TAG_TEXT = "UNDANGAN ELEKTRONIK";

function glyphPath(font, text, size, x, y) {
  const p = font.getPath(text, x, y, size);
  return { d: p.toPathData(2), width: font.getAdvanceWidth(text, size) };
}

function wordmark(size, x, y) {
  const main = glyphPath(bold, "Undangan", size, x, y);
  const e = glyphPath(bold, "E", size, x + main.width, y);
  return { charcoal: main.d, teal: e.d, width: main.width + e.width };
}

function tagline(size, targetWidth, x, y) {
  const chars = [...TAG_TEXT];
  const upm = regular.unitsPerEm;
  const natural = chars.reduce(
    (s, ch) => s + (regular.charToGlyph(ch).advanceWidth / upm) * size,
    0,
  );
  const track = chars.length > 1 ? (targetWidth - natural) / (chars.length - 1) : 0;
  let cx = x;
  const ds = [];
  for (const ch of chars) {
    const g = regular.charToGlyph(ch);
    ds.push(g.getPath(cx, y, size).toPathData(2));
    cx += (g.advanceWidth / upm) * size + track;
  }
  return { d: ds.join(" "), width: targetWidth };
}

// ---- geometry (from reference measurements) ----
// horizontal: baseline = 0.647*iconH ; tagline baseline = 0.904*iconH ; taglineEm = 0.25*em
// stacked: em = 0.362*iconH ; capTop = iconH*1.06 ; tagline baseline = wmBaseline + 0.427*em
const iconPart = (iconH, x, y) => {
  const s = iconH / IH;
  return {
    d: iconDs[0],
    fill: "currentColor",
    transform: `translate(${r2(x)} ${r2(y)}) scale(${r2(s)})`,
    _icon: true,
  };
};

function horizontalLayout({ iconH, emRatio, gapRatio, withTagline, taglineRatio = 0.25 }) {
  const em = emRatio * iconH;
  const iw = (IW * iconH) / IH;
  const gap = gapRatio * iconH;
  const wmX = iw + gap;
  const baseline = 0.647 * iconH;
  const wm = wordmark(em, wmX, baseline);
  const parts = [
    iconPart(iconH, 0, 0),
    { d: wm.charcoal, fill: "currentColor", _charcoal: true },
    { d: wm.teal, fill: TEAL, _teal: true },
  ];
  let w = wmX + wm.width;
  let h = iconH;
  if (withTagline) {
    const tagEm = taglineRatio * em;
    const tagBaseline = 0.904 * iconH;
    const tg = tagline(tagEm, wm.width, wmX, tagBaseline);
    parts.push({ d: tg.d, fill: "currentColor", _charcoal: true });
  }
  return { w, h, parts };
}

function stackedLayout({ iconH, emRatio = 0.362, withTagline }) {
  const em = emRatio * iconH;
  const iw = (IW * iconH) / IH;
  const wm = wordmark(em, 0, 0); // measure at baseline 0
  const w = Math.max(iw, wm.width);
  const iconX = (w - iw) / 2;
  const capTop = iconH * 1.06;
  const baseline = capTop + 0.7 * em;
  const wmAbs = wordmark(em, (w - wm.width) / 2, baseline);
  const parts = [
    iconPart(iconH, iconX, 0),
    { d: wmAbs.charcoal, fill: "currentColor", _charcoal: true },
    { d: wmAbs.teal, fill: TEAL, _teal: true },
  ];
  let h = baseline + 0.1 * em;
  if (withTagline) {
    const tagEm = 0.223 * em;
    const tagBaseline = baseline + 0.427 * em;
    const tg = tagline(tagEm, wm.width, (w - wm.width) / 2, tagBaseline);
    parts.push({ d: tg.d, fill: "currentColor", _charcoal: true });
    h = tagBaseline + 0.15 * tagEm;
  }
  return { w, h, parts };
}

function iconOnlyLayout() {
  return { w: IW, h: IH, parts: [iconPart(IH, 0, 0)] };
}

function paddedIconLayout(square, padRatio = 0.78) {
  const iconH = square * padRatio;
  const iw = (IW * iconH) / IH;
  return {
    w: square,
    h: square,
    parts: [iconPart(iconH, (square - iw) / 2, (square - iconH) / 2)],
  };
}

function socialLayout(square = 1024) {
  const iconH = square * 0.46;
  const iw = (IW * iconH) / IH;
  const probe = wordmark(100, 0, 0);
  const targetW = square * 0.74;
  const em = (targetW / probe.width) * 100;
  const baseline = square * 0.8;
  const wm = wordmark(em, (square - targetW) / 2, baseline);
  return {
    w: square,
    h: square,
    parts: [
      iconPart(iconH, (square - iw) / 2, square * 0.14),
      { d: wm.charcoal, fill: "currentColor", _charcoal: true },
      { d: wm.teal, fill: TEAL, _teal: true },
    ],
  };
}

function svgDoc(layout, { colorMode } = {}) {
  const mapFill = (p) => {
    if (p._icon) return colorMode === "mono" ? "currentColor" : TEAL;
    if (p._teal) return colorMode === "mono" ? "currentColor" : TEAL;
    if (p._charcoal) return colorMode === "mono" ? "currentColor" : CHARCOAL;
    return p.fill;
  };
  const lines = layout.parts.map((p) => {
    const attrs = [
      `d="${p.d}"`,
      `fill="${mapFill(p)}"`,
      p.transform ? `transform="${p.transform}"` : "",
      p.opacity ? `opacity="${p.opacity}"` : "",
    ]
      .filter(Boolean)
      .join(" ");
    return `  <path ${attrs}/>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r2(layout.w)} ${r2(layout.h)}" width="${r2(layout.w)}" height="${r2(layout.h)}">\n${lines.join("\n")}\n</svg>\n`;
}

// ---- build variants ----
const ICON_H = 436; // reference-based unit for horizontal lockups

const variants = {};
variants["undangane-primary"] = svgDoc(
  horizontalLayout({ iconH: ICON_H, emRatio: 0.524, gapRatio: 0.16, withTagline: true }),
);
variants["undangane-brand"] = svgDoc(
  horizontalLayout({ iconH: ICON_H, emRatio: 0.524, gapRatio: 0.16, withTagline: false }),
);
variants["undangane-compact"] = svgDoc(
  horizontalLayout({ iconH: ICON_H, emRatio: 0.524, gapRatio: 0.11, withTagline: false }),
);
variants["undangane-stacked"] = svgDoc(stackedLayout({ iconH: 560, withTagline: true }));
variants["undangane-print"] = svgDoc(stackedLayout({ iconH: 560, withTagline: false }));
variants["undangane-icon"] = svgDoc(iconOnlyLayout());
variants["undangane-monochrome-black"] = svgDoc(
  horizontalLayout({ iconH: ICON_H, emRatio: 0.524, gapRatio: 0.16, withTagline: false }),
).replace(/fill="#[0-9A-Fa-f]{6}"/g, `fill="${BLACK}"`);
variants["undangane-monochrome-white"] = svgDoc(
  horizontalLayout({ iconH: ICON_H, emRatio: 0.524, gapRatio: 0.16, withTagline: false }),
).replace(/fill="#[0-9A-Fa-f]{6}"/g, `fill="${WHITE}"`);
variants["undangane-social"] = svgDoc(socialLayout());
variants["undangane-watermark"] = (() => {
  const layout = horizontalLayout({
    iconH: ICON_H,
    emRatio: 0.524,
    gapRatio: 0.16,
    withTagline: false,
  });
  const svg = svgDoc(layout, { colorMode: "mono" }).replace(
    /fill="currentColor"/g,
    'fill="#000000" opacity="0.15"',
  );
  return svg;
})();
variants["undangane-favicon"] = svgDoc(paddedIconLayout(512, 0.84));
variants["undangane-appicon"] = svgDoc(paddedIconLayout(512, 0.76));

for (const [name, svg] of Object.entries(variants)) {
  writeFileSync(path.join(outLogo, `${name}.svg`), svg);
}
console.log("Variants written:", Object.keys(variants).length);

// ---- generated TS data for React component ----
const parseVariant = (svg) => {
  const vb = svg.match(/viewBox="([^"]+)"/)[1];
  const paths = [...svg.matchAll(/<path ([^>]+)\/>/g)].map((m) => {
    const attrs = m[1];
    const d = attrs.match(/d="([^"]+)"/)[1];
    const fill = attrs.match(/fill="([^"]+)"/)[1];
    const transform = attrs.match(/transform="([^"]+)"/);
    const opacity = attrs.match(/opacity="([^"]+)"/);
    return {
      d,
      fill,
      ...(transform ? { transform: transform[1] } : {}),
      ...(opacity ? { opacity: opacity[1] } : {}),
    };
  });
  return { viewBox: vb, paths };
};

const colorable = new Set([
  "undangane-monochrome-black",
  "undangane-monochrome-white",
  "undangane-watermark",
]);

const data = {};
for (const [name, svg] of Object.entries(variants)) {
  const parsed = parseVariant(svg);
  if (colorable.has(name)) parsed.paths = parsed.paths.map((p) => ({ ...p, fill: "currentColor" }));
  data[name] = parsed;
}

const ts = `// Generated by brand/scripts/build.mjs — DO NOT EDIT MANUALLY.
export type LogoPath = { d: string; fill: string; transform?: string; opacity?: string };
export type LogoVariantData = { viewBox: string; paths: readonly LogoPath[] };
export const LOGO_DATA = ${JSON.stringify(data, null, 2)} as const;
export type LogoFileKey = keyof typeof LOGO_DATA;
`;
writeFileSync(path.join(outGen, "logo-paths.ts"), ts);
console.log("logo-paths.ts written");
