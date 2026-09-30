"use client";

import Link from "next/link";
import { FeedPost } from "@/lib/data";

type Viewer = { id: number; username: string; displayName: string; avatarUrl: string | null };

function yearsAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days >= 730) return `${Math.floor(days / 365)} anos`;
  if (days >= 365) return "1 ano";
  if (days >= 60) return `${Math.floor(days / 30)} meses`;
  return `${days} dias`;
}

export function ThrowbackCard({ post, viewer }: { post: FeedPost; viewer: Viewer }) {
  if (!post.media[0]) return null;

  return (
    <section className="card-soft overflow-hidden" aria-label="Lembra disso?">
      <h2 className="px-4 pt-4 text-sm font-bold uppercase tracking-wide text-ink-soft">✨ Lembra disso?</h2>
      {post.media[0].kind === "video" ? (
        <video
          src={post.media[0].url}
          className="mt-3 h-48 w-full object-cover"
          preload="metadata"
          muted
          playsInline
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.media[0].url}
          alt={post.media[0].alt ?? "Memória antiga de vocês"}
          loading="lazy"
          className="mt-3 h-48 w-full object-cover"
        />
      )}
      <div className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">
          Há {yearsAgo(post.createdAt)}
        </p>
        <p className="mt-1 line-clamp-3 text-sm text-ink">{post.content || "Um momento guardado 💗"}</p>
        <Link
          href={`/post/${post.id}`}
          className="mt-3 inline-block text-xs font-bold text-brand underline decoration-dotted"
        >
          ver momento
        </Link>
      </div>
    </section>
  );
}