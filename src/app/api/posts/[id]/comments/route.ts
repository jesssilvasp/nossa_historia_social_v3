import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { comments, posts } from "@/db/schema";
import { getCurrentProfile } from "@/lib/session";
import { getComments, notify } from "@/lib/data";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Params) {
  const viewer = await getCurrentProfile();
  const { id } = await context.params;
  const items = await getComments(Number(id), viewer.id);
  return NextResponse.json({ items });
}

export async function POST(request: Request, context: Params) {
  const viewer = await getCurrentProfile();
  const { id } = await context.params;
  const postId = Number(id);
  const body = (await request.json().catch(() => null)) as { content?: string } | null;
  const content = (body?.content ?? "").trim();
  if (!content) return NextResponse.json({ error: "Comentário vazio." }, { status: 400 });

  const [post] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  if (!post) return NextResponse.json({ error: "Momento não encontrado." }, { status: 404 });

  await db.insert(comments).values({ postId, authorId: viewer.id, content });
  await notify({
    profileId: post.authorId,
    actorId: viewer.id,
    postId,
    kind: "comment",
    message: `${viewer.displayName} comentou em seu momento.`,
  });

  const items = await getComments(postId, viewer.id);
  return NextResponse.json({ items, commentCount: items.length }, { status: 201 });
}
