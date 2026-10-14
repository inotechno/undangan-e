import crypto from "node:crypto";

const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const TAG_LEN = 16;
const PREFIX = "enc:v1:";

function getKey(): Buffer | null {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) return null;
  // Terima hex (64 chars) atau base64
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, "hex");
  try {
    const b = Buffer.from(raw, "base64");
    if (b.length === 32) return b;
  } catch {
    /* fallthrough */
  }
  // Derive dari string bebas (PBKDF2 → 32 bytes)
  return crypto.pbkdf2Sync(raw, "undangane-salt", 100_000, 32, "sha256");
}

export function encryptValue(plain: string): string {
  if (!plain) return plain;
  // Sudah ter-encrypt → return as-is
  if (plain.startsWith(PREFIX)) return plain;
  const key = getKey();
  if (!key) return plain; // tanpa ENCRYPTION_KEY → plain text (dev)

  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptValue(stored: string): string {
  if (!stored) return stored;
  if (!stored.startsWith(PREFIX)) return stored; // plain text lama
  const key = getKey();
  if (!key) return stored; // tidak bisa decrypt tanpa key

  try {
    const data = Buffer.from(stored.slice(PREFIX.length), "base64");
    const iv = data.subarray(0, IV_LEN);
    const tag = data.subarray(IV_LEN, IV_LEN + TAG_LEN);
    const enc = data.subarray(IV_LEN + TAG_LEN);
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
  } catch (e) {
    console.error("[crypto] decrypt failed — ENCRYPTION_KEY mungkin berubah?", e instanceof Error ? e.message : e);
    return "";
  }
}

/** Apakah value sudah ter-encrypt? */
export function isEncrypted(value: string): boolean {
  return value.startsWith(PREFIX);
}
