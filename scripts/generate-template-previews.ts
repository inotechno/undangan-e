/**
 * Generate screenshot thumbnail tiap template (mockup HP) ke public/templates/{slug}.png
 * Jalankan: npm run thumbnails   (server harus jalan di :3000)
 */
import { config } from "dotenv";
config();

import { mkdir } from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";
import { TEMPLATE_REGISTRY } from "../src/modules/invitation/templates";

const EDGE_PATH =
  process.env.EDGE_PATH ?? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const BASE = process.env.APP_BASE_URL ?? "http://localhost:3000";
const OUT_DIR = path.resolve(process.cwd(), "public", "templates");

const VIEWPORT = { width: 1000, height: 1240, deviceScaleFactor: 1.5 } as const;

async function waitForImages(page: import("puppeteer-core").Page) {
  await page.evaluate(async () => {
    const imgs = Array.from(document.images).filter((img) => !img.complete);
    await Promise.race([
      Promise.all(
        imgs.map((img) =>
          new Promise<void>((res) => {
            img.addEventListener("load", () => res(), { once: true });
            img.addEventListener("error", () => res(), { once: true });
          }),
        ),
      ),
      new Promise<void>((res) => setTimeout(res, 6000)),
    ]);
    await Promise.race([document.fonts.ready, new Promise<void>((res) => setTimeout(res, 4000))]);
  });
}

async function main() {
  const slugs = Object.keys(TEMPLATE_REGISTRY);
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    protocolTimeout: 60_000,
    args: [
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--autoplay-policy=no-user-gesture-required",
      "--hide-scrollbars",
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport(VIEWPORT);
    // Animasi partikel dimatikan agar screenshot deterministik
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);

    for (const slug of slugs) {
      const url = `${BASE}/template/${slug}/shot`;
      await page.goto(url, { waitUntil: "networkidle0", timeout: 90_000 });
      await waitForImages(page);
      await new Promise((r) => setTimeout(r, 300));
      const file = path.join(OUT_DIR, `${slug}.png`);
      await page.screenshot({ path: file, type: "png" });
      console.log(`✓ ${slug} → public/templates/${slug}.png`);
    }
  } finally {
    await browser.close();
  }
  console.log(`Selesai. ${slugs.length} thumbnail.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
