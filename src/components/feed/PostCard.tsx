"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { ActionDialog } from "@/components/ui/ActionDialog";
import { useToast } from "@/components/ui/toast";
import { clock, fullDate, timeAgo } from "@/lib/format";
import type { CommentItem, FeedPost } from "@/lib/data";

type Viewer = { id: number; displayName: string; username: string; avatarUrl: string | null };

export function PostCard({ post, viewer, onDeleted }: { post: FeedPost; viewer: Viewer; onDeleted?: (id: number) => void }) {
  const { toast } = useToast();
  const [liked, setLiked] = useState(post.liked);
  const [saved, setSaved] = useState(post.saved);
  const [isSpecial, setIsSpecial] = useState(post.isSpecial);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [beat, setBeat] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [content, setContent] = useState(post.content);
  const [updatedAt, setUpdatedAt] = useState(post.updatedAt);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [albumOpen, setAlbumOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [albums, setAlbums] = useState<{ id: number; title: string }[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState<Record<"like" | "save" | "special", boolean>>({ like: false, save: false, special: false });
  const actionLocks = useRef(new Set<string>());
  const mine = post.author.id === viewer.id;

  async function react(action: "like" | "save" | "special") {
    if (actionLocks.current.has(action)) return;
    actionLocks.current.add(action);
    setActionBusy((current) => ({ ...current, [action]: true }));
    const oldLiked = liked, oldSaved = saved, oldCount = likeCount;
    if (action === "like") { setLiked(!liked); setLikeCount(Math.max(0, likeCount + (liked ? -1 : 1))); }
    if (action === "save") setSaved(!saved);
    const response = await fetch(`/api/posts/${post.id}/react?action=${action}`, { method: "POST" }).catch(() => null);
    if (!response?.ok) {
      setLiked(oldLiked); setSaved(oldSaved); setLikeCount(oldCount); actionLocks.current.delete(action); setActionBusy((current) => ({ ...current, [action]: false }));
      toast("Não conseguimos fazer isso agora.", "error");
      return;
    }
    const data = (await response.json()) as { liked?: boolean; saved?: boolean; isSpecial?: boolean };
    if (action === "like") {
      const nextLiked = Boolean(data.liked);
      setLiked(nextLiked);
      if (nextLiked) {
        setBeat(true);
        window.setTimeout(() => setBeat(false), 620);
      }
    }
    if (action === "save") {
      setSaved(Boolean(data.saved));
      toast(data.saved ? "Momento salvo 🔖" : "Removido dos salvos");
    }
    if (action === "special") {
      setIsSpecial(Boolean(data.isSpecial));
      toast(data.isSpecial ? "Marcado como Momento Especial ✨" : "Deixou de ser especial");
    }
    actionLocks.current.delete(action);
    setActionBusy((current) => ({ ...current, [action]: false }));
  }

  async function loadComments() {
    setCommentsLoading(true);
    try {
      const response = await fetch(`/api/posts/${post.id}/comments`);
      if (!response.ok) throw new Error();
      const data = (await response.json()) as { items: CommentItem[] };
      setComments(data.items ?? []);
      setCommentCount(data.items?.length ?? 0);
    } catch { toast("Não foi possível carregar os comentários.", "error"); }
    finally { setCommentsLoading(false); }
  }

  async function savePostEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy("edit");
    const response = await fetch(`/api/posts/${post.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) }).catch(() => null);
    setBusy(null);
    if (!response?.ok) { toast("Não foi possível editar o momento.", "error"); return; }
    const data = await response.json() as { post: { updatedAt: string | null } };
    setUpdatedAt(data.post.updatedAt); setEditOpen(false); toast("Momento atualizado");
  }

  async function deletePost() {
    if (busy) return;
    setBusy("delete");
    const response = await fetch(`/api/posts/${post.id}`, { method: "DELETE" }).catch(() => null);
    setBusy(null);
    if (!response?.ok) { toast("Não foi possível excluir o momento.", "error"); return; }
    toast("Momento excluído"); onDeleted?.(post.id);
  }

  async function openAlbumPicker() {
    setBusy("albums");
    try {
      const response = await fetch("/api/albums");
      if (!response.ok) throw new Error();
      const data = await response.json() as { items: { id: number; title: string }[] };
      setAlbums(data.items); setAlbumOpen(true);
    } catch { toast("Não foi possível carregar os álbuns.", "error"); }
    finally { setBusy(null); }
  }

  async function addToAlbum(albumId: number | null) {
    const response = await fetch(`/api/posts/${post.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ albumId }) }).catch(() => null);
    if (!response?.ok) { toast("Não foi possível atualizar o álbum.", "error"); return; }
    setAlbumOpen(false); toast(albumId ? "Momento adicionado ao álbum âœ¨" : "Momento removido do álbum");
  }

  function toggleComments() {
    const next = !commentsOpen;
    setCommentsOpen(next);
    if (next && comments.length === 0) void loadComments();
  }

  return (
    <article
      id={`post-${post.id}`}
      className="animate-[fade-in_0.35s_ease] card-soft scroll-mt-20 overflow-hidden"
    >
      {isSpecial && (
        <p className="flex items-center gap-2 border-b border-brand-pastel/70 bg-brand-pastel/25 px-4 py-2 text-xs font-bold uppercase tracking-wide text-brand">
          <span aria-hidden>✨</span> Momento Especial{post.specialTitle ? ` · ${post.specialTitle}` : ""}
        </p>
      )}

      <header className="flex items-center gap-3 p-4 pb-3">
        <Link href={`/perfil/${post.author.username}`} aria-label={`Ver perfil de ${post.author.displayName}`}>
          <Avatar name={post.author.displayName} src={post.author.avatarUrl} size="lg" />
        </Link>
        <div className="min-w-0">
          <Link href={`/perfil/${post.author.username}`} className="block truncate text-sm font-bold text-ink hover:underline">
            {post.author.displayName}
          </Link>
          <p className="truncate text-xs text-ink-soft">
            @{post.author.username} • <time dateTime={post.createdAt}>{timeAgo(post.createdAt)}</time>{updatedAt && <span> · editado</span>}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
          className="ml-auto grid h-10 w-10 place-items-center rounded-full text-ink-soft transition hover:bg-brand-pastel/40 hover:text-brand"
          aria-label="Opções do momento"
        >
          <span aria-hidden>⋯</span>
        </button>
      </header>

      {content && (
        <p className="whitespace-pre-wrap px-4 pb-3 text-[15px] leading-relaxed text-ink">{content}</p>
      )}

      {post.media.length > 0 && (
        <PostMediaGrid media={post.media} onOpen={(index) => setLightbox(index)} />
      )}

      {post.music && (
        <div className="mx-4 mt-3 flex items-center gap-3 rounded-2xl border border-brand-pastel/80 bg-white/70 p-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-pastel/60 text-lg" aria-hidden>
            🎵
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-ink">{post.music.title}</p>
            <p className="truncate text-xs text-ink-soft">{post.music.artist || "Nossa música"}</p>
          </div>
          {post.music.url && <span className="ml-auto text-xs font-semibold text-brand">▶</span>}
        </div>
      )}

      <div className="mt-2 flex items-center gap-1 border-t border-brand-pastel/60 px-2 py-1.5">
        <ActionButton
          onClick={() => void react("like")}
          disabled={actionBusy.like}
          active={liked}
          activeClass="text-brand"
          label={liked ? "Curtido" : "Curtir"}
          icon={liked ? "♥" : "♡"}
          extraClass={beat ? "animate-[beat_0.6s_ease-in-out]" : ""}
          count={likeCount}
        />
        <ActionButton
          onClick={toggleComments}
          active={commentsOpen}
          activeClass="text-brand"
          label="Comentar"
          icon="💬"
          count={commentCount}
          ariaExpanded={commentsOpen}
        />
        <ActionButton
          onClick={() => void react("save")}
          disabled={actionBusy.save}
          active={saved}
          activeClass="text-brand"
          label={saved ? "Salvo" : "Salvar"}
          icon="🔖"
        />
        {mine && <ActionButton
          onClick={() => void react("special")}
          disabled={actionBusy.special}
          active={isSpecial}
          activeClass="text-brand"
          label="Especial"
          icon="✨"
        />}
      </div>

      {commentsOpen && commentsLoading && <div className="border-t border-brand-pastel/60 bg-brand-pastel/10 px-4 py-3"><div className="skeleton h-12 w-full" /></div>}
      {commentsOpen && !commentsLoading && (
        <CommentSection
          postId={post.id}
          viewer={viewer}
          initial={comments}
          loading={false}
          onLoaded={(items) => {
            setComments(items);
            setCommentCount(items.length);
          }}
          onCountChange={setCommentCount}
        />
      )}

      {lightbox !== null && (
        <Lightbox
          post={post}
          index={lightbox}
          liked={liked}
          onClose={() => setLightbox(null)}
          onNavigate={(next) => setLightbox(next)}
          onLike={() => void react("like")}
        />
      )}
      {menuOpen && <ActionDialog title="Opções do momento" onClose={() => setMenuOpen(false)}><div role="menu" className="flex flex-col gap-1">
        {mine ? <>
          <MenuAction onClick={() => { setMenuOpen(false); setEditOpen(true); }}>Editar post</MenuAction>
          <MenuAction onClick={() => { setMenuOpen(false); void react("special"); }}>{isSpecial ? "Desmarcar Momento Especial" : "Marcar Momento Especial"}</MenuAction>
          <MenuAction onClick={() => { setMenuOpen(false); void openAlbumPicker(); }}>Adicionar ao álbum</MenuAction>
          {post.albumId && <MenuAction onClick={() => { setMenuOpen(false); void addToAlbum(null); }}>Remover do álbum</MenuAction>}
          <MenuAction danger onClick={() => { setMenuOpen(false); setConfirmDelete(true); }}>Excluir post</MenuAction>
        </> : <>
          <MenuAction onClick={() => { setMenuOpen(false); void react("save"); }}>{saved ? "Remover dos salvos" : "Salvar"}</MenuAction>
          <MenuAction onClick={() => void navigator.clipboard.writeText(`${location.origin}/post/${post.id}`).then(() => { setMenuOpen(false); toast("Link copiado"); }).catch(() => toast("Não foi possível copiar o link.", "error"))}>Copiar link</MenuAction>
        </>}
      </div></ActionDialog>}
      {editOpen && <ActionDialog title="Editar momento" onClose={() => setEditOpen(false)}><form onSubmit={(event) => void savePostEdit(event)} className="flex flex-col gap-3"><textarea value={content} onChange={(event) => setContent(event.target.value)} maxLength={5000} rows={5} aria-label="Texto do momento" className="w-full rounded-2xl border border-brand-pastel bg-white p-3 text-sm text-ink outline-none focus:border-brand" /><button disabled={busy === "edit"} className="min-h-11 rounded-full bg-brand px-4 font-bold text-white disabled:opacity-50">{busy === "edit" ? "Salvando..." : "Salvar"}</button></form></ActionDialog>}
      {confirmDelete && <ActionDialog title="Excluir este momento? 💭" onClose={() => setConfirmDelete(false)}><p className="text-sm text-ink-soft">Os comentários e interações associados poderão ser removidos.</p><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setConfirmDelete(false)} className="min-h-11 rounded-full border border-brand-pastel px-4 text-sm font-bold text-ink">Cancelar</button><button type="button" disabled={busy === "delete"} onClick={() => void deletePost()} className="min-h-11 rounded-full bg-brand px-4 text-sm font-bold text-white disabled:opacity-50">{busy === "delete" ? "Excluindo..." : "Excluir Momento"}</button></div></ActionDialog>}
      {albumOpen && <ActionDialog title="Adicionar momento a..." onClose={() => setAlbumOpen(false)}><ul className="flex max-h-72 flex-col gap-2 overflow-auto">{albums.map((album) => <li key={album.id}><button type="button" onClick={() => void addToAlbum(album.id)} className="min-h-12 w-full rounded-2xl border border-brand-pastel px-4 text-left text-sm font-semibold text-ink hover:bg-brand-pastel/25">♡ {album.title}</button></li>)}</ul>{albums.length === 0 && <p className="text-sm text-ink-soft">Nenhum álbum disponível.</p>}</ActionDialog>}
    </article>
  );
}

