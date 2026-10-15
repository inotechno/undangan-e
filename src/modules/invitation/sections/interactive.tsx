"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  Copy,
  Gift,
  Heart,
  HeartHandshake,
  Home,
  Images,
  Info,
  MapPin,
  Menu,
  MessageSquare,
  MonitorPlay,
  Music,
  Pause,
  QrCode,
  Shield,
  Sparkles,
  Timer,
  Video,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SectionId } from "../types";

const SECTION_ICONS: Record<SectionId, LucideIcon> = {
  cover: Home,
  couple: Heart,
  doa: BookOpen,
  event_info: CalendarDays,
  countdown: Timer,
  schedule_maps: MapPin,
  info: Info,
  story: BookOpen,
  gallery: Images,
  gift: Gift,
  kado: Gift,
  video: Video,
  live: MonitorPlay,
  rsvp: ClipboardCheck,
  guestbook: MessageSquare,
  qr_pass: QrCode,
  wishes_list: HeartHandshake,
  prokes: Shield,
  adab: BookOpen,
  closing: Sparkles,
  music_player: Music,
};

/* ── Countdown ───────────────────────────────────────────── */

function diffParts(target: number) {
  const total = Math.max(0, target - Date.now());
  const sec = Math.floor(total / 1000);
  return {
    days: Math.floor(sec / 86400),
    hours: Math.floor((sec % 86400) / 3600),
    minutes: Math.floor((sec % 3600) / 60),
    seconds: sec % 60,
  };
}

const ZERO_PARTS = { days: 0, hours: 0, minutes: 0, seconds: 0 };

export function Countdown({ target, label }: { target: string; label?: string }) {
  const time = Date.parse(target);
  const [parts, setParts] = useState(ZERO_PARTS);

  useEffect(() => {
    const tick = () => setParts(diffParts(time));
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [time]);

  const items = [
    { value: parts.days, label: "Hari" },
    { value: parts.hours, label: "Jam" },
    { value: parts.minutes, label: "Menit" },
    { value: parts.seconds, label: "Detik" },
  ];

  return (
    <div className="text-center">
      {label ? (
        <p className="mb-5 text-xs font-semibold tracking-[0.24em] uppercase opacity-70">{label}</p>
      ) : null}
      <div className="flex items-start justify-center gap-2.5 sm:gap-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="min-w-[64px] rounded-[var(--inv-radius)] border border-[var(--inv-accent)]/20 bg-[var(--inv-surface)] px-2 py-3 sm:min-w-[84px] sm:py-4"
          >
            <div className="text-2xl font-bold tabular-nums sm:text-3xl" style={{ color: "var(--inv-accent)" }}>
              {String(item.value).padStart(2, "0")}
            </div>
            <div className="mt-1 text-[10px] font-semibold tracking-widest uppercase opacity-60">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Music player ────────────────────────────────────────── */

function extractYouTubeId(url: string): string | null {
  const m =
    url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/) ??
    url.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/);
  return m?.[1] ?? null;
}

export function MusicPlayer({
  track,
  title,
  autoPlay,
}: {
  track?: string;
  title?: string;
  autoPlay?: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [playing, setPlaying] = useState(false);
  const didAutoPlay = useRef(false);

  const ytId = track ? extractYouTubeId(track) : null;
  const isYouTube = Boolean(ytId);

  useEffect(() => {
    if (!autoPlay || didAutoPlay.current) return;
    didAutoPlay.current = true;
    if (isYouTube && ytId) {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "playVideo", args: "" }),
        "*",
      );
      queueMicrotask(() => setPlaying(true));
    } else {
      const audio = audioRef.current;
      if (!audio) return;
      void audio.play().then(
        () => setPlaying(true),
        () => setPlaying(false),
      );
    }
  }, [autoPlay, isYouTube, ytId]);

  if (!track) return null;

  function toggle() {
    if (isYouTube && ytId) {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: playing ? "pauseVideo" : "playVideo", args: "" }),
        "*",
      );
      setPlaying(!playing);
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      void audio.play().then(
        () => setPlaying(true),
        () => setPlaying(false),
      );
    }
  }

  if (isYouTube && ytId) {
    return (
      <>
        <iframe
          ref={iframeRef}
          src={`https://www.youtube.com/embed/${ytId}?enablejsapi=1&loop=1&playlist=${ytId}&controls=0&modestbranding=1&rel=0`}
          className="pointer-events-none fixed bottom-0 left-0 h-px w-px opacity-0"
          allow="autoplay"
          title={title ?? "Musik latar"}
          aria-hidden
        />
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Jeda musik" : "Putar musik"}
          className={cn(
            "fixed right-4 bottom-4 z-40 flex size-11 items-center justify-center rounded-full text-white shadow-lg transition-transform active:scale-95 sm:right-6 sm:bottom-6 sm:size-12",
            playing && "animate-spin [animation-duration:6s]"
          )}
          style={{ background: "var(--inv-accent)" }}
        >
          {playing ? <Pause className="size-5" /> : <Music className="size-5" />}
          <span className="sr-only">{title ?? "Musik latar"}</span>
        </button>
      </>
    );
  }

  return (
    <>
      <audio ref={audioRef} src={track} preload={autoPlay ? "auto" : "metadata"} loop />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Jeda musik" : "Putar musik"}
        className={cn(
          "fixed right-4 bottom-4 z-40 flex size-11 items-center justify-center rounded-full text-white shadow-lg transition-transform active:scale-95 sm:right-6 sm:bottom-6 sm:size-12",
          playing && "animate-spin [animation-duration:6s]"
        )}
        style={{ background: "var(--inv-accent)" }}
      >
        {playing ? <Pause className="size-5" /> : <Music className="size-5" />}
        <span className="sr-only">{title ?? "Musik latar"}</span>
      </button>
    </>
  );
}

