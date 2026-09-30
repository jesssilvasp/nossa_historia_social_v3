"use client";

import { usePlayer, type PlayerTrack } from "./MusicPlayerProvider";
import { isEmbeddedMusicUrl, MusicEmbed } from "./MusicEmbed";

export function NowPlayingCard({ track, playlist }: { track: PlayerTrack | null; playlist: PlayerTrack[] }) {
  const player = usePlayer();
  const current = player.track ?? track;
  const index = current ? playlist.findIndex((t) => t.id === current.id) : -1;
  const embedded = current ? isEmbeddedMusicUrl(current.url) : false;

  return (
    <section className="card-soft overflow-hidden" aria-label="Tocando agora">
      <h2 className="px-4 pt-4 text-sm font-bold uppercase tracking-wide text-ink-soft">🎵 Tocando Agora</h2>
      {current ? (
        <div className="p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-pastel to-brand-light text-2xl">
              {current.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={current.coverUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <span aria-hidden>🎶</span>
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink">{current.title}</p>
              <p className="truncate text-xs text-ink-soft">{current.artist || "Nós duas"}</p>
            </div>
          </div>

          {embedded && <MusicEmbed track={current} compact />}

          {!embedded && <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-brand-pastel/60">
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-300"
              style={{
                width: player.duration
                  ? `${Math.min(100, (player.progress / player.duration) * 100)}%`
                  : current.id === player.track?.id
                    ? "4%"
                    : "0%",
              }}
            />
          </div>}

          {!embedded && <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const previous = index > 0 ? playlist[index - 1] : playlist[playlist.length - 1];
                if (previous) player.play(previous);
              }}
              className="grid h-11 w-11 place-items-center rounded-full bg-white text-ink shadow transition hover:text-brand"
              aria-label="Música anterior"
            >
              ⏮
            </button>
            <button
              type="button"
              onClick={player.toggle}
              className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-mid text-lg text-white shadow transition active:scale-95"
              aria-label={player.playing && current.id === player.track?.id ? "Pausar" : "Tocar"}
            >
              <span aria-hidden>{player.playing && current.id === player.track?.id ? "⏸" : "▶"}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const next = index >= 0 && index < playlist.length - 1 ? playlist[index + 1] : playlist[0];
                if (next) player.play(next);
              }}
              className="grid h-11 w-11 place-items-center rounded-full bg-white text-ink shadow transition hover:text-brand"
              aria-label="Próxima música"
            >
              ⏭
            </button>
            <button
              type="button"
              onClick={player.stop}
              className="ml-auto grid h-11 w-11 place-items-center rounded-full bg-white text-ink-soft shadow transition hover:text-brand"
              aria-label="Parar"
            >
              ⏹
            </button>
          </div>}
        </div>
      ) : (
        <p className="px-4 pb-4 text-sm text-ink-soft">
          Nenhuma música por aqui ainda. Adicione a música de vocês em 🎵 Músicas.
        </p>
      )}
    </section>
  );
}
