import { and, asc, desc, eq, gt, inArray, isNull, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  albums,
  albumMemories,
  comments,
  notifications,
  postMedia,
  posts,
  profiles,
  reactions,
  savedPosts,
  settings,
  specialDates,
  tracks,
  wallMessages,
  type Album,
  type AlbumMemory,
  type SettingsRow,
  type SpecialDate,
  type Track,
  type WallMessage,
} from "@/db/schema";
import { daysUntil } from "./format";
import { ensureBootstrap } from "./bootstrap";

export type MediaItem = {
  id: number;
  url: string;
  kind: string;
  posterUrl: string | null;
  durationSec: number | null;
  alt: string | null;
};

export type Author = { id: number; username: string; displayName: string; avatarUrl: string | null };

export type FeedPost = {
  id: number;
  content: string;
  isSpecial: boolean;
  specialTitle: string | null;
  albumId: number | null;
  createdAt: string;
  updatedAt: string | null;
  music: { title: string; artist: string; url: string; cover: string | null } | null;
  author: Author;
  media: MediaItem[];
  likeCount: number;
  commentCount: number;
  liked: boolean;
  saved: boolean;
};

export type FeedFilter = {
  cursor?: string | null;
  limit?: number;
  authorId?: number;
  onlySpecial?: boolean;
  onlySavedFor?: number;
  onlyLikedFor?: number;
  onlyMedia?: boolean;
};

function basePostSelect(viewerId: number) {
  return {
    id: posts.id,
    content: posts.content,
    isSpecial: posts.isSpecial,
    specialTitle: posts.specialTitle,
    albumId: posts.albumId,
    createdAt: posts.createdAt,
    updatedAt: posts.updatedAt,
    musicTitle: posts.musicTitle,
    musicArtist: posts.musicArtist,
    musicUrl: posts.musicUrl,
    musicCover: posts.musicCover,
    authorId: profiles.id,
    username: profiles.username,
    displayName: profiles.displayName,
    avatarUrl: profiles.avatarUrl,
    likeCount: sql<number>`(select count(*)::int from ${reactions} where ${reactions.postId} = ${posts.id})`,
    commentCount: sql<number>`(select count(*)::int from ${comments} where ${comments.postId} = ${posts.id})`,
    liked: sql<boolean>`exists(select 1 from ${reactions} where ${reactions.postId} = ${posts.id} and ${reactions.profileId} = ${viewerId})`,
    saved: sql<boolean>`exists(select 1 from ${savedPosts} where ${savedPosts.postId} = ${posts.id} and ${savedPosts.profileId} = ${viewerId})`,
  };
}

type RawPost = {
  id: number;
  content: string;
  isSpecial: boolean;
  specialTitle: string | null;
  albumId: number | null;
  createdAt: Date;
  updatedAt: Date | null;
  musicTitle: string | null;
  musicArtist: string | null;
  musicUrl: string | null;
  musicCover: string | null;
  authorId: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  likeCount: number;
  commentCount: number;
  liked: boolean;
  saved: boolean;
};

async function attachMedia(rows: RawPost[]): Promise<FeedPost[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const media = await db
    .select()
    .from(postMedia)
    .where(inArray(postMedia.postId, ids))
    .orderBy(asc(postMedia.position), asc(postMedia.id));

  const grouped = new Map<number, MediaItem[]>();
  for (const m of media) {
    const list = grouped.get(m.postId) ?? [];
    list.push({
      id: m.id,
      url: m.url,
      kind: m.kind,
      posterUrl: m.posterUrl,
      durationSec: m.durationSec,
      alt: m.alt,
    });
    grouped.set(m.postId, list);
  }

  return rows.map((r) => ({
    id: r.id,
    content: r.content,
    isSpecial: r.isSpecial,
    specialTitle: r.specialTitle,
    albumId: r.albumId,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt?.toISOString() ?? null,
    music:
      r.musicUrl || r.musicTitle
        ? {
            title: r.musicTitle ?? "",
            artist: r.musicArtist ?? "",
            url: r.musicUrl ?? "",
            cover: r.musicCover,
          }
        : null,
    author: {
      id: r.authorId,
      username: r.username,
      displayName: r.displayName,
      avatarUrl: r.avatarUrl,
    },
    media: grouped.get(r.id) ?? [],
    likeCount: Number(r.likeCount ?? 0),
    commentCount: Number(r.commentCount ?? 0),
    liked: Boolean(r.liked),
    saved: Boolean(r.saved),
  }));
}

