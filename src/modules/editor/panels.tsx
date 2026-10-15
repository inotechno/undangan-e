"use client";

import {
  Calendar,
  Heart,
  Image as ImageIcon,
  Info as InfoIcon,
  Megaphone,
  Palette,
  Plus,
  Trash2,
  Video,
  Shield,
  BookOpen,
  Gift,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  EVENT_TYPES,
  SECTION_DEFAULT_LABELS,
  LABELABLE_SECTIONS,
  type InvitationConfig,
  type SectionId,
} from "@/modules/invitation";
import { SECTION_ORDER, SECTION_LABELS } from "@/modules/invitation/renderer";
import {
  ColorField,
  MediaField,
  SelectField,
  TextAreaField,
  TextField,
} from "./fields";
import { LocationPicker } from "./location-picker";
import { MusicPreview } from "./music-preview";

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

/* ── Tab: Acara (dasar) ──────────────────────────────────── */

const COUPLE_TYPES = new Set(["pernikahan", "tunangan"]);
const CELEBRANT_TYPES = new Set(["ulang-tahun", "aqiqah", "khitanan"]);

export function AcaraPanel({ invitationId, config, mutate }: PanelProps) {
  const event = config.event;

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
    </div>
  );
}

/* ── Tab: Mempelai / Tuan Rumah ──────────────────────────── */

