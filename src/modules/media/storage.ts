import { createHash } from "crypto";
import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { env } from "@/core/config";

const r2Configured = Boolean(
  env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET,
);

let r2Client: S3Client | null = null;

function getR2(): S3Client {
  if (!r2Client) {
    r2Client = new S3Client({
      region: "auto",
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID ?? "",
        secretAccessKey: env.R2_SECRET_ACCESS_KEY ?? "",
      },
    });
  }
  return r2Client;
}

function localDir(): string {
  return process.env.UPLOAD_DIR ?? path.join(process.cwd(), ".uploads");
}

function localPath(key: string): string {
  // key sudah divalidasi pola `u/<uuid>.<ext>` — aman digabung
  return path.join(/* turbopackIgnore: true */ localDir(), ...key.split("/"));
}

export function sha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export async function putObject(key: string, buffer: Buffer, mime: string): Promise<void> {
  if (r2Configured) {
    await getR2().send(
      new PutObjectCommand({
        Bucket: env.R2_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: mime,
      }),
    );
    return;
  }
  const target = localPath(key);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, buffer);
}

export async function getObject(
  key: string,
): Promise<{ body: Buffer; mime: string } | null> {
  if (r2Configured) {
    const res = await getR2().send(new GetObjectCommand({ Bucket: env.R2_BUCKET, Key: key }));
    if (!res.Body) return null;
    const bytes = await res.Body.transformToByteArray();
    return { body: Buffer.from(bytes), mime: res.ContentType ?? "application/octet-stream" };
  }
  try {
    const body = await readFile(localPath(key));
    return { body, mime: guessMime(key) };
  } catch {
    return null;
  }
}

export async function deleteObject(key: string): Promise<void> {
  if (r2Configured) {
    await getR2().send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET, Key: key }));
    return;
  }
  try {
    await unlink(localPath(key));
  } catch {
    /* file mungkin sudah tidak ada */
  }
}

function guessMime(key: string): string {
  const ext = key.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "mp4":
      return "video/mp4";
    default:
      return "application/octet-stream";
  }
}

/** URL relatif yang selalu bisa diakses (R2 publik/domain custom bisa disambung nanti). */
export function mediaPublicUrl(key: string): string {
  return `/api/media/${key}`;
}

export const MEDIA_MAX_BYTES = 15 * 1024 * 1024;

export const MEDIA_MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function isAllowedMediaMime(mime: string): mime is keyof typeof MEDIA_MIME_EXT {
  return mime in MEDIA_MIME_EXT;
}

export { r2Configured };
