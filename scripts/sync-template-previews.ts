import { config } from "dotenv";
config();
import { db, schema } from "../src/db/index";
import { TEMPLATE_REGISTRY } from "../src/modules/invitation/templates";
import { eq } from "drizzle-orm";

async function main() {
  let updated = 0;
  for (const def of Object.values(TEMPLATE_REGISTRY)) {
    const [row] = await db
      .select({ id: schema.templates.id, preview: schema.templates.previewImageKey, desc: schema.templates.description })
      .from(schema.templates)
      .where(eq(schema.templates.slug, def.slug))
      .limit(1);
    if (!row) {
      console.warn(`! ${def.slug} tidak ada di DB (jalankan db:seed)`);
      continue;
    }
    if (row.preview !== def.previewImage || row.desc !== def.description) {
      await db
        .update(schema.templates)
        .set({ previewImageKey: def.previewImage, description: def.description, updatedAt: new Date() })
        .where(eq(schema.templates.id, row.id));
      updated++;
      console.log(`~ ${def.slug} preview/deskripsi disinkronkan`);
    }
  }
  console.log(`Selesai. ${updated} baris diperbarui.`);
  process.exit(0);
}
main();
