import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { getSessionWithRoles } from "@/auth/guard";
import { getInvitationForActor } from "@/modules/invitations/server";
import {
  isAllowedMediaMime,
  MEDIA_MAX_BYTES,
  MEDIA_MIME_EXT,
  mediaPublicUrl,
  putObject,
  sha256,
} from "@/modules/media/storage";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const auth = await getSessionWithRoles();
  if (!auth) return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  const { id } = await ctx.params;

  const invitation = await getInvitationForActor(id, auth.session.user.id, auth.isAdmin);
  if (!invitation) return NextResponse.json({ error: "Undangan tidak ditemukan" }, { status: 404 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
  }
  if (!isAllowedMediaMime(file.type)) {
    return NextResponse.json(
      { error: "Format tidak didukung (jpg, png, webp, gif)" },
      { status: 415 },
    );
  }
  if (file.size > MEDIA_MAX_BYTES) {
    return NextResponse.json({ error: "Ukuran maksimal 15MB" }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = MEDIA_MIME_EXT[file.type];
  const key = `u/${auth.session.user.id}/${crypto.randomUUID()}.${ext}`;

  await putObject(key, buffer, file.type);

  await db.insert(schema.mediaAssets).values({
    id: crypto.randomUUID(),
    ownerId: auth.session.user.id,
    key,
    mime: file.type,
    bytes: file.size,
    sha256: sha256(buffer),
    purpose: "invitation",
    scanStatus: "clean",
  });

  return NextResponse.json({ url: mediaPublicUrl(key), key, bytes: file.size }, { status: 201 });
}