/* ── Copy rekening hadiah ────────────────────────────────── */

export function CopyButton({ value, className }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-current px-3 py-1 text-[11px] font-semibold transition-opacity hover:opacity-70",
        className
      )}
      onClick={() => {
        void navigator.clipboard?.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        });
      }}
    >
      <Copy className="size-3.5" aria-hidden />
      {copied ? "Tersalin" : "Salin"}
    </button>
  );
}

/* ── Cover gate (semua layout, mode live) ────────────────── */

export function CurtainGate({
  cover,
  eyebrow,
  names,
  dateLabel,
  greeting,
  buttonLabel = "Buka Undangan",
  onOpen,
}: {
  cover?: string;
  eyebrow?: string;
  names?: string;
  dateLabel?: string;
  greeting?: string;
  buttonLabel?: string;
  onOpen?: () => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  function handleOpen() {
    if (open) return;
    setOpen(true);
    onOpen?.();
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center transition-all duration-700 ease-out",
        open
          ? "pointer-events-none -translate-y-full opacity-0 blur-[2px]"
          : "translate-y-0 opacity-100 blur-0"
      )}
      aria-hidden={open}
    >
      <div className="absolute inset-0 bg-[#151b19]" />
      {cover ? (
        <Image
          src={cover}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-50"
        />
      ) : null}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.66), rgba(0,0,0,0.32), color-mix(in srgb, var(--inv-accent) 38%, rgba(0,0,0,0.74)))",
        }}
      />

      {/* Bingkai dekoratif ganda */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-3 border border-white/25 sm:inset-5"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[18px] border border-white/12 sm:inset-8"
      />

      <div className="relative z-10 mx-auto w-full max-w-md px-10 text-center text-white sm:px-12">
        <p className="text-[10px] font-semibold tracking-[0.4em] uppercase opacity-80">
          {eyebrow ?? "The Wedding of"}
        </p>

        <div className="mt-5 flex items-center justify-center gap-3 opacity-85" aria-hidden>
          <span className="h-px w-10 bg-white/50" />
          <span className="text-xs leading-none">✦</span>
          <span className="h-px w-10 bg-white/50" />
        </div>

        {names ? (
          <h1
            className="mt-6 text-3xl leading-[1.2] font-bold text-balance sm:text-[2.6rem]"
            style={{ fontFamily: "var(--inv-heading)" }}
          >
            {names}
          </h1>
        ) : null}

        {dateLabel ? (
          <p className="mt-4 text-[11px] font-semibold tracking-[0.28em] uppercase text-white/85">
            {dateLabel}
          </p>
        ) : null}

        {greeting ? (
          <div className="mx-auto mt-8 max-w-[16rem] rounded-2xl border border-white/25 bg-white/10 px-5 py-4 backdrop-blur-sm">
            <p className="text-[10px] tracking-[0.2em] uppercase text-white/70">Kepada Yth.</p>
            <p className="mt-1.5 text-base leading-snug font-semibold text-white">{greeting}</p>
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleOpen}
          className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-white px-9 text-sm font-bold text-[#1c2422] shadow-[0_8px_30px_rgba(0,0,0,0.35)] transition-transform hover:scale-105 active:scale-95"
        >
          {buttonLabel}
        </button>
        <p className="mt-4 text-[9px] font-semibold tracking-[0.3em] uppercase text-white/50">
          Ketuk untuk membuka undangan
        </p>
      </div>
    </div>
  );
}

/* ── Floating menu navigasi section ──────────────────────── */

export function FloatingMenu({
  items,
}: {
  items: { id: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  if (items.length < 2) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Tutup menu" : "Buka menu navigasi"}
        aria-expanded={open}
        className="fixed bottom-4 left-4 z-40 flex size-11 items-center justify-center rounded-full text-white shadow-lg transition-transform active:scale-95 sm:bottom-6 sm:left-6 sm:size-12"
        style={{ background: "var(--inv-accent)" }}
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {open ? (
        <div className="fixed inset-0 z-30" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" aria-hidden />
          <nav
            aria-label="Navigasi undangan"
            className="absolute bottom-20 left-4 max-h-[60vh] w-[min(260px,calc(100vw-2rem))] overflow-y-auto rounded-2xl border p-2 shadow-2xl sm:left-6"
            style={{
              background: "var(--inv-surface)",
              borderColor: "var(--inv-accent-soft)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {items.map((item) => {
              const Icon = SECTION_ICONS[item.id as SectionId] ?? Home;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    requestAnimationFrame(() => {
                      document
                        .getElementById(item.id)
                        ?.scrollIntoView({ behavior: "smooth", block: "start" });
                    });
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[var(--inv-accent-soft)]"
                  style={{ color: "var(--inv-text)" }}
                >
                  <span
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: "var(--inv-accent-soft)", color: "var(--inv-accent)" }}
                  >
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span className="text-sm font-semibold">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      ) : null}
    </>
  );
}

/* ── Chrome: gate + musik + menu dalam satu state client ─── */

export function InvitationChrome({
  mode = "live",
  cover,
  eyebrow,
  names,
  dateLabel,
  greeting,
  musicTrack,
  musicTitle,
  autoplayMusic,
  menuItems,
}: {
  mode?: "live" | "preview";
  cover?: string;
  eyebrow?: string;
  names?: string;
  dateLabel?: string;
  greeting?: string;
  musicTrack?: string;
  musicTitle?: string;
  autoplayMusic?: boolean;
  menuItems: { id: string; label: string }[];
}) {
  const [opened, setOpened] = useState(false);
  const isLive = mode !== "preview";

  return (
    <>
      {isLive ? (
        <CurtainGate
          cover={cover}
          eyebrow={eyebrow}
          names={names}
          dateLabel={dateLabel}
          greeting={greeting}
          onOpen={() => setOpened(true)}
        />
      ) : null}
      {musicTrack ? (
        <MusicPlayer
          track={musicTrack}
          title={musicTitle}
          autoPlay={opened && Boolean(autoplayMusic)}
        />
      ) : null}
      {isLive ? <FloatingMenu items={menuItems} /> : null}
    </>
  );
}

/* ── Scroll cue ──────────────────────────────────────────── */

export function ScrollCue({ label = "Gulir ke bawah" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 text-[10px] tracking-[0.24em] uppercase opacity-80">
      <span>{label}</span>
      <span className="flex size-7 items-center justify-center rounded-full border border-current">
        <span className="animate-bounce text-base leading-none">↓</span>
      </span>
    </div>
  );
}
