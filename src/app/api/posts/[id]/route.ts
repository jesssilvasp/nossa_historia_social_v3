import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { albumMemories, albums, postMedia, posts } from "@/db/schema";
import { getCurrentProfile } from "@/lib/session";
import { removeUploadUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ id: string }> };

async function ownedPost(id: number, authorId: number) {
  const [post] = await db.select().from(posts).where(and(eq(posts.id, id), eq(posts.authorId, authorId))).limit(1);
  return post;
}

export async function PATCH(request: Request, context: Params) {
  const viewer = await getCurrentProfile();
  const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: "Momento inválido." }, { status: 400 });
  const post = await ownedPost(id, viewer.id);
  if (!post) return NextResponse.json({ error: "Momento não encontrado ou sem permissão." }, { status: 404 });

  const body = (await request.json().catch(() => null)) as { content?: unknown; isSpecial?: unknown; albumId?: unknown } | null;
  if (!body) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  const update: Partial<typeof posts.$inferInsert> = {};
  if (typeof body.content === "string") {
    const content = body.content.trim();
    if (content.length > 5000) return NextResponse.json({ error: "O texto deve ter até 5.000 caracteres." }, { status: 400 });
    if (!content) {
      const media = await db.select({ id: postMedia.id }).from(postMedia).where(eq(postMedia.postId, id)).limit(1);
      if (!media.length) return NextResponse.json({ error: "O momento precisa ter texto ou mídia." }, { status: 400 });
    }
    update.content = content;
  }
  if (typeof body.isSpecial === "boolean") {
    update.isSpecial = body.isSpecial;
    update.specialTitle = body.isSpecial ? post.specialTitle ?? "Momento Especial" : null;
  }
  if (body.albumId !== undefined) {
    if (body.albumId === null) update.albumId = null;
    else {
      const albumId = Number(body.albumId);
      if (!Number.isInteger(albumId) || albumId < 1) return NextResponse.json({ error: "Álbum inválido." }, { status: 400 });
      const [album] = await db.select({ id: albums.id }).from(albums).where(eq(albums.id, albumId)).limit(1);
      if (!album) return NextResponse.json({ error: "Álbum não encontrado." }, { status: 404 });
      update.albumId = albumId;
    }
  }
  if (Object.keys(update).length === 0) return NextResponse.json({ error: "Nada para atualizar." }, { status: 400 });
  if (typeof body.content === "string") update.updatedAt = new Date();

  const [updated] = await db.update(posts).set(update).where(eq(posts.id, id)).returning();
  return NextResponse.json({ post: updated });
}

export async function DELETE(_request: Request, context: Params) {
  const viewer = await getCurrentProfile();
  const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: "Momento inválido." }, { status: 400 });
  if (!(await ownedPost(id, viewer.id))) return NextResponse.json({ error: "Momento não encontrado ou sem permissão." }, { status: 404 });
  const media = await db.select({ url: postMedia.url }).from(postMedia).where(eq(postMedia.postId, id));
  const deleted = await db.delete(posts).where(and(eq(posts.id, id), eq(posts.authorId, viewer.id))).returning({ id: posts.id });
  if (!deleted.length) return NextResponse.json({ error: "Momento não encontrado ou sem permissão." }, { status: 404 });
  for (const item of media) {
    const [otherPosts, albumRefs] = await Promise.all([
      db.select({ id: postMedia.id }).from(postMedia).where(eq(postMedia.url, item.url)).limit(1),
      db.select({ id: albumMemories.id }).from(albumMemories).where(eq(albumMemories.url, item.url)).limit(1),
    ]);
    if (otherPosts.length === 0 && albumRefs.length === 0) await removeUploadUrl(item.url);
  }
  return NextResponse.json({ ok: true });
}
