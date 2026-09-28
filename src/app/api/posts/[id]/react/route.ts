import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { posts, reactions, savedPosts } from "@/db/schema";
import { getCurrentProfile } from "@/lib/session";
import { notify } from "@/lib/data";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Params) {
  const viewer = await getCurrentProfile();
  const { id } = await context.params;
  const postId = Number(id);
  const action = new URL(request.url).searchParams.get("action") ?? "like";
  if (!Number.isFinite(postId)) {
    return NextResponse.json({ error: "Post inválido." }, { status: 400 });
  }

  const [post] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  if (!post) return NextResponse.json({ error: "Momento não encontrado." }, { status: 404 });

  if (action === "like") {
    const inserted = await db.insert(reactions).values({ postId, profileId: viewer.id })
      .onConflictDoNothing({ target: [reactions.postId, reactions.profileId, reactions.kind] })
      .returning({ id: reactions.id });
    if (!inserted.length) {
      await db.delete(reactions).where(and(eq(reactions.postId, postId), eq(reactions.profileId, viewer.id)));
      return NextResponse.json({ liked: false });
    }
    await notify({
      profileId: post.authorId,
      actorId: viewer.id,
      postId,
      kind: "like",
      message: `${viewer.displayName} curtiu seu momento.`,
    });
    return NextResponse.json({ liked: true });
  }

  if (action === "save") {
    const inserted = await db.insert(savedPosts).values({ postId, profileId: viewer.id })
      .onConflictDoNothing({ target: [savedPosts.postId, savedPosts.profileId] })
      .returning({ id: savedPosts.id });
    if (!inserted.length) {
      await db.delete(savedPosts).where(and(eq(savedPosts.postId, postId), eq(savedPosts.profileId, viewer.id)));
      return NextResponse.json({ saved: false });
    }
    return NextResponse.json({ saved: true });
  }

  if (action === "special") {
    if (post.authorId !== viewer.id) return NextResponse.json({ error: "Só é possível editar seu próprio momento." }, { status: 403 });
    const next = !post.isSpecial;
    await db
      .update(posts)
      .set({ isSpecial: next, specialTitle: next ? (post.specialTitle ?? "Momento Especial") : null })
      .where(eq(posts.id, postId));
    return NextResponse.json({ isSpecial: next });
  }

  return NextResponse.json({ error: "Ação desconhecida." }, { status: 400 });
}
