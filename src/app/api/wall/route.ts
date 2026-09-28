import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { wallMessages } from "@/db/schema";
import { getCurrentProfile } from "@/lib/session";
import { getWallMessages } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ items: await getWallMessages() });
}

export async function POST(request: Request) {
  const viewer = await getCurrentProfile();
  const body = (await request.json().catch(() => null)) as { content?: string; emoji?: string } | null;
  const content = (body?.content ?? "").trim();
  if (!content) return NextResponse.json({ error: "Escreva um recadinho 💗" }, { status: 400 });

  await db.insert(wallMessages).values({
    authorId: viewer.id,
    content: content.slice(0, 280),
    emoji: (body?.emoji ?? "💗").slice(0, 4),
  });

  return NextResponse.json({ items: await getWallMessages() }, { status: 201 });
}

export async function DELETE(request: Request) {
  const viewer = await getCurrentProfile();
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Recado inválido." }, { status: 400 });
  await db
    .delete(wallMessages)
    .where(and(eq(wallMessages.id, id), eq(wallMessages.authorId, viewer.id)));
  return NextResponse.json({ items: await getWallMessages() });
}
