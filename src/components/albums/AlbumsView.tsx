"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import type { AlbumWithMeta } from "@/lib/data";

export function AlbumsView({ initial }: { initial: AlbumWithMeta[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState(initial);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  async function create() {
    if (!title.trim()) return;
    setSaving(true);
    const response = await fetch("/api/albums", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    setSaving(false);
    if (!response.ok) {
      toast("Dê um nome ao álbum 💗", "error");
      return;
    }
    const data = (await response.json()) as { album: { id: number; title: string; coverUrl: string | null } };
    setItems((prev) => [
      { ...data.album, description: null, bgTheme: "rosa", ambientSound: null, fontFamily: "padrao", photoCount: 0, videoCount: 0, createdAt: new Date() },
      ...prev,
    ]);
    setTitle("");
    toast("Álbum criado 💗");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="card-soft p-4" aria-label="Criar álbum">
        <h2 className="mb-2 text-center text-sm font-bold text-brand">＋ Criar Nova Pasta de Álbum</h2>
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            void create();
          }}
        >
          <label className="sr-only" htmlFor="album-title">
            Nome do álbum
          </label>
          <input
            id="album-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nome do álbum..."
            className="min-h-11 flex-1 rounded-full border border-brand-pastel bg-white px-4 text-sm outline-none"
          />
          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="min-h-11 rounded-full bg-gradient-to-r from-brand to-brand-mid px-6 text-sm font-bold text-white transition disabled:opacity-50"
          >
            {saving ? "Criando..." : "📁 Criar Pasta"}
          </button>
        </form>
      </section>

      {items.length === 0 ? (
        <div className="card-soft px-6 py-12 text-center">
          <span className="text-4xl" aria-hidden>
            🖼
          </span>
          <h2 className="mt-2 text-lg font-bold text-ink">Esse álbum está esperando suas primeiras memórias ✨</h2>
          <p className="text-sm text-ink-soft">Crie uma pasta e comece a guardar as fotos de vocês.</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {items.map((album) => (
            <li key={album.id} className="card-soft overflow-hidden">
              <div className="relative h-40 bg-brand-pastel/40">
                {album.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={album.coverUrl}
                    alt={`Capa do álbum ${album.title}`}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="grid h-full w-full place-items-center text-4xl" aria-hidden>
                    📸
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-bold text-ink">{album.title}</h3>
                  <p className="text-xs text-ink-soft">
                    {album.photoCount} fotos • {album.videoCount} vídeos
                  </p>
                </div>
                <Link
                  href={`/albuns/${album.id}`}
                  className="min-h-11 rounded-full bg-brand-pastel/60 px-4 py-2.5 text-sm font-bold text-brand transition hover:bg-brand-pastel"
                >
                  Abrir Álbum
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
