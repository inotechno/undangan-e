import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createRequire } from "node:module";
import { Resvg } from "@resvg/resvg-js";

const require = createRequire(import.meta.url);
const potrace = require("potrace");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const src = path.join(root, "src", "icon-crop.png");
const outSvg = path.join(root, "src", "icon.svg");
const outPreview = path.join(root, "png", "preview-icon-traced.png");

const trace = (file, opts) =>
  new Promise((resolve, reject) =>
    potrace.trace(file, opts, (err, svg) => (err ? reject(err) : resolve(svg))),
  );

const svg = await trace(src, {
  turdSize: 12,
  alphaMax: 1.2,
  optCurve: true,
  optTolerance: 0.25,
  color: "#CC6470",
  background: "transparent",
});

writeFileSync(outSvg, svg.trim() + "\n");

const match = svg.match(/viewBox="([^"]+)"/);
const width = svg.match(/width="([^"]+)"/);
const height = svg.match(/height="([^"]+)"/);
console.log("SVG written:", outSvg);
console.log(
  "viewBox:",
  match ? match[1] : "?",
  "width:",
  width ? width[1] : "?",
  "height:",
  height ? height[1] : "?",
);

const rendered = new Resvg(svg, { fitTo: { mode: "width", value: 512 } }).render();
writeFileSync(outPreview, rendered.asPng());
console.log("Preview:", outPreview);
