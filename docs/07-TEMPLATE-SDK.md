# 07 — Template SDK (Kontrak — persiapan fase kontributor)

> Status: **desain disimpan, tidak dieksekusi di MVP** (template internal). Kontrak ini menjaga agar katalog internal tidak mengunci jalan ke kontributor nanti.

## 1. Tujuan
Memungkinkan pihak ketiga menulis layout React/TypeScript yang berjalan **terisolasi** dari aplikasi, dengan data & API terbatas (allowlist capability).

## 2. Paket (fase nanti)
`@undangane/template-sdk` — types, schema data, komponen bisnis; `create-undangane-template` — starter + mock data.

## 3. Kontrak inti
```ts
export interface TemplateManifest {
  sdkVersion: string;            // "^1.0.0"
  capabilities: Array<'rsvp'|'guestbook'|'music'|'gallery'|'countdown'|'gift'|'maps'>;
  sections: string[];
  entry: string;
}
export interface TemplateProps {
  data: PublicInvitationData;    // Zod schema milik UndanganE (additive-only per minor)
  guest?: { name: string; quota: number; code: string };
  theme: ThemeTokens;
  api: TemplateApi;              // hanya method yang ada di capabilities
}
export type TemplateModule = {
  manifest: TemplateManifest;
  default: React.ComponentType<TemplateProps>;
};
```

## 4. Aturan isolasi (ringkas — detail `08`)
- Build di container ephemeral: network none, tanpa secrets, CPU/mem/time limit.
- Bundle di-hash → R2 immutable; hanya versi approve yang dipublikasikan.
- Runtime: sandboxed iframe origin `tpl.` + CSP ketat + postMessage tervalidasi; mutasi lewat relay trusted parent dengan capability token singkat.
- Dilarang: `eval`, `fetch` bebas, akses cookie/storage aplikasi, `node:*`.
- RSVP/tamu/pembayaran/QR tetap di backend terpercaya.

## 5. Versi SDK
- Semver; `template_versions.sdk_version` di-pin. Publish patch security dengan visual identik.
- Breaking change SDK = major + guide migrasi + template versi baru; undangan terbit tidak otomatis pindah.

## 6. Catatan SEO
Layout kontributor nanti dirender via iframe → SEO undangan kontributor lebih lemah dari first-party SSR. Mitigasi: shell halaman (title/meta/OG) tetap SSR dari data undangan; konten kaya ada di dalam iframe. First-party (MVP) selalu SSR penuh.
