import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { config } from "dotenv";
config();

import { db, schema } from "./index";
import { TEMPLATE_REGISTRY, getTemplate } from "../modules/invitation/templates";

const DEFAULT_SETTINGS: Record<string, unknown> = {
  "guest.auto_create.per_ip_per_hour": 10,
  "guest.max_per_invitation": 1000,
  "invitation.default_validity_days": 365,
  "reseller.upgrade_price_idr": 50000,
  "reseller.upgrade_enabled": true,
};

const DEFAULT_PRICING: Array<{ accountType: "user" | "reseller"; amountIdr: number }> = [
  { accountType: "user", amountIdr: 15000 },
  { accountType: "reseller", amountIdr: 10000 },
];

const CATEGORIES: Array<{ slug: string; nameId: string; sort: number }> = [
  { slug: "pernikahan", nameId: "Pernikahan", sort: 1 },
  { slug: "tunangan", nameId: "Tunangan", sort: 2 },
  { slug: "ulang-tahun", nameId: "Ulang Tahun", sort: 3 },
  { slug: "aqiqah", nameId: "Aqiqah", sort: 4 },
  { slug: "khitanan", nameId: "Khitanan", sort: 5 },
  { slug: "keluarga", nameId: "Keluarga", sort: 6 },
  { slug: "seminar", nameId: "Seminar", sort: 7 },
  { slug: "syukuran", nameId: "Syukuran", sort: 8 },
];

async function seedSettings() {
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await db
      .insert(schema.settings)
      .values({ key, value })
      .onConflictDoNothing({ target: schema.settings.key });
  }
  console.log(`✓ settings (${Object.keys(DEFAULT_SETTINGS).length})`);
}

async function seedPricingRules() {
  for (const rule of DEFAULT_PRICING) {
    const existing = await db
      .select()
      .from(schema.pricingRules)
      .where(eq(schema.pricingRules.accountType, rule.accountType))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(schema.pricingRules).values({
        accountType: rule.accountType,
        amountIdr: rule.amountIdr,
        active: true,
      });
    }
  }
  console.log(`✓ pricing_rules (${DEFAULT_PRICING.length})`);
}

async function seedCategories() {
  for (const cat of CATEGORIES) {
    await db
      .insert(schema.categories)
      .values(cat)
      .onConflictDoNothing({ target: schema.categories.slug });
  }
  console.log(`✓ categories (${CATEGORIES.length})`);
}

/** Nama kategori (nameId) → slug kategori (lihat CATEGORIES di atas). */
const categorySlug = (name: string) => name.toLowerCase().replace(/\s+/g, "-");

const DEMO_INVITATIONS = [
  { slug: "dinda-raka", templateSlug: "siraman-floral" },
  { slug: "ayu-pratama", templateSlug: "modern-minimal" },
  { slug: "nadia-farhan", templateSlug: "royal-gold" },
  { slug: "salsa-bima", templateSlug: "rustic-outdoor" },
  { slug: "fatimah-umar", templateSlug: "islamic-geometric" },
  { slug: "kirana-galih", templateSlug: "pastel-garden" },
] as const;

async function seedTemplates() {
  let sort = 1;
  for (const def of Object.values(TEMPLATE_REGISTRY)) {
    const cat = await db
      .select({ id: schema.categories.id })
      .from(schema.categories)
      .where(eq(schema.categories.slug, categorySlug(def.category)))
      .limit(1);
    if (cat.length === 0) {
      console.warn(`  ! kategori "${def.category}" belum ada — template ${def.slug} dilewati`);
      continue;
    }
    const existing = await db
      .select({ id: schema.templates.id })
      .from(schema.templates)
      .where(eq(schema.templates.slug, def.slug))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(schema.templates).values({
        id: crypto.randomUUID(),
        slug: def.slug,
        name: def.name,
        categoryId: cat[0]!.id,
        description: def.description,
        previewImageKey: def.previewImage,
        styleTags: [def.category, def.layout, def.signature],
        status: "active",
        sort: sort++,
      });
    }
  }
  console.log(`✓ templates (${Object.keys(TEMPLATE_REGISTRY).length})`);
}