export function MempelaiPanel({ invitationId, config, mutate }: PanelProps) {
  const event = config.event;
  const showCouple = COUPLE_TYPES.has(event.type);
  const showCelebrant = CELEBRANT_TYPES.has(event.type);
  const couple = event.couple ?? { brideName: "", groomName: "" };

  return (
    <div className="space-y-5">
      {showCouple ? (
        <div className="space-y-4">
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
        <div className="space-y-4">
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
        <div className="space-y-4">
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

/* ── Tab: Sampul ─────────────────────────────────────────── */

const COVER_STYLE_OPTIONS = [
  { value: "photo_overlay", label: "Foto penuh + overlay" },
  { value: "framed", label: "Foto berbingkai" },
  { value: "minimal", label: "Minimal (teks saja)" },
];

const FRAME_SHAPE_OPTIONS = [
  { value: "circle", label: "Lingkaran" },
  { value: "arch", label: "Arch (lengkung)" },
  { value: "rounded", label: "Persegi membulat" },
];

const ORIENTATION_OPTIONS = [
  { value: "horizontal", label: "Horizontal (A & B)" },
  { value: "vertical", label: "Vertikal (A di atas B)" },
];

export function CoverPanel({ config, mutate }: PanelProps) {
  const cover = config.cover ?? {};

  function setCover(patch: Partial<NonNullable<InvitationConfig["cover"]>>) {
    mutate((c) => {
      c.cover = { ...c.cover, ...patch };
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold">Tampilan sampul</p>
        <p className="text-muted-warm mt-0.5 text-[11px]">
          Atur gaya cover, foto berbingkai, orientasi nama, dan teks tamu.
        </p>
      </div>

      <SelectField
        label="Gaya sampul"
        value={cover.style ?? "photo_overlay"}
        onChange={(v) => setCover({ style: v as NonNullable<InvitationConfig["cover"]>["style"] })}
        options={COVER_STYLE_OPTIONS}
      />

      {cover.style === "framed" ? (
        <SelectField
          label="Bentuk frame foto"
          value={cover.frameShape ?? "circle"}
          onChange={(v) =>
            setCover({ frameShape: v as NonNullable<InvitationConfig["cover"]>["frameShape"] })
          }
          options={FRAME_SHAPE_OPTIONS}
        />
      ) : null}

      <SelectField
        label="Orientasi nama"
        value={cover.nameOrientation ?? "horizontal"}
        onChange={(v) =>
          setCover({ nameOrientation: v as NonNullable<InvitationConfig["cover"]>["nameOrientation"] })
        }
        options={ORIENTATION_OPTIONS}
      />

      <TextAreaField
        label="Kalimat pembuka (opsional)"
        value={cover.openingText ?? ""}
        onChange={(v) => setCover({ openingText: v || undefined })}
        placeholder="Tanpa mengurangi rasa hormat, kami mengundang…"
        hint="Tampil di bawah tanggal pada sampul."
        rows={3}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Kalimat sebelum nama tamu"
          value={cover.guestPreText ?? ""}
          onChange={(v) => setCover({ guestPreText: v || undefined })}
          placeholder="Kepada Yth."
        />
        <TextField
          label="Kalimat setelah nama tamu (opsional)"
          value={cover.guestPostText ?? ""}
          onChange={(v) => setCover({ guestPostText: v || undefined })}
          placeholder="di tempat"
        />
      </div>

      <div>
        <Label className="text-xs font-semibold">Jarak vertikal sampul</Label>
        <p className="text-muted-warm mt-0.5 mb-1.5 text-[11px]">
          Tambah ruang kosong di atas & bawah konten cover (0–100).
        </p>
        <input
          type="range"
          min={0}
          max={100}
          value={cover.spacing ?? 0}
          onChange={(e) => setCover({ spacing: Number(e.target.value) })}
          className="w-full accent-teal"
        />
        <p className="text-muted-warm mt-1 text-[11px]">{cover.spacing ?? 0}</p>
      </div>
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
            <MusicPreview track={music.track} />
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
    </div>
  );
}

/* ── Tab: Informasi (doa + info custom + prokes + adab) ──── */

export function InformasiPanel({ config, mutate }: PanelProps) {
  const doa = config.doa;
  const info = config.info;
  const prokes = config.prokes;
  const adab = config.adab;

  return (
    <div className="space-y-6">
      {/* Doa */}
      <section className="space-y-3 rounded-xl border border-border-warm p-4">
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          <BookOpen className="size-4 text-teal" aria-hidden />
          Doa pembuka
        </p>
        <TextAreaField
          label="Teks doa"
          value={doa.text ?? ""}
          onChange={(v) => mutate((c) => void (c.doa.text = v || undefined))}
          placeholder="Bismillahirrahmanirrahim…"
          hint="Tampil sebagai section terpisah. Kosongkan untuk sembunyikan."
          rows={3}
        />
      </section>

      {/* Info items */}
      <section className="space-y-3 rounded-xl border border-border-warm p-4">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <InfoIcon className="size-4 text-teal" aria-hidden />
            Info tambahan
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              mutate((c) => void c.info.items.push({ title: "", text: "" }))
            }
          >
            <Plus className="size-3.5" aria-hidden />
            Tambah
          </Button>
        </div>
        <p className="text-muted-warm text-[11px]">
          Informasi custom (dresscode, parkir, dll). Kosongkan semua untuk sembunyikan section.
        </p>
        {info.items.map((item, i) => (
          <div key={i} className="space-y-2 rounded-lg border border-border-warm p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold opacity-60">Item {i + 1}</p>
              <button
                type="button"
                onClick={() => mutate((c) => void c.info.items.splice(i, 1))}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="size-3.5" aria-hidden />
              </button>
            </div>
            <TextField
              label="Judul"
              value={item.title}
              onChange={(v) => mutate((c) => void (c.info.items[i]!.title = v))}
            />
            <TextAreaField
              label="Isi"
              value={item.text}
              onChange={(v) => mutate((c) => void (c.info.items[i]!.text = v))}
              rows={2}
            />
          </div>
        ))}
      </section>

      {/* Prokes */}
      <section className="space-y-3 rounded-xl border border-border-warm p-4">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <Shield className="size-4 text-teal" aria-hidden />
            Protokol kesehatan
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => mutate((c) => void c.prokes.items.push(""))}
          >
            <Plus className="size-3.5" aria-hidden />
            Tambah
          </Button>
        </div>
        {prokes.items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <TextField
              label=""
              value={item}
              onChange={(v) => mutate((c) => void (c.prokes.items[i] = v))}
              placeholder="Gunakan masker…"
            />
            <button
              type="button"
              onClick={() => mutate((c) => void c.prokes.items.splice(i, 1))}
              className="mt-6 text-red-500 hover:text-red-700"
            >
              <Trash2 className="size-3.5" aria-hidden />
            </button>
          </div>
        ))}
      </section>

      {/* Adab */}
      <section className="space-y-3 rounded-xl border border-border-warm p-4">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <BookOpen className="size-4 text-teal" aria-hidden />
            Adab tamu
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => mutate((c) => void c.adab.items.push(""))}
          >
            <Plus className="size-3.5" aria-hidden />
            Tambah
          </Button>
        </div>
        {adab.items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <TextField
              label=""
              value={item}
              onChange={(v) => mutate((c) => void (c.adab.items[i] = v))}
              placeholder="Mohon tidak membawa anak kecil…"
            />
            <button
              type="button"
              onClick={() => mutate((c) => void c.adab.items.splice(i, 1))}
              className="mt-6 text-red-500 hover:text-red-700"
            >
              <Trash2 className="size-3.5" aria-hidden />
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}

/* ── Tab: Media (video + live + kado) ────────────────────── */

export function MediaPanel({ config, mutate }: PanelProps) {
  const video = config.video;
  const live = config.live;
  const kado = config.kado;

  return (
    <div className="space-y-6">
      {/* Video */}
      <section className="space-y-3 rounded-xl border border-border-warm p-4">
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          <Video className="size-4 text-teal" aria-hidden />
          Video
        </p>
        <TextField
          label="URL video (YouTube / MP4)"
          value={video.url ?? ""}
          onChange={(v) => mutate((c) => void (c.video.url = v || undefined))}
          placeholder="https://youtube.com/watch?v=…"
          hint="Kosongkan untuk sembunyikan section."
        />
        <TextField
          label="Judul video (opsional)"
          value={video.title ?? ""}
          onChange={(v) => mutate((c) => void (c.video.title = v || undefined))}
        />
      </section>

      {/* Live streaming */}
      <section className="space-y-3 rounded-xl border border-border-warm p-4">
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          <Video className="size-4 text-teal" aria-hidden />
          Live streaming
        </p>
        <TextField
          label="URL live streaming"
          value={live.url ?? ""}
          onChange={(v) => mutate((c) => void (c.live.url = v || undefined))}
          placeholder="https://youtube.com/watch?v=…"
          hint="Kosongkan untuk sembunyikan section."
        />
        <TextField
          label="Judul live (opsional)"
          value={live.title ?? ""}
          onChange={(v) => mutate((c) => void (c.live.title = v || undefined))}
        />
      </section>

      {/* Kado fisik */}
      <section className="space-y-3 rounded-xl border border-border-warm p-4">
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          <Gift className="size-4 text-teal" aria-hidden />
          Alamat kirim kado
        </p>
        <TextField
          label="Penerima"
          value={kado.recipient ?? ""}
          onChange={(v) => mutate((c) => void (c.kado.recipient = v || undefined))}
          placeholder="Nama penerima"
        />
        <TextAreaField
          label="Alamat"
          value={kado.address ?? ""}
          onChange={(v) => mutate((c) => void (c.kado.address = v || undefined))}
          placeholder="Jl. … Kota …"
          rows={2}
          hint="Kosongkan semua untuk sembunyikan section."
        />
        <TextField
          label="Catatan (opsional)"
          value={kado.notes ?? ""}
          onChange={(v) => mutate((c) => void (c.kado.notes = v || undefined))}
          placeholder="Titip ke satpam jika tidak ada di rumah"
        />
      </section>
    </div>
  );
}

/* ── Tab: Section (show/hide + judul + urutan) ───────────── */

export function SectionPanel({ config, mutate }: PanelProps) {
  // Urutan aktif: config.sectionOrder → SECTION_ORDER bawaan.
  const order = (config.sectionOrder?.length
    ? config.sectionOrder
    : SECTION_ORDER) as SectionId[];

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...order];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    const [item] = next.splice(idx, 1);
    next.splice(target, 0, item!);
    mutate((c) => void (c.sectionOrder = next));
  };

  const toggle = (id: SectionId, on: boolean) => {
    mutate((c) => void (c.sections[id] = on));
  };

  const setLabel = (id: SectionId, field: "eyebrow" | "title", value: string) => {
    mutate((c) => {
      c.sectionLabels = c.sectionLabels ?? {};
      c.sectionLabels[id] = { ...c.sectionLabels[id], [field]: value || undefined };
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold">Urutan & tampilan section</p>
        <p className="text-muted-warm mt-0.5 text-[11px]">
          Atur urutan (naik/turun), tampilkan/sembunyikan, dan edit judul section.
        </p>
      </div>

      <div className="space-y-2">
        {order.map((id, idx) => {
          const enabled = config.sections[id] !== false;
          const canLabel = LABELABLE_SECTIONS.includes(id);
          const lb = config.sectionLabels?.[id] ?? {};
          const defLb = SECTION_DEFAULT_LABELS[id];
          return (
            <div
              key={id}
              className={cn(
                "rounded-lg border border-border-warm p-3 transition-opacity",
                !enabled && "opacity-50",
              )}
            >
              <div className="flex items-center gap-2">
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => move(idx, -1)}
                    disabled={idx === 0}
                    className="text-muted-warm hover:text-charcoal text-[10px] disabled:opacity-30"
                    aria-label="Naikkan"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => move(idx, 1)}
                    disabled={idx === order.length - 1}
                    className="text-muted-warm hover:text-charcoal text-[10px] disabled:opacity-30"
                    aria-label="Turunkan"
                  >
                    ▼
                  </button>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{SECTION_LABELS[id]}</p>
                  {defLb?.title ? (
                    <p className="text-muted-warm text-[11px]">Default: {defLb.title}</p>
                  ) : null}
                </div>
                <label className="flex shrink-0 items-center gap-1.5 text-xs">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => toggle(id, e.target.checked)}
                    className="size-3.5 accent-[#0D9488]"
                  />
                  {enabled ? "Tampil" : "Sembunyi"}
                </label>
              </div>

              {canLabel && enabled ? (
                <div className="mt-2 grid gap-2 border-t border-border-warm pt-2 sm:grid-cols-2">
                  <TextField
                    label="Eyebrow"
                    value={lb.eyebrow ?? ""}
                    onChange={(v) => setLabel(id, "eyebrow", v)}
                    placeholder={defLb?.eyebrow ?? ""}
                  />
                  <TextField
                    label="Judul"
                    value={lb.title ?? ""}
                    onChange={(v) => setLabel(id, "title", v)}
                    placeholder={defLb?.title ?? SECTION_LABELS[id]}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <p className="text-muted-warm text-[11px]">
        Section RSVP, buku tamu, dan kartu QR aktif ketika tamu membuka undangan lewat tautan
        personal (?kepada=nama&amp;g=kode).
      </p>
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
