"use client";

import { useState } from "react";
import { FeedList } from "@/components/feed/FeedList";
import type { FeedPost } from "@/lib/data";

type Viewer = { id: number; username: string; displayName: string; avatarUrl: string | null };

const TABS = [
  { key: "posts", label: "Posts", query: "" },
  { key: "momentos", label: "Momentos", query: "special=1" },
  { key: "midia", label: "Mídia", query: "media=1" },
  { key: "curtidas", label: "Curtidas", query: "liked=1" },
  { key: "salvos", label: "Salvos", query: "saved=1" },
];

export function ProfileTabs({
  username,
  viewer,
  initial,
  nextCursor,
}: {
  username: string;
  viewer: Viewer;
  initial: FeedPost[];
  nextCursor: string | null;
}) {
  const [tab, setTab] = useState("posts");
  const [cache, setCache] = useState<Record<string, { items: FeedPost[]; cursor: string | null }>>({
    posts: { items: initial, cursor: nextCursor },
  });
  const [loading, setLoading] = useState(false);

  const active = TABS.find((t) => t.key === tab) ?? TABS[0];

  async function select(key: string) {
    setTab(key);
    if (cache[key]) return;
    const query = TABS.find((t) => t.key === key)?.query ?? "";
    setLoading(true);
    const response = await fetch(`/api/posts?author=${viewer.id}${query ? `&${query}` : ""}`);
    const data = (await response.json()) as { items: FeedPost[]; nextCursor: string | null };
    setCache((prev) => ({ ...prev, [key]: { items: data.items, cursor: data.nextCursor } }));
    setLoading(false);
  }

  const state = cache[tab] ?? { items: [], cursor: null };

  return (
    <div className="flex flex-col gap-4">
      <div
        role="tablist"
        aria-label="Conteúdo do perfil"
        className="card-soft flex gap-1 overflow-x-auto p-1.5 no-scrollbar"
      >
        {TABS.map((item) => (
          <button
            key={item.key}
            role="tab"
            aria-selected={tab === item.key}
            onClick={() => void select(item.key)}
            className={`min-h-11 flex-1 whitespace-nowrap rounded-full px-4 text-sm font-bold transition ${
              tab === item.key ? "bg-brand text-white shadow" : "text-ink-soft hover:bg-brand-pastel/40 hover:text-brand"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          <div className="skeleton h-40 w-full" />
          <div className="skeleton h-40 w-full" />
        </div>
      ) : (
        <FeedList
          key={tab}
          initial={state.items}
          nextCursor={state.cursor}
          viewer={viewer}
          query={`author=${viewer.id}${active.query ? `&${active.query}` : ""}`}
          emptyTitle={`Nada por aqui ainda 💗`}
          emptyText={`Quando houver ${active.label.toLowerCase()} de @${username}, eles aparecem neste cantinho.`}
        />
      )}
    </div>
  );
}
