import { config } from "dotenv";
config();
import { db, schema } from "../src/db/index";

async function main() {
  const cats = await db.select().from(schema.categories);
  const catMap = Object.fromEntries(cats.map((c) => [c.id, c.slug]));
  const rows = await db.select().from(schema.templates);
  for (const r of rows) {
    console.log([r.slug, r.name, catMap[r.categoryId], r.status, r.previewImageKey ?? "NULL"].join(" | "));
  }
  console.log("TOTAL", rows.length);
  process.exit(0);
}
main();