export async function getFeed(viewerId: number, filter: FeedFilter = {}): Promise<FeedPost[]> {
  await ensureBootstrap();
  const limit = Math.min(Math.max(filter.limit ?? 10, 1), 30);
  const conditions = [];
  if (filter.cursor) {
    const d = new Date(filter.cursor);
    if (!Number.isNaN(d.getTime())) conditions.push(lt(posts.createdAt, d));
  }
  if (filter.authorId) conditions.push(eq(posts.authorId, filter.authorId));
  if (filter.onlySpecial) conditions.push(eq(posts.isSpecial, true));
  if (filter.onlyMedia) conditions.push(sql`exists(select 1 from ${postMedia} where ${postMedia.postId} = ${posts.id})`);
  if (filter.onlySavedFor) {
    conditions.push(
      sql`exists(select 1 from ${savedPosts} where ${savedPosts.postId} = ${posts.id} and ${savedPosts.profileId} = ${filter.onlySavedFor})`,
    );
  }
  if (filter.onlyLikedFor) {
    conditions.push(
      sql`exists(select 1 from ${reactions} where ${reactions.postId} = ${posts.id} and ${reactions.profileId} = ${filter.onlyLikedFor})`,
    );
  }

  const rows = await db
    .select(basePostSelect(viewerId))
    .from(posts)
    .innerJoin(profiles, eq(profiles.id, posts.authorId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(posts.createdAt), desc(posts.id))
    .limit(limit);

  return attachMedia(rows);
}

export async function getPostById(viewerId: number, postId: number): Promise<FeedPost | null> {
  const rows = await db
    .select(basePostSelect(viewerId))
    .from(posts)
    .innerJoin(profiles, eq(profiles.id, posts.authorId))
    .where(eq(posts.id, postId))
    .limit(1);
  const [post] = await attachMedia(rows);
  return post ?? null;
}

export type CommentItem = {
  id: number;
  content: string;
  createdAt: string;
  edited: boolean;
  author: Author;
  mine: boolean;
};

export async function getComments(postId: number, viewerId: number): Promise<CommentItem[]> {
  const rows = await db
    .select({
      id: comments.id,
      content: comments.content,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt,
      authorId: profiles.id,
      username: profiles.username,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
    })
    .from(comments)
    .innerJoin(profiles, eq(profiles.id, comments.authorId))
    .where(eq(comments.postId, postId))
    .orderBy(asc(comments.createdAt));

  return rows.map((r) => ({
    id: r.id,
    content: r.content,
    createdAt: r.createdAt.toISOString(),
    edited: Boolean(r.updatedAt),
    author: {
      id: r.authorId,
      username: r.username,
      displayName: r.displayName,
      avatarUrl: r.avatarUrl,
    },
    mine: r.authorId === viewerId,
  }));
}

export type NotificationItem = {
  id: number;
  kind: string;
  message: string;
  read: boolean;
  createdAt: string;
  postId: number | null;
  actorName: string | null;
  actorAvatar: string | null;
  mediaUrl: string | null;
};

export async function getNotifications(profileId: number, limit = 30): Promise<NotificationItem[]> {
  await ensureBootstrap();
  const actor = sql<string | null>`(select display_name from ${profiles} where ${profiles.id} = ${notifications.actorId})`;
  const avatar = sql<string | null>`(select avatar_url from ${profiles} where ${profiles.id} = ${notifications.actorId})`;
  const mediaUrl = sql<string | null>`(select ${postMedia.url} from ${postMedia} where ${postMedia.postId} = ${notifications.postId} order by ${postMedia.position}, ${postMedia.id} limit 1)`;
  const rows = await db
    .select({
      id: notifications.id,
      kind: notifications.kind,
      message: notifications.message,
      readAt: notifications.readAt,
      createdAt: notifications.createdAt,
      postId: notifications.postId,
      actorName: actor,
      actorAvatar: avatar,
      mediaUrl,
    })
    .from(notifications)
    .where(eq(notifications.profileId, profileId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    message: r.message,
    read: Boolean(r.readAt),
    createdAt: r.createdAt.toISOString(),
    postId: r.postId,
    actorName: r.actorName,
    actorAvatar: r.actorAvatar,
    mediaUrl: r.mediaUrl,
  }));
}

