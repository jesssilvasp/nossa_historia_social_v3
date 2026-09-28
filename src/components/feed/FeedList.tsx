"use client";

import { useEffect, useRef, useState } from "react";
import { PostCard } from "./PostCard";
import type { FeedPost } from "@/lib/data";
import { ComposerLauncherButton } from "./ComposerLauncher";

type Viewer = { id: number; username: string; displayName: string; avatarUrl: string | null };

export function FeedList({
  initial,
  nextCursor,
  viewer,
  query = "",
  emptyTitle = "Seu cantinho ainda está quietinho 💗",
  emptyText = "Compartilhe o primeiro momento de vocês.",
}: {
  initial: FeedPost[];
  nextCursor: string | null;
  viewer: Viewer;
  query?: string;
  emptyTitle?: string;
  emptyText?: string;
}) {
  const [items, setItems] = useState(initial);
  const [cursor, setCursor] = useState(nextCursor);
  const [loading, setLoading] = useState(false);
  const topIdRef = useRef<number | null>(initial[0]?.id ?? null);

  // Quando o servidor devolve a lista atualizada (ex.: após publicar), entramos com os novos momentos.
  useEffect(() => {
    const newest = initial[0]?.id ?? null;
    if (!newest || newest === topIdRef.current) return;
    topIdRef.current = newest;
    setItems((prev) => {
      const seen = new Set(prev.map((post) => post.id));
      const additions = initial.filter((post) => !seen.has(post.id));
      return additions.length ? [...additions, ...prev] : prev;
    });
  }, [initial]);

  async function loadMore() {
    if (!cursor || loading) return;
    setLoading(true);
    const params = new URLSearchParams(query ? `?${query}` : "");
    params.set("cursor", cursor);
    const response = await fetch(`/api/posts?${params.toString()}`);
    const data = (await response.json()) as { items: FeedPost[]; nextCursor: string | null };
    setItems((prev) => [...prev, ...data.items]);
    setCursor(data.nextCursor);
    setLoading(false);
  }

  if (items.length === 0) {
    return (
      <div className="card-soft flex flex-col items-center gap-3 px-6 py-12 text-center">
        <span className="text-4xl animate-[float_7s_ease-in-out_infinite]" aria-hidden>
          ☁
        </span>
        <h2 className="text-lg font-bold text-ink">{emptyTitle}</h2>
        <p className="max-w-xs text-sm text-ink-soft">{emptyText}</p>
        <ComposerLauncherButton viewer={viewer} label="💗 Criar Momento" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {items.map((post) => (
        <PostCard key={post.id} post={post} viewer={viewer} />
      ))}

      {cursor && (
        <button
          type="button"
          onClick={() => void loadMore()}
          disabled={loading}
          className="min-h-12 rounded-full border border-brand-pastel bg-white/80 text-sm font-bold text-brand transition hover:bg-white disabled:opacity-60"
        >
          {loading ? "Carregando..." : "Ver momentos anteriores"}
        </button>
      )}
    </div>
  );
}