async function seedDemoInvitations() {
  const ownerEmail = "demo@undangane.id";
  let owner = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, ownerEmail))
    .limit(1);
  if (owner.length === 0) {
    const created = await db
      .insert(schema.users)
      .values({
        id: crypto.randomUUID(),
        email: ownerEmail,
        name: "Demo UndanganE",
        emailVerified: true,
        type: "user",
        status: "active",
      })
      .returning({ id: schema.users.id });
    owner = created;
  }

  for (const demo of DEMO_INVITATIONS) {
    const def = getTemplate(demo.templateSlug);
    if (!def) continue;
    const [tpl] = await db
      .select({ id: schema.templates.id })
      .from(schema.templates)
      .where(eq(schema.templates.slug, demo.templateSlug))
      .limit(1);
    if (!tpl) continue;

    const existing = await db
      .select({ id: schema.invitations.id })
      .from(schema.invitations)
      .where(eq(schema.invitations.slug, demo.slug))
      .limit(1);
    if (existing.length > 0) {
      await db
        .update(schema.invitations)
        .set({ config: def.demo, status: "active", eventType: "pernikahan", updatedAt: new Date() })
        .where(eq(schema.invitations.id, existing[0]!.id));
      continue;
    }

    await db.insert(schema.invitations).values({
      id: crypto.randomUUID(),
      ownerId: owner[0]!.id,
      templateId: tpl.id,
      slug: demo.slug,
      eventType: "pernikahan",
      status: "active",
      config: def.demo,
      publishedAt: new Date(),
    });
  }
  console.log(`✓ demo invitations (${DEMO_INVITATIONS.length} → /i/<slug>)`);
}

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    console.log("· admin dilewati (set SEED_ADMIN_EMAIL & SEED_ADMIN_PASSWORD untuk membuat)");
    return;
  }
  const existing = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email.toLowerCase()))
    .limit(1);
  if (existing.length > 0) {
    console.log("· admin sudah ada");
    return;
  }
  const user = await db
    .insert(schema.users)
    .values({
      id: crypto.randomUUID(),
      email: email.toLowerCase(),
      name: process.env.SEED_ADMIN_NAME ?? "Admin",
      emailVerified: true,
      type: "user",
      status: "active",
    })
    .returning();

  await db.insert(schema.accounts).values({
    id: crypto.randomUUID(),
    accountId: user[0]!.id,
    providerId: "credential",
    userId: user[0]!.id,
    password: await hashPassword(password),
  });

  await db.insert(schema.userRoles).values({
    id: crypto.randomUUID(),
    userId: user[0]!.id,
    role: "admin",
  });

  console.log(`✓ admin ${email}`);
}

/** Akun demo dev (hapus sebelum GA — lihat docs/05): semua bisa dipakai login. */
const DEMO_USERS: Array<{ email: string; name: string; role: "admin" | "reseller" | "user" }> = [
  { email: "admin@undangane.id", name: "Admin UndanganE", role: "admin" },
  { email: "reseller@undangane.id", name: "Reseller Demo", role: "reseller" },
  { email: "user@undangane.id", name: "Pengguna Demo", role: "user" },
  { email: "demo@undangane.id", name: "Demo UndanganE", role: "user" },
];

async function seedDemoUsers() {
  const password = process.env.SEED_DEMO_PASSWORD ?? "password12345";
  for (const u of DEMO_USERS) {
    let [user] = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, u.email))
      .limit(1);
    if (!user) {
      const created = await db
        .insert(schema.users)
        .values({
          id: crypto.randomUUID(),
          email: u.email,
          name: u.name,
          emailVerified: true,
          type: u.role === "reseller" ? "reseller" : "user",
          status: "active",
        })
        .returning({ id: schema.users.id });
      user = created[0]!;
    }

    const creds = await db
      .select({ providerId: schema.accounts.providerId })
      .from(schema.accounts)
      .where(eq(schema.accounts.userId, user.id))
      .limit(10);
    if (!creds.some((c) => c.providerId === "credential")) {
      await db.insert(schema.accounts).values({
        id: crypto.randomUUID(),
        accountId: user.id,
        providerId: "credential",
        userId: user.id,
        password: await hashPassword(password),
      });
    }

    const roles = await db
      .select({ role: schema.userRoles.role })
      .from(schema.userRoles)
      .where(eq(schema.userRoles.userId, user.id));
    const needed = u.role === "reseller" ? ["user", "reseller"] : [u.role];
    for (const role of needed) {
      if (!roles.some((r) => r.role === role)) {
        await db.insert(schema.userRoles).values({
          id: crypto.randomUUID(),
          userId: user.id,
          role: role as "admin" | "reseller" | "user",
        });
      }
    }
    console.log(`✓ demo user ${u.email} [${needed.join(", ")}]`);
  }
  console.log(`  password demo: ${password} (override: SEED_DEMO_PASSWORD)`);
}

async function main() {
  console.log("Seeding…");
  await seedSettings();
  await seedPricingRules();
  await seedCategories();
  await seedTemplates();
  await seedDemoInvitations();
  await seedDemoUsers();
  await seedAdmin();
  console.log("Selesai.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
