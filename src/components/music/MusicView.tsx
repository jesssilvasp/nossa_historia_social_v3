"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePlayer, type PlayerTrack } from "@/components/player/MusicPlayerProvider";
import { useToast } from "@/components/ui/toast";

export type TrackItem = {
  id: number;
  title: string;
  artist: string;
  url: string;
  coverUrl: string | null;
  favorite: boolean;
};

export function MusicView({ initial, nowPlayingId }: { initial: TrackItem[]; nowPlayingId: number | null }) {
  const router = useRouter();
  const { toast } = useToast();
  const player = usePlayer();
  const [items, setItems] = useState(initial);
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);

  async function add() {
    if (!url.trim()) {
      toast("Cole o link da música.", "error");
      return;
    }
    setSaving(true);
    const metadataResponse = await fetch("/api/resolve-audio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    if (!metadataResponse.ok) {
      const detail = await metadataResponse.json().catch(() => null) as { error?: string } | null;
      setSaving(false);
      toast(detail?.error ?? "Use um link válido do YouTube ou Spotify.", "error");
      return;
    }
    const metadata = await metadataResponse.json() as { title?: string; artist?: string; thumbnail?: string; url: string };
    const response = await fetch("/api/tracks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: metadata.title || "Nossa música", artist: metadata.artist || "", coverUrl: metadata.thumbnail || null, url: metadata.url }),
    });
    setSaving(false);
    if (!response.ok) {
      toast("Não conseguimos salvar a música.", "error");
      return;
    }
    const data = (await response.json()) as { track: TrackItem };
    setItems((prev) => [data.track, ...prev]);
    player.play({
      id: data.track.id,
      title: data.track.title,
      artist: data.track.artist,
      url: data.track.url,
      coverUrl: data.track.coverUrl,
    });
    setUrl("");
    toast("Música adicionada 🎵");
    router.refresh();
  }

  async function toggleFavorite(track: TrackItem) {
    const response = await fetch("/api/tracks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: track.id, favorite: !track.favorite, nowPlaying: !track.favorite }),
    });
    if (!response.ok) {
      toast("Não conseguimos atualizar.", "error");
      return;
    }
    const data = (await response.json()) as { items: TrackItem[] };
    setItems(data.items);
    toast(!track.favorite ? "É a nossa música agora 💗" : "Removida das favoritas");
    router.refresh();
  }

  async function remove(track: TrackItem) {
    const response = await fetch(`/api/tracks?id=${track.id}`, { method: "DELETE" });
    if (!response.ok) {
      toast("Não conseguimos remover.", "error");
      return;
    }
    const data = (await response.json()) as { items: TrackItem[] };
    setItems(data.items);
  }

  const playlist: PlayerTrack[] = items.map((t) => ({
    id: t.id,
    title: t.title,
    artist: t.artist,
    url: t.url,
    coverUrl: t.coverUrl,
  }));

  return (
    <div className="flex flex-col gap-4">
      <section className="card-soft p-4" aria-label="Adicionar música">
        <h2 className="mb-2 text-sm font-bold text-brand">🎵 Adicionar à nossa playlist</h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter") void add(); }}
            placeholder="Cole o link do YouTube ou Spotify"
            aria-label="Link da música"
            type="url"
            className="min-h-11 min-w-0 flex-1 rounded-full border border-brand-pastel bg-white px-4 text-sm outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => void add()}
          disabled={saving}
          className="mt-3 min-h-11 rounded-full bg-gradient-to-r from-brand to-brand-mid px-6 text-sm font-bold text-white transition disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Adicionar música"}
        </button>
      </section>

      {items.length === 0 ? (
        <div className="card-soft px-6 py-12 text-center">
          <span className="text-4xl" aria-hidden>
            🎵
          </span>
          <h2 className="mt-2 text-lg font-bold text-ink">A playlist de vocês está vazia</h2>
          <p className="text-sm text-ink-soft">Adicione a música que toca nos nossos melhores momentos.</p>
        </div>
      ) : (
        <ul className="card-soft divide-y divide-brand-pastel/60 overflow-hidden">
          {items.map((track, index) => {
            const isCurrent = (player.track?.id ?? nowPlayingId) === track.id;
            return (
              <li key={track.id} className="p-3">
                <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => player.play(playlist[index])}
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-pastel/50 text-lg transition hover:bg-brand-pastel"
                  aria-label={`Tocar ${track.title}`}
                >
                  <span aria-hidden>{isCurrent && player.playing ? "⏸" : "▶"}</span>
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">
                    {track.title} {track.favorite && <span aria-hidden>💗</span>}
                  </p>
                  <p className="truncate text-xs text-ink-soft">{track.artist || "Nós duas"}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void toggleFavorite(track)}
                  className="grid h-11 w-11 place-items-center rounded-full text-lg transition hover:bg-brand-pastel/40"
                  aria-label={track.favorite ? "Remover das favoritas" : "Marcar como nossa música"}
                >
                  <span aria-hidden>{track.favorite ? "💗" : "🤍"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => void remove(track)}
                  className="grid h-11 w-11 place-items-center rounded-full text-ink-soft transition hover:bg-brand-pastel/40 hover:text-brand"
                  aria-label={`Remover ${track.title}`}
                >
                  🗑
                </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
