import { createHmac, timingSafeEqual } from "node:crypto";
import QRCode from "qrcode";
import sharp from "sharp";
import { env } from "@/core/config";
import { DEFAULT_EYEBROWS, type InvitationConfig } from "@/modules/invitation";

/**
 * Payload QR tamu (docs/09): opaque token `v1.<guestCode>.<hmac>` — tanpa PII.
 * HMAC memakai QR_HMAC_SECRET (fallback AUTH_SECRET) agar payload tidak bisa dipalsukan.
 */
export function signGuestPayload(guestCode: string): string {
  const secret = env.QR_HMAC_SECRET || env.AUTH_SECRET;
  const mac = createHmac("sha256", secret).update(`v1.${guestCode}`).digest("hex").slice(0, 32);
  return `v1.${guestCode}.${mac}`;
}

/** Verifikasi payload hasil scan → guestCode asli, atau null bila invalid. */
export function verifyGuestPayload(payload: string): string | null {
  const parts = payload.trim().split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return null;
  const [, code, mac] = parts as [string, string, string];
  if (!code || !mac) return null;
  const secret = env.QR_HMAC_SECRET || env.AUTH_SECRET;
  const expected = createHmac("sha256", secret).update(`v1.${code}`).digest("hex").slice(0, 32);
  const a = Buffer.from(mac, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return null;
  return timingSafeEqual(a, b) ? code : null;
}

/** Escaping teks agar aman disisipkan ke SVG. */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const SANS = "'Segoe UI', system-ui, -apple-system, sans-serif";
const SERIF = "Georgia, 'Times New Roman', serif";
const MONO = "'Consolas', ui-monospace, monospace";

/** Estimasi lebar teks (px) untuk word-wrap tanpa canvas. */
function estimateWidth(text: string, fontSize: number, factor = 0.55): number {
  return text.length * fontSize * factor;
}

/** Word-wrap sederhana; bila melebihi maxLines, baris terakhir ditambah "…". */
function wrapText(text: string, maxWidth: number, fontSize: number, factor = 0.55, maxLines = 2): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (!cur || estimateWidth(next, fontSize, factor) <= maxWidth) {
      cur = next;
    } else {
      lines.push(cur);
      cur = w;
      if (lines.length >= maxLines) break;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (lines.length === maxLines) {
    const used = lines.join(" ").length;
    if (used < text.trim().length) {
      const last = lines[maxLines - 1]!;
      lines[maxLines - 1] = `${last.slice(0, Math.max(1, last.length - 1))}…`;
    }
  }
  return lines;
}

export interface QrScheduleInfo {
  title: string;
  /** Rentang waktu, mis. "09.00 – 10.00". */
  time?: string;
  venue?: string;
  address?: string;
}

export interface QrPassInfo {
  guestName: string;
  quota: number;
  guestCode: string;
  /** Nama pasangan / tokoh acara — judul utama kartu. */
  coupleNames: string;
  /** Label kecil di atas judul, mis. "The Wedding of". */
  eyebrow?: string;
  /** Tanggal panjang, mis. "Sabtu, 12 Desember 2026". */
  dateLabel: string;
  schedules: QrScheduleInfo[];
}

function fmtDateLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function fmtTime(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function fmtTimeRange(start?: string, end?: string): string {
  const a = fmtTime(start);
  const b = fmtTime(end);
  if (a && b) return `${a} – ${b}`;
  return a || b || "";
}

/** Susun info kartu QR dari config undangan + data tamu. */
export function buildQrPassInfo(
  cfg: InvitationConfig,
  guest: { name: string; quota: number; guestCode: string },
): QrPassInfo {
  const couple = cfg.event.couple;
  const coupleNames =
    (couple ? `${couple.brideName} & ${couple.groomName}` : "") ||
    cfg.event.title ||
    cfg.event.host?.name ||
    (cfg.event.celebrant ? `${cfg.event.celebrant.name}` : "") ||
    cfg.seo.title ||
    "Undangan Spesial";
  return {
    guestName: guest.name,
    quota: guest.quota,
    guestCode: guest.guestCode,
    coupleNames,
    eyebrow: DEFAULT_EYEBROWS[cfg.event.type] ?? "Undangan",
    dateLabel: fmtDateLabel(cfg.event.date),
    schedules: cfg.event.schedules.slice(0, 3).map((s) => ({
      title: s.title,
      time: fmtTimeRange(s.start, s.end),
      venue: s.venue || undefined,
      address: s.address || undefined,
    })),
  };
}

/** Render payload QR menjadi PNG buffer (QR polos, untuk route publik). */
export async function guestQrPng(payload: string): Promise<Buffer> {
  return QRCode.toBuffer(payload, { type: "png", width: 512, margin: 2, errorCorrectionLevel: "M" });
}

/**
 * Kartu tiket QR tamu (PNG). Layout menyesuaikan konten: judul & nama
 * di-wrap, jadwal lengkap dengan waktu dan alamat, tinggi kartu dinamis.
 */
export async function guestQrPassPng(payload: string, info: QrPassInfo): Promise<Buffer> {
  const qrPng = await QRCode.toBuffer(payload, {
    type: "png",
    width: 640,
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#142c3cff", light: "#ffffffff" },
  });
  const qrDataUri = `data:image/png;base64,${qrPng.toString("base64")}`;

  const W = 640;
  const PAD = 48;
  const contentW = W - PAD * 2;
  const cx = W / 2;

  /* ── Header (gradient) ── */
  const titleSize = 30;
  const titleLines = wrapText(info.coupleNames, contentW - 24, titleSize, 0.52, 2);
  const headerH = 40 + 18 + 12 + titleLines.length * 38 + 10 + 18 + 28;

  const body: string[] = [];
  let y = headerH + 36;

  if (info.eyebrow) {
    body.push(
      `<text x="${cx}" y="${y}" text-anchor="middle" font-family="${SANS}" font-size="13" font-weight="700" fill="#0D9488">${esc(info.eyebrow)}</text>`,
    );
    y += 26;
  }

  /* ── Tamu ── */
  body.push(
    `<text x="${cx}" y="${y}" text-anchor="middle" font-family="${SANS}" font-size="11" font-weight="700" letter-spacing="3" fill="#687b88">UNTUK</text>`,
  );
  y += 28;

  const nameSize = info.guestName.trim().length > 24 ? 24 : 28;
  const nameLines = wrapText(info.guestName, contentW, nameSize, 0.56, 2);
  for (const line of nameLines) {
    body.push(
      `<text x="${cx}" y="${y}" text-anchor="middle" font-family="${SANS}" font-size="${nameSize}" font-weight="800" fill="#142c3c">${esc(line)}</text>`,
    );
    y += nameSize + 8;
  }
  y += 6;

  const chipText = `Kuota: ${info.quota} orang`;
  const chipW = Math.min(240, 32 + chipText.length * 7.6);
  body.push(
    `<rect x="${(W - chipW) / 2}" y="${y}" width="${chipW}" height="32" rx="16" fill="#e8f4f2"/>`,
    `<text x="${cx}" y="${y + 21}" text-anchor="middle" font-family="${SANS}" font-size="13" font-weight="700" fill="#0D9488">${esc(chipText)}</text>`,
  );
  y += 32 + 28;

  body.push(
    `<line x1="${PAD}" y1="${y}" x2="${W - PAD}" y2="${y}" stroke="#d8e3e8" stroke-width="2" stroke-dasharray="7 5"/>`,
  );
  y += 36;

  /* ── Tanggal ── */
  if (info.dateLabel) {
    const dateLines = wrapText(info.dateLabel, contentW, 16, 0.55, 2);
    for (const line of dateLines) {
      body.push(
        `<text x="${cx}" y="${y}" text-anchor="middle" font-family="${SANS}" font-size="16" font-weight="800" fill="#142c3c">${esc(line)}</text>`,
      );
      y += 22;
    }
    y += 8;
  }

  /* ── Jadwal ── */
  for (const s of info.schedules) {
    const head = s.time ? `${s.title} · ${s.time}` : s.title;
    body.push(
      `<text x="${cx}" y="${y}" text-anchor="middle" font-family="${SANS}" font-size="14" font-weight="700" fill="#2a4155">${esc(head)}</text>`,
    );
    y += 22;
    if (s.venue) {
      const venueLines = wrapText(s.venue, contentW, 13, 0.55, 2);
      for (const line of venueLines) {
        body.push(
          `<text x="${cx}" y="${y}" text-anchor="middle" font-family="${SANS}" font-size="13" fill="#536477">${esc(line)}</text>`,
        );
        y += 19;
      }
    }
    if (s.address) {
      const addrLines = wrapText(s.address, contentW, 12, 0.53, 2);
      for (const line of addrLines) {
        body.push(
          `<text x="${cx}" y="${y}" text-anchor="middle" font-family="${SANS}" font-size="12" fill="#687b88">${esc(line)}</text>`,
        );
        y += 18;
      }
    }
    y += 14;
  }

  /* ── Panel QR ── */
  const panelW = 400;
  const panelX = (W - panelW) / 2;
  const panelH = 400;
  const qrSize = 320;
  const qrX = (W - qrSize) / 2;
  body.push(
    `<rect x="${panelX}" y="${y}" width="${panelW}" height="${panelH}" rx="20" fill="#f8fbfb" stroke="#e3eeeb" stroke-width="2"/>`,
    `<image x="${qrX}" y="${y + 22}" width="${qrSize}" height="${qrSize}" href="${qrDataUri}" xlink:href="${qrDataUri}" xmlns:xlink="http://www.w3.org/1999/xlink"/>`,
    `<text x="${cx}" y="${y + 372}" text-anchor="middle" font-family="${MONO}" font-size="12" fill="#687b88">Kode tamu: ${esc(info.guestCode)}</text>`,
  );
  y += panelH + 30;

  /* ── Footer ── */
  const noteLines = wrapText("Tunjukkan QR ini kepada panitia saat tiba di lokasi acara.", contentW, 12, 0.53, 2);
  for (const line of noteLines) {
    body.push(
      `<text x="${cx}" y="${y}" text-anchor="middle" font-family="${SANS}" font-size="12" fill="#687b88">${esc(line)}</text>`,
    );
    y += 18;
  }
  y += 10;
  body.push(
    `<text x="${cx}" y="${y}" text-anchor="middle" font-family="${SANS}" font-size="12" font-weight="700" fill="#0D9488">undangane.id</text>`,
  );
  y += 28;

  const H = Math.round(y);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Tiket QR ${esc(info.guestName)}">
  <defs>
    <linearGradient id="hdr" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0D9488"/>
      <stop offset="1" stop-color="#142c3c"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <path d="M0,28 A28,28 0 0 1 28,0 H${W - 28} A28,28 0 0 1 ${W},28 V${headerH} H0 Z" fill="url(#hdr)"/>
  <text x="${cx}" y="48" text-anchor="middle" font-family="${SANS}" font-size="12" font-weight="700" letter-spacing="4" fill="#ffffff" fill-opacity="0.75">TIKET MASUK</text>
  ${titleLines
    .map(
      (line, i) =>
        `<text x="${cx}" y="${86 + i * 38}" text-anchor="middle" font-family="${SERIF}" font-size="${titleSize}" font-weight="700" fill="#ffffff">${esc(line)}</text>`,
    )
    .join("\n  ")}
  <text x="${cx}" y="${headerH - 22}" text-anchor="middle" font-family="${SANS}" font-size="13" fill="#ffffff" fill-opacity="0.8">undangane.id</text>
  ${body.join("\n  ")}
</svg>`;

  return sharp(Buffer.from(svg), { density: 144 }).png().toBuffer();
}
