import type { PlayerTrack } from "./MusicPlayerProvider";

export function getEmbedSource(url: string): { provider: "youtube" | "spotify"; id: string; type?: string } | null {
  try {
    const parsed = new URL(url);
    if (["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "www.youtube-nocookie.com"].includes(parsed.hostname)) {
      const id = parsed.hostname === "youtu.be"
        ? parsed.pathname.split("/").filter(Boolean)[0]
        : parsed.pathname === "/watch"
          ? parsed.searchParams.get("v")
          : parsed.pathname.split("/").filter(Boolean).at(-1);
      if (id && /^[\w-]{11}$/.test(id)) return { provider: "youtube", id };
    }
    if (["open.spotify.com", "www.open.spotify.com"].includes(parsed.hostname)) {
      const [, type, id] = parsed.pathname.match(/^\/(track|album|playlist|episode)\/([\w]+)\/?$/) ?? [];
      if (type && id) return { provider: "spotify", type, id };
    }
  } catch {
    return null;
  }
  return null;
}

export function isEmbeddedMusicUrl(url: string): boolean {
  return getEmbedSource(url) !== null;
}

export function MusicEmbed({ track, compact = false, className = "" }: { track: PlayerTrack; compact?: boolean; className?: string }) {
  const source = getEmbedSource(track.url);
  if (!source) return null;
  return (
    <iframe
      key={`${source.provider}:${source.id}`}
      title={`${track.title} — player ${source.provider === "youtube" ? "YouTube" : "Spotify"}`}
      src={source.provider === "youtube"
        ? `https://www.youtube-nocookie.com/embed/${source.id}?playsinline=1&rel=0`
        : `https://open.spotify.com/embed/${source.type}/${source.id}?utm_source=generator`}
      width="100%"
      height={source.provider === "youtube" ? (compact ? 200 : 240) : 152}
      className={`mt-3 w-full overflow-hidden rounded-xl border-0 ${className}`}
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture; web-share"
      referrerPolicy="strict-origin-when-cross-origin"
      loading="lazy"
    />
  );
}
