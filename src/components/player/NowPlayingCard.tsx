"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getEmbedSource } from "./MusicEmbed";
import { usePlayer, type PlayerTrack } from "./MusicPlayerProvider";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

export function NowPlayingCard({ track, playlist }: { track: PlayerTrack | null; playlist: PlayerTrack[] }) {
  const player = usePlayer();
  const [manuallyOpen, setManuallyOpen] = useState(false);
  const [collapsedTrackKey, setCollapsedTrackKey] = useState<string | null>(null);
  const cardRef = useRef<HTMLElement>(null);
  const current = player.track ?? track;
  const source = player.track ? getEmbedSource(player.track.url) : null;
  const index = current ? playlist.findIndex((item) => item.id === current.id) : -1;
  const isCurrentPlaying = Boolean(current && player.track?.id === current.id && player.playing);
  const trackKey = player.track ? `${player.track.id}:${player.track.url}` : null;
  const mobileOpen = manuallyOpen || (trackKey !== null && collapsedTrackKey !== trackKey);

  useEffect(() => {
    if (!mobileOpen) return;
    const collapseOnOutsideTap = (event: PointerEvent) => {
      if (window.matchMedia("(min-width: 1024px)").matches) return;
      if (!cardRef.current?.contains(event.target as Node)) {
        setManuallyOpen(false);
        setCollapsedTrackKey(trackKey);
      }
    };
    document.addEventListener("pointerdown", collapseOnOutsideTap);
    return () => document.removeEventListener("pointerdown", collapseOnOutsideTap);
  }, [mobileOpen, trackKey]);

  return (
    <section
      ref={cardRef}
      className={`card-soft fixed right-3 z-40 max-h-[calc(100dvh-9rem)] overflow-y-auto lg:sticky lg:top-0 lg:max-h-none lg:w-full lg:overflow-visible lg:p-4 ${mobileOpen ? "top-16 w-[min(320px,calc(100vw-24px))] p-4" : "bottom-20 w-[min(216px,calc(100vw-24px))] p-2"}`}
      aria-label="Tocando agora"
    >
      <button
        type="button"
        onClick={() => {
          if (mobileOpen) {
            setManuallyOpen(false);
            setCollapsedTrackKey(trackKey);
          } else {
            setManuallyOpen(true);
          }
        }}
        className="flex min-h-11 w-full items-center justify-between rounded-xl bg-brand px-3 text-sm font-bold text-white lg:hidden"
        aria-expanded={mobileOpen}
        aria-label={mobileOpen ? "Recolher player de música" : "Abrir player de música"}
      ><span>♫ Player</span><span aria-hidden="true">{mobileOpen ? "⌄" : "⌃"}</span></button>
      <h2 className={`text-sm font-bold uppercase tracking-wide text-ink-soft ${mobileOpen ? "mt-2" : "hidden lg:block"}`}>🎵 Tocando agora</h2>
      {current ? (
        <>
          <div className={`mt-3 items-center gap-3 ${mobileOpen ? "flex" : "hidden lg:flex"}`}>
            <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-brand-pastel/60 text-xl">
              {current.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={current.coverUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
              ) : <span aria-hidden="true">🎶</span>}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink">{current.title}</p>
              <p className="truncate text-xs text-ink-soft">{current.artist || "Nossa música"}</p>
            </div>
          </div>
          {player.error && <p role="alert" className={`mt-3 text-xs text-red-700 ${mobileOpen ? "" : "hidden lg:block"}`}>{player.error}</p>}
        </>
      ) : <p className={`mt-3 text-sm text-ink-soft ${mobileOpen ? "" : "hidden lg:block"}`}>Escolha uma música na playlist para tocar. <Link href="/musicas" className="font-semibold text-brand underline">Ver músicas</Link></p>}

      <div className={`h-[200px] w-full overflow-hidden rounded-xl bg-black [&_iframe]:h-full [&_iframe]:w-full ${mobileOpen ? "mt-3" : "mt-2"} ${source?.provider === "youtube" ? "" : "hidden"}`}>
        <div id="global-youtube-player" />
      </div>
      <div className={`mt-3 w-full overflow-hidden rounded-xl ${source?.provider === "spotify" ? "" : "hidden"}`}>
        <div id="global-spotify-player" />
      </div>

      {current && <div className={mobileOpen ? "" : "hidden lg:block"}>
        {source?.provider !== "spotify" && <div className="mt-3 flex items-center gap-2">
          <span className="text-xs tabular-nums text-ink-soft">{formatTime(player.progress)}</span>
          <input
            type="range"
            min={0}
            max={player.duration || 0}
            value={Math.min(player.progress, player.duration || 0)}
            onChange={(event) => player.seek(Number(event.target.value))}
            disabled={!player.duration}
            aria-label="Posição da música"
            className="min-w-0 flex-1 accent-brand"
          />
          <span className="text-xs tabular-nums text-ink-soft">{formatTime(player.duration)}</span>
        </div>}

        {source?.provider !== "spotify" && <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-ink-soft">
          <span className="shrink-0">Volume</span>
          <input
            type="range"
            min={0}
            max={100}
            value={player.volume}
            onChange={(event) => player.setVolume(Number(event.target.value))}
            aria-label="Volume da música"
            className="min-w-0 flex-1 accent-brand"
          />
          <span className="w-8 shrink-0 text-right tabular-nums">{player.volume}%</span>
        </label>}

        <div className="mt-3 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => player.play(playlist[index > 0 ? index - 1 : playlist.length - 1])}
            disabled={playlist.length === 0}
            className="grid h-10 w-10 place-items-center rounded-full bg-white text-ink shadow disabled:opacity-40"
            aria-label="Música anterior"
          >⏮</button>
          <button
            type="button"
            onClick={() => player.track?.id === current.id ? player.toggle() : player.play(current)}
            className="grid h-12 w-12 place-items-center rounded-full bg-brand text-white shadow"
            aria-label={isCurrentPlaying ? "Pausar" : "Tocar"}
          >{isCurrentPlaying ? "Ⅱ" : "▶"}</button>
          <button
            type="button"
            onClick={() => player.play(playlist[index >= 0 && index < playlist.length - 1 ? index + 1 : 0])}
            disabled={playlist.length === 0}
            className="grid h-10 w-10 place-items-center rounded-full bg-white text-ink shadow disabled:opacity-40"
            aria-label="Próxima música"
          >⏭</button>
          <button
            type="button"
            onClick={player.stop}
            className="ml-auto grid h-10 w-10 place-items-center rounded-full bg-white text-ink-soft shadow"
            aria-label="Parar"
          >■</button>
        </div>
      </div>}
    </section>
  );
}
