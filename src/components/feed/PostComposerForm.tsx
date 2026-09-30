"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";

type PendingMedia = { url: string; kind: string; name: string };

export type ComposerViewer = { id: number; displayName: string; username: string; avatarUrl: string | null };

type Props = {
  viewer: ComposerViewer;
  autoFocus?: boolean;
  onPublished?: () => void;
  albums?: { id: number; title: string; coverUrl: string | null }[];
};

export function PostComposerForm({ viewer, autoFocus = false, onPublished, albums = [] }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [media, setMedia] = useState<PendingMedia[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [special, setSpecial] = useState(false);
  const [specialTitle, setSpecialTitle] = useState("");
  const [showMusic, setShowMusic] = useState(false);
  const [music, setMusic] = useState({ title: "", artist: "", url: "", cover: "" });
  const [musicResolving, setMusicResolving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [albumId, setAlbumId] = useState<number | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    const form = new FormData();
    Array.from(files).forEach((file) => form.append("files", file));
    setUploading(true);
    setProgress(0);

    await new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/upload");
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) setProgress(Math.round((event.loaded / event.total) * 100));
      };
      xhr.onload = () => {
        setUploading(false);
        try {
          const data = JSON.parse(xhr.responseText) as { files?: PendingMedia[] };
          if (Array.isArray(data.files)) setMedia((prev) => [...prev, ...data.files!].slice(0, 8));
        } catch {
          toast("Não conseguimos enviar o arquivo.", "error");
        }
        resolve();
      };
      xhr.onerror = () => {
        setUploading(false);
        toast("Falha no envio.", "error");
        resolve();
      };
      xhr.send(form);
    });
  }

  async function handleMusicUrlChange(url: string) {
    setMusic((prev) => ({ ...prev, url }));
    const isYoutube = /youtube\.com|youtu\.be/.test(url);
    const isSpotify = /spotify\.com\/(track|album|playlist)/.test(url);
    if ((isYoutube || isSpotify) && url.trim().length > 10) {
      setMusicResolving(true);
      try {
        const response = await fetch("/api/resolve-audio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        const data = await response.json().catch(() => null);
        if (response.ok && data?.url) {
          setMusic((prev) => ({
            ...prev,
            title: data.title || prev.title,
            artist: data.artist || prev.artist,
            url: data.url,
            cover: data.thumbnail || prev.cover,
          }));
          toast("Link identificado. O player oficial será usado ao tocar.");
        } else {
          toast(data?.error || "Não foi possível resolver esse link.", "error");
        }
      } catch {
        toast("Falha de rede ao resolver o link.", "error");
      } finally {
        setMusicResolving(false);
      }
    }
  }

  async function publish() {
    if (!content.trim() && media.length === 0) return;
    setSaving(true);
    const response = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        media: media.map((m) => ({ url: m.url, kind: m.kind, alt: m.name })),
        isSpecial: special,
        specialTitle: specialTitle || null,
        albumId,
        music: music.url || music.title ? { title: music.title, artist: music.artist, url: music.url, cover: music.cover } : null,
      }),
    });
    setSaving(false);

    if (!response.ok) {
      toast("Ops, não deu para publicar.", "error");
      return;
    }
    setContent("");
    setMedia([]);
    setSpecial(false);
    setSpecialTitle("");
    setMusic({ title: "", artist: "", url: "", cover: "" });
    setShowMusic(false);
    toast("Momento publicado 💗");
    onPublished?.();
    router.refresh();
  }

  const canPublish = (content.trim().length > 0 || media.length > 0) && !saving && !uploading;

  return (
    <section className="card-soft p-4 sm:p-5" aria-label="Criar momento">
      <div className="flex gap-3">
        <Avatar name={viewer.displayName} src={viewer.avatarUrl} size="lg" />
        <div className="min-w-0 flex-1">
          <label className="sr-only" htmlFor="composer-text">
            Compartilhe um momento
          </label>
          <textarea
            id="composer-text"
            autoFocus={autoFocus}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={content.length > 90 ? 4 : 2}
            placeholder="Compartilhe um momento... 💕"
            className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-ink outline-none placeholder:text-ink-soft/70"
          />

          {media.length > 0 && (
            <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {media.map((item) => (
                <li key={item.url} className="relative overflow-hidden rounded-2xl border border-brand-pastel bg-white">
                  {item.kind === "video" ? (
                    <video src={item.url} className="h-28 w-full object-cover" preload="metadata" muted playsInline />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.url} alt={item.name} className="h-28 w-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => setMedia((prev) => prev.filter((m) => m.url !== item.url))}
                    className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-ink shadow"
                    aria-label={`Remover ${item.name}`}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}

          {uploading && (
            <div className="mt-3">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-brand-pastel/60">
                <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-1 text-xs text-ink-soft">Enviando... {progress}%</p>
            </div>
          )}

          {showMusic && (
            <div className="mt-3 grid gap-2 rounded-2xl border border-brand-pastel/70 bg-white/70 p-3 sm:grid-cols-3">
              <input
                value={music.title}
                onChange={(e) => setMusic({ ...music, title: e.target.value })}
                placeholder="Nome da música"
                aria-label="Nome da música"
                className="rounded-xl border border-brand-pastel bg-white px-3 py-2 text-sm outline-none"
              />
              <input
                value={music.artist}
                onChange={(e) => setMusic({ ...music, artist: e.target.value })}
                placeholder="Artista"
                aria-label="Artista"
                className="rounded-xl border border-brand-pastel bg-white px-3 py-2 text-sm outline-none"
              />
              <input
                value={music.url}
                onChange={(e) => handleMusicUrlChange(e.target.value)}
            placeholder="Link YouTube, Spotify ou MP3 direto"
                aria-label="Link do áudio"
                className="rounded-xl border border-brand-pastel bg-white px-3 py-2 text-sm outline-none sm:col-span-1"
              />
              {musicResolving && <p className="col-span-3 text-xs text-brand">🔎 Resolvendo link...</p>}
            </div>
          )}

          {special && (
            <div className="mt-3 rounded-2xl border border-brand-light bg-brand-pastel/25 p-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-ink">
                <input
                  type="checkbox"
                  checked={special}
                  onChange={(e) => setSpecial(e.target.checked)}
                  className="h-4 w-4 accent-brand"
                />
                ✨ Marcar como Momento Especial
              </label>
              <input
                value={specialTitle}
                onChange={(e) => setSpecialTitle(e.target.value)}
                placeholder="Nome do momento (ex.: Nossa viagem 💗)"
                aria-label="Nome do momento especial"
                className="mt-2 w-full rounded-xl border border-brand-pastel bg-white px-3 py-2 text-sm outline-none"
              />
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-brand-pastel/70 pt-3">
            <input
              ref={photoRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => void upload(e.target.files)}
            />
            <input
              ref={videoRef}
              type="file"
              accept="video/*"
              hidden
              onChange={(e) => void upload(e.target.files)}
            />
            <ToolButton label="Foto" icon="📷" onClick={() => photoRef.current?.click()} />
            <ToolButton label="Vídeo" icon="🎥" onClick={() => videoRef.current?.click()} />
            <ToolButton
              label="Música"
              icon="🎵"
              active={showMusic}
              onClick={() => setShowMusic((v) => !v)}
            />
            <ToolButton label="Momento Especial" icon="✨" active={special} onClick={() => setSpecial((v) => !v)} />

            {albums.length > 0 && (
              <select
                value={albumId ?? ""}
                onChange={(e) => setAlbumId(e.target.value ? Number(e.target.value) : null)}
                className="min-h-11 rounded-full border border-brand-pastel bg-white px-3 py-2 text-sm outline-none"
                aria-label="Escolher álbum"
              >
                <option value="">📁 Sem álbum</option>
                {albums.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={() => void publish()}
              disabled={!canPublish}
              className="ml-auto min-h-11 rounded-full bg-gradient-to-r from-brand to-brand-mid px-6 text-sm font-bold text-white shadow-[0_12px_26px_-12px_rgba(244,63,117,0.9)] transition hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Publicando..." : "PUBLICAR"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function ToolButton({
  label,
  icon,
  onClick,
  active,
}: {
  label: string;
  icon: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-11 rounded-full px-3.5 text-sm font-semibold transition active:scale-[0.97] ${
        active ? "bg-brand-pastel text-brand" : "text-ink-soft hover:bg-brand-pastel/40 hover:text-brand"
      }`}
    >
      <span aria-hidden>{icon}</span> <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