function MenuAction({ children, onClick, danger = false }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return <button type="button" role="menuitem" onClick={onClick} className={`min-h-11 w-full rounded-xl px-3 text-left text-sm font-semibold transition hover:bg-brand-pastel/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand ${danger ? "text-red-600" : "text-ink"}`}>{children}</button>;
}

function ActionButton({
  icon,
  label,
  onClick,
  active,
  activeClass,
  extraClass = "",
  count,
  ariaExpanded,
  disabled = false,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  active?: boolean;
  activeClass?: string;
  extraClass?: string;
  count?: number;
  ariaExpanded?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      aria-expanded={ariaExpanded}
      className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl px-2 text-sm font-semibold transition hover:bg-brand-pastel/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand active:scale-[0.97] ${
        active ? activeClass : "text-ink-soft"
      } ${extraClass} disabled:opacity-60`}
    >
      <span aria-hidden className={active ? "text-base" : "text-base"}>
        {icon}
      </span>
      <span className="hidden sm:inline">{label}</span>
      {typeof count === "number" && <span className="text-xs tabular-nums">{count}</span>}
    </button>
  );
}

function PostMediaGrid({
  media,
  onOpen,
}: {
  media: FeedPost["media"];
  onOpen: (index: number) => void;
}) {
  const total = media.length;

  if (total === 1) {
    const item = media[0];
    return (
      <div className="px-0">
        {item.kind === "video" ? (
          <VideoTile item={item} onOpen={() => onOpen(0)} />
        ) : (
          <button type="button" onClick={() => onOpen(0)} className="block w-full" aria-label="Abrir foto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.url}
              alt={item.alt ?? "Foto do momento"}
              loading="lazy"
              className="max-h-[560px] w-full bg-brand-pastel/30 object-cover"
            />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`grid gap-0.5 ${total === 2 ? "grid-cols-2" : "grid-cols-2"}`}>
      {media.slice(0, 4).map((item, index) => {
        const overlay = total > 4 && index === 3;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onOpen(index)}
            aria-label={`Abrir mídia ${index + 1} de ${total}`}
            className={`relative overflow-hidden bg-brand-pastel/30 ${total === 3 && index === 0 ? "row-span-2" : ""}`}
          >
            {item.kind === "video" ? (
              <VideoTile item={item} onOpen={() => onOpen(index)} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.url}
                alt={item.alt ?? `Foto ${index + 1}`}
                loading="lazy"
                className="h-full min-h-[150px] w-full object-cover sm:min-h-[190px]"
              />
            )}
            {overlay && (
              <span className="absolute inset-0 grid place-items-center bg-ink/45 text-2xl font-bold text-white">
                +{total - 4}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function VideoTile({ item, onOpen }: { item: FeedPost["media"][number]; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="relative block w-full" aria-label="Abrir vídeo">
      <video src={item.url} className="h-full min-h-[170px] w-full object-cover" preload="metadata" muted playsInline />
      <span className="absolute inset-0 grid place-items-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-white/85 text-xl text-brand shadow">▶</span>
      </span>
      {item.durationSec ? (
        <span className="absolute bottom-2 right-2 rounded-full bg-ink/70 px-2 py-0.5 text-xs font-semibold text-white">
          {clock(item.durationSec)}
        </span>
      ) : null}
    </button>
  );
}

function Lightbox({
  post,
  index,
  liked,
  onClose,
  onNavigate,
  onLike,
}: {
  post: FeedPost;
  index: number;
  liked: boolean;
  onClose: () => void;
  onNavigate: (next: number) => void;
  onLike: () => void;
}) {
  const item = post.media[index];
  const dialogRef = useRef<HTMLDivElement>(null);

  const move = useCallback(
    (delta: number) => {
      const total = post.media.length;
      onNavigate((index + delta + total) % total);
    },
    [index, onNavigate, post.media.length],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") move(1);
      if (event.key === "ArrowLeft") move(-1);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [move, onClose]);

  if (!item) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Visualização de mídia"
      tabIndex={-1}
      className="fixed inset-0 z-[75] flex flex-col bg-ink/80 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex items-center justify-between gap-2 p-3 text-white">
        <p className="text-sm font-semibold">
          {index + 1} / {post.media.length}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onLike}
            className="grid h-11 w-11 place-items-center rounded-full bg-white/15 text-lg text-white transition hover:bg-white/25"
            aria-label={liked ? "Remover curtida" : "Favoritar"}
          >
            <span aria-hidden>{liked ? "♥" : "♡"}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="grid h-11 w-11 place-items-center rounded-full bg-white/15 text-lg text-white transition hover:bg-white/25"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-2 pb-2">
        <button
          type="button"
          onClick={() => move(-1)}
          className="absolute left-2 grid h-12 w-12 place-items-center rounded-full bg-white/15 text-xl text-white transition hover:bg-white/30"
          aria-label="Anterior"
        >
          ←
        </button>
        {item.kind === "video" ? (
          <video src={item.url} controls autoPlay={false} playsInline className="max-h-[75vh] w-auto max-w-full rounded-2xl" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.url}
            alt={item.alt ?? "Foto do momento"}
            className="max-h-[75vh] w-auto max-w-full rounded-2xl object-contain"
          />
        )}
        <button
          type="button"
          onClick={() => move(1)}
          className="absolute right-2 grid h-12 w-12 place-items-center rounded-full bg-white/15 text-xl text-white transition hover:bg-white/30"
          aria-label="Próxima"
        >
          →
        </button>
      </div>

      <div className="bg-surface/90 px-4 py-3 text-ink">
        <p className="text-sm font-bold">
          {post.author.displayName} <span className="font-normal text-ink-soft">• {fullDate(post.createdAt)}</span>
        </p>
        {post.content && <p className="mt-1 line-clamp-3 text-sm text-ink-soft">{post.content}</p>}
      </div>
    </div>
  );
}

function CommentSection({
  postId,
  viewer,
  initial,
  loading,
  onLoaded,
  onCountChange,
}: {
  postId: number;
  viewer: Viewer;
  initial: CommentItem[];
  loading: boolean;
  onLoaded: (items: CommentItem[]) => void;
  onCountChange: (count: number) => void;
}) {
  const { toast } = useToast();
  const [items, setItems] = useState<CommentItem[]>(initial);
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [pending, setPending] = useState(false);

  async function send() {
    if (!value.trim() || sending) return;
    setSending(true);
    const response = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: value }),
    }).catch(() => null);
    setSending(false);
    if (!response?.ok) {
      toast("Não deu para enviar o comentário.", "error");
      return;
    }
    const data = (await response.json()) as { items: CommentItem[] };
    setItems(data.items);
    onLoaded(data.items);
    onCountChange(data.items.length);
    setValue("");
    toast("Comentário publicado");
  }

  async function saveEdit(id: number) {
    if (pending) return;
    setPending(true);
    const response = await fetch(`/api/comments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editValue }),
    }).catch(() => null);
    setPending(false);
    if (!response?.ok) {
      toast("Só é possível editar o seu comentário.", "error");
      return;
    }
    setItems((prev) => prev.map((c) => (c.id === id ? { ...c, content: editValue.trim(), edited: true } : c)));
    setEditingId(null);
    toast("Comentário atualizado");
  }

  async function remove(id: number) {
    if (pending) return;
    setPending(true);
    const response = await fetch(`/api/comments/${id}`, { method: "DELETE" }).catch(() => null);
    setPending(false);
    if (!response?.ok) {
      toast("Só é possível excluir o seu comentário.", "error");
      return;
    }
    const next = items.filter((c) => c.id !== id);
    setItems(next);
    onLoaded(next);
    onCountChange(next.length);
    setDeleteId(null);
    toast("Comentário excluído");
  }

  return (
    <div className="border-t border-brand-pastel/60 bg-brand-pastel/10 px-4 py-3">
      {loading && <div className="skeleton h-12 w-full" />}

      {!loading && items.length === 0 && (
        <p className="py-2 text-sm text-ink-soft">Nenhum comentário ainda — diga algo fofo 💕</p>
      )}

      <ul className="flex flex-col gap-3">
        {items.map((comment) => (
          <li key={comment.id} className="flex gap-2">
            <Avatar name={comment.author.displayName} src={comment.author.avatarUrl} size="sm" ring={false} />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-ink-soft">
                <span className="font-bold text-ink">{comment.author.displayName}</span> @{comment.author.username} •{" "}
                {timeAgo(comment.createdAt)}
                {comment.edited ? " • editado" : ""}
              </p>
              {editingId === comment.id ? (
                <div className="mt-1 flex gap-2">
                  <input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1 rounded-xl border border-brand-pastel bg-white px-3 py-2 text-sm outline-none"
                    aria-label="Editar comentário"
                  />
                  <button
                    type="button"
                    onClick={() => void saveEdit(comment.id)}
                    disabled={pending || !editValue.trim()}
                    className="min-h-11 rounded-xl bg-brand px-3 text-sm font-bold text-white disabled:opacity-50"
                  >
                    Salvar
                  </button>
                  <button type="button" onClick={() => setEditingId(null)} className="min-h-11 rounded-xl border border-brand-pastel px-3 text-sm font-bold text-ink">Cancelar</button>
                </div>
              ) : (
                <p className="whitespace-pre-wrap break-words text-sm text-ink">{comment.content}</p>
              )}
              {comment.mine && editingId !== comment.id && (
                <div className="mt-1 flex gap-3 text-xs font-semibold text-ink-soft">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(comment.id);
                      setEditValue(comment.content);
                    }}
                    className="hover:text-brand"
                  >
                    editar
                  </button>
                  <button type="button" onClick={() => setDeleteId(comment.id)} className="hover:text-brand">
                    excluir
                  </button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      <form
        className="mt-3 flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        <Avatar name={viewer.displayName} src={viewer.avatarUrl} size="sm" ring={false} />
        <label className="sr-only" htmlFor={`comment-${postId}`}>
          Escreva um comentário
        </label>
        <input
          id={`comment-${postId}`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Escreva um comentário..."
          className="min-h-11 flex-1 rounded-full border border-brand-pastel bg-white px-4 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={sending || !value.trim()}
          className="min-h-11 rounded-full bg-brand px-4 text-sm font-bold text-white transition disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
      {deleteId !== null && <ActionDialog title="Excluir este comentário?" onClose={() => setDeleteId(null)}><p className="text-sm text-ink-soft">Essa ação não poderá ser desfeita.</p><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setDeleteId(null)} className="min-h-11 rounded-full border border-brand-pastel px-4 text-sm font-bold text-ink">Cancelar</button><button type="button" disabled={pending} onClick={() => void remove(deleteId)} className="min-h-11 rounded-full bg-brand px-4 text-sm font-bold text-white disabled:opacity-50">{pending ? "Excluindo..." : "Excluir"}</button></div></ActionDialog>}
    </div>
  );
}

