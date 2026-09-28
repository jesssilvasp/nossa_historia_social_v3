import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Nossa História de Amor — V3 (Rede Social Privada do Casal)
 * Banco unificado: perfis, feed social, mídias, álbuns, mural, música e datas.
 */

export const profiles = pgTable(
  "profiles",
  {
    id: serial("id").primaryKey(),
    username: text("username").notNull(),
    displayName: text("display_name").notNull(),
    avatarUrl: text("avatar_url"),
    coverUrl: text("cover_url"),
    bio: text("bio"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("profiles_username_key").on(t.username)],
);

/** Personalização global do casal (linha única, id = 1). */
export const settings = pgTable("settings", {
  id: integer("id").primaryKey().default(1),
  coupleName: text("couple_name").notNull().default("Nossa História de Amor"),
  tagline: text("tagline").notNull().default("Nossas memórias, sons e carinho"),
  startDate: date("start_date"),
  ambientSound: text("ambient_sound").notNull().default("classico"),
  bgColor: text("bg_color").notNull().default("rosa"),
  fontFamily: text("font_family").notNull().default("padrao"),
  city: text("city").notNull().default("Guarulhos"),
  nowPlayingTrackId: integer("now_playing_track_id"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const posts = pgTable(
  "posts",
  {
    id: serial("id").primaryKey(),
    authorId: integer("author_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    content: text("content").notNull().default(""),
    isSpecial: boolean("is_special").notNull().default(false),
    specialTitle: text("special_title"),
    albumId: integer("album_id"),
    musicTitle: text("music_title"),
    musicArtist: text("music_artist"),
    musicUrl: text("music_url"),
    musicCover: text("music_cover"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (t) => [index("posts_created_at_idx").on(t.createdAt), index("posts_author_idx").on(t.authorId)],
);

export const postMedia = pgTable(
  "post_media",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    kind: text("kind").notNull().default("image"), // image | video
    posterUrl: text("poster_url"),
    durationSec: integer("duration_sec"),
    alt: text("alt"),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("post_media_post_idx").on(t.postId)],
);

export const comments = pgTable(
  "comments",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    authorId: integer("author_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (t) => [index("comments_post_idx").on(t.postId)],
);

export const reactions = pgTable(
  "reactions",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    profileId: integer("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    kind: text("kind").notNull().default("like"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("reactions_post_profile_key").on(t.postId, t.profileId, t.kind)],
);

export const savedPosts = pgTable(
  "saved_posts",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    profileId: integer("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("saved_posts_post_profile_key").on(t.postId, t.profileId)],
);

export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    profileId: integer("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    actorId: integer("actor_id").references(() => profiles.id, { onDelete: "set null" }),
    postId: integer("post_id").references(() => posts.id, { onDelete: "cascade" }),
    kind: text("kind").notNull().default("like"), // like | comment | post
    message: text("message").notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notifications_profile_idx").on(t.profileId, t.createdAt)],
);

export const albums = pgTable("albums", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  coverUrl: text("cover_url"),
  bgTheme: text("bg_theme").notNull().default("rosa"),
  ambientSound: text("ambient_sound"),
  fontFamily: text("font_family").notNull().default("padrao"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const albumMemories = pgTable(
  "album_memories",
  {
    id: serial("id").primaryKey(),
    albumId: integer("album_id")
      .notNull()
      .references(() => albums.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    kind: text("kind").notNull().default("image"), // image | video
    caption: text("caption"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("album_memories_album_idx").on(t.albumId)],
);

export const wallMessages = pgTable(
  "wall_messages",
  {
    id: serial("id").primaryKey(),
    authorId: integer("author_id").references(() => profiles.id, { onDelete: "set null" }),
    content: text("content").notNull(),
    emoji: text("emoji").notNull().default("💗"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("wall_messages_created_idx").on(t.createdAt)],
);

export const specialDates = pgTable("special_dates", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  date: date("date").notNull(),
  emoji: text("emoji").notNull().default("💕"),
  recurring: boolean("recurring").notNull().default(true),
});

export const tracks = pgTable("tracks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  artist: text("artist").notNull().default(""),
  url: text("url").notNull(),
  coverUrl: text("cover_url"),
  favorite: boolean("favorite").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Profile = typeof profiles.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type PostMedia = typeof postMedia.$inferSelect;
export type Album = typeof albums.$inferSelect;
export type AlbumMemory = typeof albumMemories.$inferSelect;
export type WallMessage = typeof wallMessages.$inferSelect;
export type Track = typeof tracks.$inferSelect;
export type SpecialDate = typeof specialDates.$inferSelect;
export type NotificationRow = typeof notifications.$inferSelect;
export type CommentRow = typeof comments.$inferSelect;
export type SettingsRow = typeof settings.$inferSelect;