export async function getUnreadCount(profileId: number): Promise<number> {
  try {
    const rows = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.profileId, profileId), isNull(notifications.readAt)));
    return Number(rows[0]?.total ?? 0);
  } catch {
    return 0;
  }
}

export type AlbumWithMeta = Album & { photoCount: number; videoCount: number };

export async function getAlbums(): Promise<AlbumWithMeta[]> {
  await ensureBootstrap();
  const rows = await db.select().from(albums).orderBy(desc(albums.createdAt));
  if (rows.length === 0) return [];
  const counts = await db
    .select({
      albumId: albumMemories.albumId,
      kind: albumMemories.kind,
      total: sql<number>`count(*)::int`,
    })
    .from(albumMemories)
    .where(
      inArray(
        albumMemories.albumId,
        rows.map((r) => r.id),
      ),
    )
    .groupBy(albumMemories.albumId, albumMemories.kind);
  const linkedCounts = await db
    .select({ albumId: posts.albumId, kind: postMedia.kind, total: sql<number>`count(*)::int` })
    .from(posts)
    .innerJoin(postMedia, eq(postMedia.postId, posts.id))
    .where(inArray(posts.albumId, rows.map((r) => r.id)))
    .groupBy(posts.albumId, postMedia.kind);

  return rows.map((a) => ({
    ...a,
    photoCount: Number(counts.find((c) => c.albumId === a.id && c.kind === "image")?.total ?? 0) + Number(linkedCounts.find((c) => c.albumId === a.id && c.kind === "image")?.total ?? 0),
    videoCount: Number(counts.find((c) => c.albumId === a.id && c.kind === "video")?.total ?? 0) + Number(linkedCounts.find((c) => c.albumId === a.id && c.kind === "video")?.total ?? 0),
  }));
}

export async function getAlbum(
  id: number,
): Promise<{ album: Album; memories: AlbumMemory[] } | null> {
  const rows = await db.select().from(albums).where(eq(albums.id, id)).limit(1);
  const album = rows[0];
  if (!album) return null;
  const memories = await db
    .select()
    .from(albumMemories)
    .where(eq(albumMemories.albumId, id))
    .orderBy(desc(albumMemories.createdAt));
  const linked = await db
    .select({ id: postMedia.id, url: postMedia.url, kind: postMedia.kind, caption: posts.content, createdAt: postMedia.createdAt })
    .from(posts)
    .innerJoin(postMedia, eq(postMedia.postId, posts.id))
    .where(eq(posts.albumId, id))
    .orderBy(desc(postMedia.createdAt));
  return {
    album,
    memories: [...memories, ...linked.map((item) => ({ ...item, albumId: id, id: -item.id }))].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),
  };
}

