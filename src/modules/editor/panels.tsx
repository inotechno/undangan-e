"use client";

import { Calendar, Heart, Image as ImageIcon, Megaphone, Palette, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  EVENT_TYPES,
  SECTION_IDS,
  type InvitationConfig,
  type SectionId,
} from "@/modules/invitation";
import {
  ColorField,
  MediaField,
  SelectField,
  TextAreaField,
  TextField,
} from "./fields";
import { LocationPicker } from "./location-picker";

export interface PanelProps {
  invitationId: string;
  config: InvitationConfig;
  mutate: (fn: (draft: InvitationConfig) => void) => void;
}

const pad = (n: number) => String(n).padStart(2, "0");

export function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function setEvent(config: InvitationConfig, patch: Partial<InvitationConfig["event"]>) {
  Object.assign(config.event, patch);
}

/* ── Tab: Acara ──────────────────────────────────────────── */

const COUPLE_TYPES = new Set(["pernikahan", "tunangan"]);
const CELEBRANT_TYPES = new Set(["ulang-tahun", "aqiqah", "khitanan"]);

export function AcaraPanel({ invitationId, config, mutate }: PanelProps) {
  const event = config.event;
  const showCouple = COUPLE_TYPES.has(event.type);
  const showCelebrant = CELEBRANT_TYPES.has(event.type);
  const couple = event.couple ?? { brideName: "", groomName: "" };

  return (
    <div className="space-y-5">
      <SelectField
        label="Jenis acara"
        value={event.type}
        onChange={(v) =>
          mutate((c) => setEvent(c, { type: v as InvitationConfig["event"]["type"] }))
        }
        options={EVENT_TYPES.map((t) => ({ value: t, label: t.replace("-", " ") }))}
      />
      <TextField
        label="Judul undangan (opsional)"
        value={event.title ?? ""}
        onChange={(v) => mutate((c) => setEvent(c, { title: v || undefined }))}
        placeholder="The Wedding of"
        hint="Tampilan kecil di sampul; kosongkan untuk default template."
      />
      <TextField
        label="Tanggal & waktu acara"
        type="datetime-local"
        value={toLocalInput(event.date)}
        onChange={(v) => {
          if (v) mutate((c) => setEvent(c, { date: new Date(v).toISOString() }));
        }}
      />
      <MediaField
        label="Foto sampul"
        invitationId={invitationId}
        value={event.photo ?? config.seo.coverImage ?? ""}
        onChange={(v) =>
          mutate((c) => {
            c.event.photo = v || undefined;
            c.seo.coverImage = v || undefined;
          })
        }
        hint="Direkomendasikan minimal 1200×800 px."
      />

      {showCouple ? (
        <div className="space-y-4 rounded-xl border border-border-warm p-4">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <Heart className="size-4 text-teal" aria-hidden />
            Nama pasangan
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Nama mempelai wanita"
              value={couple.brideName}
              onChange={(v) =>
                mutate((c) => {
                  c.event.couple = { ...couple, ...c.event.couple, brideName: v };
                })
              }
            />
            <TextField
              label="Nama mempelai pria"
              value={couple.groomName}
              onChange={(v) =>
                mutate((c) => {
                  c.event.couple = { ...couple, ...c.event.couple, groomName: v };
                })
              }
            />
            <TextField
              label="Orang tua mempelai wanita"
              value={couple.brideParents ?? ""}
              onChange={(v) =>
                mutate((c) => {
                  c.event.couple = { ...couple, ...c.event.couple, brideParents: v || undefined };
                })
              }
              placeholder="Putri dari Bapak … & Ibu …"
            />
            <TextField
              label="Orang tua mempelai pria"
              value={couple.groomParents ?? ""}
              onChange={(v) =>
                mutate((c) => {
                  c.event.couple = { ...couple, ...c.event.couple, groomParents: v || undefined };
                })
              }
              placeholder="Putra dari Bapak … & Ibu …"
            />
          </div>
          <TextField
            label="Hashtag"
            value={couple.hashtag ?? ""}
            onChange={(v) =>
              mutate((c) => {
                c.event.couple = { ...couple, ...c.event.couple, hashtag: v || undefined };
              })
            }
            placeholder="#DindaRaka2026"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <MediaField
              label="Foto mempelai wanita"
              invitationId={invitationId}
              value={couple.bridePhoto ?? ""}
              onChange={(v) =>
                mutate((c) => {
                  c.event.couple = { ...couple, ...c.event.couple, bridePhoto: v || undefined };
                })
              }
              hint="Opsional — tampil sesuai desain template."
            />
            <MediaField
              label="Foto mempelai pria"
              invitationId={invitationId}
              value={couple.groomPhoto ?? ""}
              onChange={(v) =>
                mutate((c) => {
                  c.event.couple = { ...couple, ...c.event.couple, groomPhoto: v || undefined };
                })
              }
              hint="Opsional — tampil sesuai desain template."
            />
          </div>
        </div>
      ) : null}

      {showCelebrant ? (
        <div className="space-y-4 rounded-xl border border-border-warm p-4">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <Megaphone className="size-4 text-teal" aria-hidden />
            Yang berulang tahun / dirayakan
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Nama"
              value={event.celebrant?.name ?? ""}
              onChange={(v) =>
                mutate((c) => {
                  c.event.celebrant = { name: v, age: c.event.celebrant?.age };
                })
              }
            />
            <TextField
              label="Usia (opsional)"
              type="number"
              value={String(event.celebrant?.age ?? "")}
              onChange={(v) =>
                mutate((c) => {
                  c.event.celebrant = { name: c.event.celebrant?.name ?? "", age: v ? Number(v) : undefined };
                })
              }
            />
          </div>
        </div>
      ) : null}

      {!showCouple && !showCelebrant ? (
        <div className="space-y-4 rounded-xl border border-border-warm p-4">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <Megaphone className="size-4 text-teal" aria-hidden />
            Nama tuan rumah / penyelenggara
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Nama"
              value={event.host?.name ?? ""}
              onChange={(v) =>
                mutate((c) => {
                  c.event.host = { name: v, role: c.event.host?.role };
                })
              }
            />
            <TextField
              label="Peran (opsional)"
              value={event.host?.role ?? ""}
              onChange={(v) =>
                mutate((c) => {
                  c.event.host = { name: c.event.host?.name ?? "", role: v || undefined };
                })
              }
              placeholder="Keluarga besar / Panitia"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ── Tab: Jadwal ─────────────────────────────────────────── */

export function JadwalPanel({ config, mutate }: PanelProps) {
  const schedules = config.event.schedules;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          <Calendar className="size-4 text-teal" aria-hidden />
          Jadwal &amp; lokasi ({schedules.length})
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            mutate((c) => {
              c.event.schedules.push({
                title: `Acara ${c.event.schedules.length + 1}`,
                start: c.event.date,
                venue: "",
              });
            })
          }
        >
          <Plus className="size-3.5" aria-hidden />
          Tambah
        </Button>
      </div>

      {schedules.length === 0 ? (
        <p className="text-muted-warm rounded-lg border border-dashed p-6 text-center text-sm">
          Belum ada jadwal. Tambahkan akad/resepsi agar tamu tahu waktunya.
        </p>
      ) : null}

      {schedules.map((schedule, i) => {
        const startMs = schedule.start ? new Date(schedule.start).getTime() : NaN;
        const endMs = schedule.end ? new Date(schedule.end).getTime() : NaN;
        const endInvalid = schedule.end && !Number.isNaN(startMs) && !Number.isNaN(endMs) && endMs <= startMs;
        return (
        <div key={i} className="space-y-3 rounded-xl border border-border-warm p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold tracking-wider uppercase opacity-60">Acara {i + 1}</p>
            <button
              type="button"
              onClick={() => mutate((c) => void c.event.schedules.splice(i, 1))}
              className="text-muted-warm hover:text-red-600"
              aria-label={`Hapus acara ${i + 1}`}
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Nama acara"
              value={schedule.title}
              onChange={(v) => mutate((c) => void (c.event.schedules[i]!.title = v))}
            />
            <TextField
              label="Waktu mulai"
              type="datetime-local"
              value={toLocalInput(schedule.start)}
              onChange={(v) =>
                mutate((c) => {
                  if (v) c.event.schedules[i]!.start = new Date(v).toISOString();
                })
              }
            />
            <TextField
              label="Waktu selesai (opsional)"
              type="datetime-local"
              value={schedule.end ? toLocalInput(schedule.end) : ""}
              onChange={(v) =>
                mutate((c) => void (c.event.schedules[i]!.end = v ? new Date(v).toISOString() : undefined))
              }
              error={endInvalid ? "Waktu selesai harus melebihi waktu mulai" : undefined}
            />
            <TextField
              label="Nama tempat"
              value={schedule.venue}
              onChange={(v) => mutate((c) => void (c.event.schedules[i]!.venue = v))}
            />
            <TextField
              label="Alamat"
              value={schedule.address ?? ""}
              onChange={(v) => mutate((c) => void (c.event.schedules[i]!.address = v || undefined))}
              className="sm:col-span-2"
            />
            <LocationPicker
              lat={schedule.lat}
              lng={schedule.lng}
              onChange={(la, lo, label) =>
                mutate((c) => {
                  c.event.schedules[i]!.lat = la;
                  c.event.schedules[i]!.lng = lo;
                  if (la != null && lo != null) {
                    c.event.schedules[i]!.mapUrl = `https://www.google.com/maps?q=${la},${lo}`;
                    if (label && !c.event.schedules[i]!.address) c.event.schedules[i]!.address = label;
                  }
                })
              }
            />
            <TextField
              label="Tautan Google Maps"
              value={schedule.mapUrl ?? ""}
              onChange={(v) => mutate((c) => void (c.event.schedules[i]!.mapUrl = v || undefined))}
              placeholder="https://maps.google.com/…"
              className="sm:col-span-2"
            />
          </div>
        </div>
        );
      })}
    </div>
  );
}

/* ── Tab: Konten (cerita + galeri) ───────────────────────── */

export function KontenPanel({ invitationId, config, mutate }: PanelProps) {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <ImageIcon className="size-4 text-teal" aria-hidden />
            Kisah cinta / perjalanan ({config.story.length})
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              mutate((c) => c.story.push({ title: "Kisah baru", text: "" }))
            }
          >
            <Plus className="size-3.5" aria-hidden />
            Tambah
          </Button>
        </div>
        {config.story.map((item, i) => (
          <div key={i} className="space-y-3 rounded-xl border border-border-warm p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold tracking-wider uppercase opacity-60">Kisah {i + 1}</p>
              <button
                type="button"
                onClick={() => mutate((c) => void c.story.splice(i, 1))}
                className="text-muted-warm hover:text-red-600"
                aria-label={`Hapus kisah ${i + 1}`}
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField
                label="Tahun (opsional)"
                value={item.year ?? ""}
                onChange={(v) => mutate((c) => void (c.story[i]!.year = v || undefined))}
              />
              <TextField
                label="Judul"
                value={item.title}
                onChange={(v) => mutate((c) => void (c.story[i]!.title = v))}
              />
            </div>
            <TextAreaField
              label="Cerita singkat"
              value={item.text}
              onChange={(v) => mutate((c) => void (c.story[i]!.text = v))}
              rows={2}
            />
            <MediaField
              label="Foto pendukung (opsional)"
              invitationId={invitationId}
              value={item.image ?? ""}
              onChange={(v) => mutate((c) => void (c.story[i]!.image = v || undefined))}
            />
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <ImageIcon className="size-4 text-teal" aria-hidden />
            Galeri foto ({config.gallery.length})
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              mutate((c) => c.gallery.push({ image: "", caption: "" }))
            }
            disabled={config.gallery.length >= 12}
          >
            <Plus className="size-3.5" aria-hidden />
            Tambah foto
          </Button>
        </div>
        {config.gallery.length === 0 ? (
          <p className="text-muted-warm rounded-lg border border-dashed p-6 text-center text-sm">
            Belum ada foto di galeri.
          </p>
        ) : null}
        {config.gallery.map((item, i) => (
          <div key={i} className="space-y-3 rounded-xl border border-border-warm p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold tracking-wider uppercase opacity-60">Foto {i + 1}</p>
              <button
                type="button"
                onClick={() => mutate((c) => void c.gallery.splice(i, 1))}
                className="text-muted-warm hover:text-red-600"
                aria-label={`Hapus foto ${i + 1}`}
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </div>
            <MediaField
              label="Foto"
              invitationId={invitationId}
              value={item.image}
              onChange={(v) => mutate((c) => void (c.gallery[i]!.image = v))}
            />
            <TextField
              label="Keterangan (opsional)"
              value={item.caption ?? ""}
              onChange={(v) => mutate((c) => void (c.gallery[i]!.caption = v || undefined))}
            />
          </div>
        ))}
      </section>
    </div>
  );
}

/* ── Tab: Hadiah & Musik ─────────────────────────────────── */

export function HadiahMusikPanel({ config, mutate }: PanelProps) {
  const gift = config.gift;
  const music = config.music;

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-xl border border-border-warm p-4">
        <label className="flex items-center gap-2.5 text-sm font-semibold">
          <input
            type="checkbox"
            checked={gift.enabled}
            onChange={(e) => mutate((c) => void (c.gift.enabled = e.target.checked))}
            className="size-4 accent-[#0D9488]"
          />
          Tampilkan Wedding Gift (amplop digital)
        </label>
        {gift.enabled ? (
          <>
            <TextAreaField
              label="Instruksi untuk tamu"
              value={gift.instructions ?? ""}
              onChange={(v) => mutate((c) => void (c.gift.instructions = v || undefined))}
              rows={2}
            />
            {gift.accounts.map((acc, i) => (
              <div key={i} className="space-y-3 rounded-lg border border-border-warm p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase opacity-60">Rekening {i + 1}</p>
                  <button
                    type="button"
                    onClick={() => mutate((c) => void c.gift.accounts.splice(i, 1))}
                    className="text-muted-warm hover:text-red-600"
                    aria-label={`Hapus rekening ${i + 1}`}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <TextField
                    label="Bank / e-wallet"
                    value={acc.bank}
                    onChange={(v) => mutate((c) => void (c.gift.accounts[i]!.bank = v))}
                  />
                  <TextField
                    label="Nomor"
                    value={acc.number}
                    onChange={(v) => mutate((c) => void (c.gift.accounts[i]!.number = v))}
                  />
                  <TextField
                    label="Atas nama"
                    value={acc.holder}
                    onChange={(v) => mutate((c) => void (c.gift.accounts[i]!.holder = v))}
                  />
                </div>
              </div>
            ))}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                mutate((c) => c.gift.accounts.push({ bank: "BCA", number: "", holder: "" }))
              }
            >
              <Plus className="size-3.5" aria-hidden />
              Tambah rekening
            </Button>
          </>
        ) : null}
      </section>

      <section className="space-y-4 rounded-xl border border-border-warm p-4">
        <label className="flex items-center gap-2.5 text-sm font-semibold">
          <input
            type="checkbox"
            checked={music.enabled}
            onChange={(e) => mutate((c) => void (c.music.enabled = e.target.checked))}
            className="size-4 accent-[#0D9488]"
          />
          Musik latar (tamu menekan tombol putar)
        </label>
        {music.enabled ? (
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-semibold">Pilihan musik</Label>
              <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
                {[
                  { label: "SoundHelix Song 1", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
                  { label: "SoundHelix Song 2", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
                  { label: "SoundHelix Song 3", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
                  { label: "SoundHelix Song 4", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
                ].map((p) => (
                  <button
                    key={p.url}
                    type="button"
                    onClick={() => mutate((c) => void (c.music.track = p.url))}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-left text-[11px] font-semibold transition-colors",
                      music.track === p.url
                        ? "border-teal bg-teal-soft text-teal-dark"
                        : "border-border-warm text-[#536477] hover:border-teal/50",
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <TextField
              label="Atau masukkan URL musik sendiri"
              value={music.track ?? ""}
              onChange={(v) => mutate((c) => void (c.music.track = v || undefined))}
              placeholder="https://…/lagu.mp3 atau link YouTube"
              hint="Mendukung: file MP3 langsung ATAU link YouTube (watch / youtu.be). Musik berlisensi saja."
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}

/* ── Tab: Desain ─────────────────────────────────────────── */

const SECTION_LABELS: Record<SectionId, string> = {
  cover: "Sampul",
  couple: "Nama pasangan / tuan rumah",
  countdown: "Hitung mundur",
  event_info: "Info acara",
  schedule_maps: "Jadwal & peta",
  story: "Kisah",
  gallery: "Galeri",
  gift: "Wedding gift",
  rsvp: "RSVP (butuh tautan tamu)",
  guestbook: "Buku tamu",
  wishes_list: "Ucapan tamu",
  qr_pass: "Kartu QR tamu",
  closing: "Penutup",
  music_player: "Tombol musik",
};

export function DesainPanel({ config, mutate }: PanelProps) {
  const theme = config.theme;

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-xl border border-border-warm p-4">
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          <Palette className="size-4 text-teal" aria-hidden />
          Warna tema
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <ColorField
            label="Latar"
            value={theme.palette.bg ?? "#FAF8F6"}
            onChange={(v) => mutate((c) => void (c.theme.palette.bg = v))}
          />
          <ColorField
            label="Kartu / permukaan"
            value={theme.palette.surface ?? "#FFFFFF"}
            onChange={(v) => mutate((c) => void (c.theme.palette.surface = v))}
          />
          <ColorField
            label="Teks"
            value={theme.palette.text ?? "#373C3F"}
            onChange={(v) => mutate((c) => void (c.theme.palette.text = v))}
          />
          <ColorField
            label="Aksen"
            value={theme.palette.accent ?? "#0D9488"}
            onChange={(v) => mutate((c) => void (c.theme.palette.accent = v))}
          />
          <ColorField
            label="Aksen lembut"
            value={theme.palette.accentSoft ?? "#E6F5F2"}
            onChange={(v) => mutate((c) => void (c.theme.palette.accentSoft = v))}
          />
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border-warm p-4">
        <p className="text-sm font-semibold">Tipografi &amp; gaya</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField
            label="Pasangan font"
            value={
              theme.fonts.heading?.includes("Georgia")
                ? "serif"
                : theme.fonts.heading?.includes("Montserrat")
                  ? "montserrat"
                  : "jakarta"
            }
            onChange={(v) =>
              mutate((c) => {
                const pairs: Record<string, { heading: string; body: string }> = {
                  serif: {
                    heading: 'Georgia, "Times New Roman", serif',
                    body: "var(--font-sans), ui-sans-serif, system-ui, sans-serif",
                  },
                  montserrat: {
                    heading: "var(--font-heading), var(--font-sans), sans-serif",
                    body: "var(--font-sans), ui-sans-serif, system-ui, sans-serif",
                  },
                  jakarta: {
                    heading: "var(--font-sans), ui-sans-serif, system-ui, sans-serif",
                    body: "var(--font-sans), ui-sans-serif, system-ui, sans-serif",
                  },
                };
                c.theme.fonts = pairs[v] ?? pairs.serif!;
              })
            }
            options={[
              { value: "serif", label: "Elegan (serif)" },
              { value: "montserrat", label: "Montserrat" },
              { value: "jakarta", label: "Jakarta modern" },
            ]}
          />
          <SelectField
            label="Ornamen"
            value={theme.decorations ?? "ornament"}
            onChange={(v) =>
              mutate(
                (c) =>
                  void (c.theme.decorations = v as NonNullable<
                    InvitationConfig["theme"]["decorations"]
                  >),
              )
            }
            options={[
              { value: "floral", label: "Floral" },
              { value: "geometric", label: "Geometris" },
              { value: "ornament", label: "Ornamen" },
              { value: "none", label: "Tanpa ornamen" },
            ]}
          />
          <SelectField
            label="Gaya animasi"
            value={theme.motion ?? "soft"}
            onChange={(v) =>
              mutate(
                (c) =>
                  void (c.theme.motion = v as NonNullable<InvitationConfig["theme"]["motion"]>),
              )
            }
            options={[
              { value: "soft", label: "Lembut" },
              { value: "playful", label: "Ceria" },
              { value: "elegant", label: "Elegan" },
            ]}
          />
        </div>
        <div>
          <Label className="text-xs font-semibold">Radius sudut: {theme.radius ?? 16}px</Label>
          <input
            type="range"
            min={0}
            max={32}
            value={theme.radius ?? 16}
            onChange={(e) => mutate((c) => void (c.theme.radius = Number(e.target.value)))}
            className="mt-2 w-full accent-[#0D9488]"
          />
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-border-warm p-4">
        <p className="text-sm font-semibold">Section yang ditampilkan</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {SECTION_IDS.map((id) => {
            const enabled = config.sections[id] !== false;
            return (
              <label key={id} className="flex items-center gap-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) =>
                    mutate((c) => void (c.sections[id] = e.target.checked))
                  }
                  className="size-4 accent-[#0D9488]"
                />
                {SECTION_LABELS[id]}
              </label>
            );
          })}
        </div>
        <p className="text-muted-warm text-[11px]">
          Section RSVP, buku tamu, dan kartu QR aktif ketika tamu membuka undangan lewat tautan
          personal (?kepada=nama&amp;g=kode).
        </p>
      </section>
    </div>
  );
}

/* ── Tab: SEO ────────────────────────────────────────────── */

export function SeoPanel({ invitationId, config, mutate }: PanelProps) {
  return (
    <div className="space-y-5">
      <TextField
        label="Judul SEO"
        value={config.seo.title ?? ""}
        onChange={(v) => mutate((c) => void (c.seo.title = v || undefined))}
        placeholder="Undangan Pernikahan Dinda & Raka"
        hint="Tampil di tab browser, Google, dan WhatsApp."
      />
      <TextAreaField
        label="Deskripsi SEO"
        value={config.seo.description ?? ""}
        onChange={(v) => mutate((c) => void (c.seo.description = v || undefined))}
        rows={3}
        placeholder="Undangan pernikahan Dinda & Raka, 12 Desember 2026 di Bandung…"
      />
      <MediaField
        label="Gambar social (OG image)"
        invitationId={invitationId}
        value={config.seo.coverImage ?? ""}
        onChange={(v) => mutate((c) => void (c.seo.coverImage = v || undefined))}
        hint="Rasio 1200×630 disarankan untuk pratinjau WhatsApp/Facebook."
      />
    </div>
  );
}
