import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { comments } from "@/db/schema";
import { getCurrentProfile } from "@/lib/session";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Params) {
  const viewer = await getCurrentProfile();
  const { id } = await context.params;
  const commentId = Number(id);
  if (!Number.isInteger(commentId) || commentId < 1) return NextResponse.json({ error: "Comentário inválido." }, { status: 400 });
  const body = (await request.json().catch(() => null)) as { content?: string } | null;
  const content = (body?.content ?? "").trim();
  if (content.length > 2000) return NextResponse.json({ error: "Comentário acima de 2.000 caracteres." }, { status: 400 });
  if (!content) return NextResponse.json({ error: "Comentário vazio." }, { status: 400 });

  const updated = await db
    .update(comments)
    .set({ content, updatedAt: new Date() })
    .where(and(eq(comments.id, commentId), eq(comments.authorId, viewer.id)))
    .returning({ id: comments.id });

  if (!updated.length) return NextResponse.json({ error: "Só dá para editar o seu comentário." }, { status: 403 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, context: Params) {
  const viewer = await getCurrentProfile();
  const { id } = await context.params;
  const commentId = Number(id);
  if (!Number.isInteger(commentId) || commentId < 1) return NextResponse.json({ error: "Comentário inválido." }, { status: 400 });
  const deleted = await db
    .delete(comments)
    .where(and(eq(comments.id, commentId), eq(comments.authorId, viewer.id)))
    .returning({ id: comments.id });
  if (!deleted.length) return NextResponse.json({ error: "Só dá para excluir o seu comentário." }, { status: 403 });
  return NextResponse.json({ ok: true });
}