export async function getWallMessages(): Promise<(WallMessage & { authorName: string | null })[]> {
  await ensureBootstrap();
  const rows = await db
    .select({
      id: wallMessages.id,
      authorId: wallMessages.authorId,
      content: wallMessages.content,
      emoji: wallMessages.emoji,
      createdAt: wallMessages.createdAt,
      authorName: profiles.displayName,
    })
    .from(wallMessages)
    .leftJoin(profiles, eq(profiles.id, wallMessages.authorId))
    .orderBy(desc(wallMessages.createdAt))
    .limit(80);
  return rows.map((r) => ({ ...r, createdAt: r.createdAt }));
}

export async function getTracks(): Promise<Track[]> {
  await ensureBootstrap();
  return db.select().from(tracks).orderBy(desc(tracks.favorite), desc(tracks.createdAt));
}

export async function getSettings(): Promise<SettingsRow> {
  await ensureBootstrap();
  const rows = await db.select().from(settings).where(eq(settings.id, 1)).limit(1);
  return (
    rows[0] ?? {
      id: 1,
      coupleName: "Nossa História de Amor",
      tagline: "Nossas memórias, sons e carinho",
      startDate: null,
      ambientSound: "classico",
      bgColor: "rosa",
      fontFamily: "padrao",
      city: "Guarulhos",
      nowPlayingTrackId: null,
      updatedAt: new Date(),
    }
  );
}

export type NextDate = SpecialDate & { daysLeft: number };

export async function getUpcomingDates(limit = 3): Promise<NextDate[]> {
  await ensureBootstrap();
  const rows = await db.select().from(specialDates).orderBy(asc(specialDates.date));
  return rows
    .map((d) => ({ ...d, daysLeft: daysUntil(d.date, d.recurring) }))
    .filter((d) => d.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, limit);
}

/** "Lembra disso?" — memória antiga aleatória com foto. */
export async function getThrowback(): Promise<FeedPost | null> {
  await ensureBootstrap();
  const viewerRows = await db.select({ id: profiles.id }).from(profiles).orderBy(asc(profiles.id)).limit(1);
  const viewerId = viewerRows[0]?.id ?? 0;
  const cutoff = new Date(Date.now() - 1000 * 60 * 60 * 24 * 60);
  const rows = await db
    .select(basePostSelect(viewerId))
    .from(posts)
    .innerJoin(profiles, eq(profiles.id, posts.authorId))
    .where(and(lt(posts.createdAt, cutoff), sql`exists(select 1 from ${postMedia} where ${postMedia.postId} = ${posts.id})`))
    .orderBy(asc(posts.createdAt))
    .limit(5);
  const list = await attachMedia(rows);
  if (list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)];
}

export async function getProfileStats(profileId: number) {
  const [postCount] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(posts)
    .where(eq(posts.authorId, profileId));
  const [specialCount] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(posts)
    .where(and(eq(posts.authorId, profileId), eq(posts.isSpecial, true)));
  const [mediaCount] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(postMedia)
    .innerJoin(posts, eq(posts.id, postMedia.postId))
    .where(eq(posts.authorId, profileId));
  const [likedCount] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(reactions)
    .where(eq(reactions.profileId, profileId));
  const [savedCount] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(savedPosts)
    .where(eq(savedPosts.profileId, profileId));

  return {
    posts: Number(postCount?.total ?? 0),
    special: Number(specialCount?.total ?? 0),
    media: Number(mediaCount?.total ?? 0),
    liked: Number(likedCount?.total ?? 0),
    saved: Number(savedCount?.total ?? 0),
  };
}

export async function notify(params: {
  profileId: number;
  actorId: number;
  postId?: number | null;
  kind: string;
  message: string;
}) {
  if (params.profileId === params.actorId) return;
  await db.insert(notifications).values({
    profileId: params.profileId,
    actorId: params.actorId,
    postId: params.postId ?? null,
    kind: params.kind,
    message: params.message,
  });
}

export async function getRecentActivityIndicator(profileId: number) {
  const [row] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.profileId, profileId), isNull(notifications.readAt), gt(notifications.createdAt, new Date(0))));
  return Number(row?.total ?? 0);
}
