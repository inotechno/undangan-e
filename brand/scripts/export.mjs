import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { Resvg } from "@resvg/resvg-js";

const require = createRequire(import.meta.url);
const pngToIcoModule = require("png-to-ico");
const pngToIco = pngToIcoModule.default || pngToIcoModule;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const logoDir = path.join(root, "logo");
const pngDir = path.join(root, "png");
mkdirSync(pngDir, { recursive: true });

const render = (svg, width) =>
  new Resvg(svg, { fitTo: { mode: "width", value: Math.round(width) } }).render().asPng();
const load = (name) => readFileSync(path.join(logoDir, `${name}.svg`), "utf8");
const nativeWidth = (svg) => parseFloat(svg.match(/width="([^"]+)"/)[1]);

const NATIVE_PNGS = [
  "undangane-primary",
  "undangane-brand",
  "undangane-compact",
  "undangane-stacked",
  "undangane-print",
  "undangane-social",
  "undangane-monochrome-black",
  "undangane-monochrome-white",
  "undangane-watermark",
];

for (const name of NATIVE_PNGS) {
  const svg = load(name);
  const w = nativeWidth(svg);
  writeFileSync(path.join(pngDir, `${name}.png`), render(svg, w));
  if (name === "undangane-primary")
    writeFileSync(path.join(pngDir, `${name}@2x.png`), render(svg, w * 2));
  console.log(`PNG ${name} (${Math.round(w)}px)`);
}

const iconSvg = load("undangane-icon");
writeFileSync(path.join(pngDir, "undangane-icon.png"), render(iconSvg, 512));
console.log("PNG undangane-icon (512px)");

const appSvg = load("undangane-appicon");
for (const s of [512, 192, 180, 152, 120]) {
  writeFileSync(path.join(pngDir, `undangane-app-icon-${s}.png`), render(appSvg, s));
}
writeFileSync(path.join(pngDir, "undangane-app-icon.png"), render(appSvg, 512));
console.log("PNG app icons 512/192/180/152/120");

const favSvg = load("undangane-favicon");
const fav32 = render(favSvg, 32);
const fav16 = render(favSvg, 16);
writeFileSync(path.join(pngDir, "undangane-favicon-32.png"), fav32);
writeFileSync(path.join(pngDir, "undangane-favicon-16.png"), fav16);
const ico = await pngToIco([fav32, fav16]);
writeFileSync(path.join(pngDir, "favicon.ico"), ico);
console.log("PNG favicon 32/16 + favicon.ico");
console.log("DONE");
