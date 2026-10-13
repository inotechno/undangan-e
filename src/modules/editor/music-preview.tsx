"use client";

import { useEffect, useRef, useState } from "react";
import { MonitorPlay, Music, Pause, Play } from "lucide-react";

function extractYouTubeId(url: string): string | null {
  const m =
    url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/) ??
    url.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/);
  return m?.[1] ?? null;
}

/**
 * Preview musik di editor: putar MP3 atau YouTube tanpa membuka undangan.
 * Berhenti otomatis saat track digunakan diganti (remount via key) atau unmount.
 */
export function MusicPreview({ track }: { track?: string }) {
  if (!track?.trim()) {
    return (
      <p className="rounded-lg border border-dashed border-border-warm px-3 py-2.5 text-[11px] text-muted-warm">
        Belum ada musik dipilih — pilih preset atau tempel URL di bawah, lalu tekan putar untuk mendengarkan.
      </p>
    );
  }
  return <MusicPreviewPlayer key={track} track={track} />;
}

function MusicPreviewPlayer({ track }: { track: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [playing, setPlaying] = useState(false);

  const ytId = extractYouTubeId(track);
  const isYouTube = Boolean(ytId);

  useEffect(() => {
    const audio = audioRef.current;
    const iframe = iframeRef.current;
    return () => {
      audio?.pause();
      iframe?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "pauseVideo", args: "" }),
        "*",
      );
    };
  }, []);

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
    } else {
      void audio.play().catch(() => setPlaying(false));
    }
  }

  return (
    <div className="relative flex items-center gap-3 rounded-lg border border-border-warm bg-[#f7fbfb] px-3 py-2.5">
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Hentikan pratinjau" : "Putar pratinjau"}
        className="grid size-9 shrink-0 place-items-center rounded-full bg-teal text-white transition-colors hover:bg-teal-hover"
      >
        {playing ? <Pause className="size-4" aria-hidden /> : <Play className="ml-0.5 size-4" aria-hidden />}
      </button>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-xs font-bold text-charcoal">
          {isYouTube ? <MonitorPlay className="size-3.5 shrink-0 text-red-600" aria-hidden /> : <Music className="size-3.5 shrink-0 text-teal" aria-hidden />}
          <span className="truncate">{isYouTube ? "Pratinjau YouTube" : "Pratinjau audio"}</span>
        </p>
        <p className="mt-0.5 truncate text-[10px] text-muted-warm">{track}</p>
      </div>
      <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[9px] font-bold tracking-wide text-[#657587] uppercase">
        {playing ? "Diputar" : "Pratinjau"}
      </span>
      {isYouTube && ytId ? (
        <iframe
          ref={iframeRef}
          src={`https://www.youtube.com/embed/${ytId}?enablejsapi=1&controls=0&modestbranding=1&rel=0`}
          className="pointer-events-none absolute size-px opacity-0"
          allow="autoplay"
          title="Pratinjau musik YouTube"
          aria-hidden
        />
      ) : (
        <audio
          ref={audioRef}
          src={track}
          preload="metadata"
          loop
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        />
      )}
    </div>
  );
}
