import { NextResponse } from "next/server";
import { db } from "@/db";
import { postMedia, posts, profiles } from "@/db/schema";
import { eq, ne } from "drizzle-orm";
import { getCurrentProfile } from "@/lib/session";
import { getFeed, notify } from "@/lib/data";
import { sanitizeText, sanitizePlainText } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const viewer = await getCurrentProfile();
  const url = new URL(request.url);
  const special = url.searchParams.get("special");
  const saved = url.searchParams.get("saved");
  const liked = url.searchParams.get("liked");
  const media = url.searchParams.get("media");
  const author = url.searchParams.get("author");

  const items = await getFeed(viewer.id, {
    cursor: url.searchParams.get("cursor"),
    limit: Number(url.searchParams.get("limit") ?? 10),
    onlySpecial: special === "1",
    onlySavedFor: saved === "1" ? viewer.id : undefined,
    onlyLikedFor: liked === "1" ? viewer.id : undefined,
    onlyMedia: media === "1",
    authorId: author ? Number(author) : undefined,
  });

  return NextResponse.json({
    items,
    nextCursor: items.length ? items[items.length - 1].createdAt : null,
  });
}

export async function POST(request: Request) {
  const viewer = await getCurrentProfile();
  const body = (await request.json().catch(() => null)) as
    | {
        content?: string;
        media?: { url: string; kind?: string; posterUrl?: string | null; durationSec?: number | null; alt?: string | null }[];
        isSpecial?: boolean;
        specialTitle?: string | null;
        albumId?: number | null;
        music?: { title?: string; artist?: string; url?: string; cover?: string | null } | null;
      }
    | null;

  if (!body) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const content = sanitizeText(body.content ?? "");
  const media = (body.media ?? []).filter((m) => typeof m?.url === "string" && m.url.length > 0);
  if (!content && media.length === 0) {
    return NextResponse.json({ error: "Escreva algo ou escolha uma foto 💗" }, { status: 400 });
  }

  const [created] = await db
    .insert(posts)
    .values({
      authorId: viewer.id,
      content,
      isSpecial: Boolean(body.isSpecial),
      specialTitle: body.isSpecial ? sanitizePlainText(body.specialTitle ?? "") : null,
      albumId: body.albumId ?? null,
      musicTitle: body.music?.title ? sanitizePlainText(body.music.title) : null,
      musicArtist: body.music?.artist ? sanitizePlainText(body.music.artist) : null,
      musicUrl: body.music?.url ?? null,
      musicCover: body.music?.cover ?? null,
    })
    .returning();

  if (media.length) {
    await db.insert(postMedia).values(
      media.map((m, index) => ({
        postId: created.id,
        url: m.url,
        kind: m.kind === "video" ? "video" : "image",
        posterUrl: m.posterUrl ?? null,
        durationSec: m.durationSec ?? null,
        alt: m.alt ? sanitizePlainText(m.alt) : null,
        position: index,
      })),
    );
  }

  const others = await db.select({ id: profiles.id }).from(profiles).where(ne(profiles.id, viewer.id));
  for (const other of others) {
    await notify({
      profileId: other.id,
      actorId: viewer.id,
      postId: created.id,
      kind: "post",
      message: `${viewer.displayName} compartilhou um novo momento.`,
    });
  }

  return NextResponse.json({ id: created.id }, { status: 201 });
}
