import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tracks } from "@/db/schema";
import { getSettings, getTracks } from "@/lib/data";
import { sanitizePlainText } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ items: await getTracks() });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { title?: string; artist?: string; url?: string; coverUrl?: string | null }
    | null;
  const title = sanitizePlainText(body?.title ?? "", 120);
  const url = (body?.url ?? "").trim();
  if (!title || !url) return NextResponse.json({ error: "Informe o nome e o link da música." }, { status: 400 });

  const [created] = await db
    .insert(tracks)
    .values({
      title,
      artist: body?.artist ? sanitizePlainText(body.artist, 120) : "",
      url,
      coverUrl: body?.coverUrl ?? null,
    })
    .returning();

  return NextResponse.json({ track: created }, { status: 201 });
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { id?: number; favorite?: boolean; nowPlaying?: boolean }
    | null;
  const id = Number(body?.id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Música inválida." }, { status: 400 });

  if (typeof body?.favorite === "boolean") {
    await db.update(tracks).set({ favorite: body.favorite }).where(eq(tracks.id, id));
  }
  if (body?.nowPlaying) {
    await db.update(tracks).set({ favorite: false }).where(eq(tracks.favorite, true));
    const current = await getSettings();
    void current;
    await db.update(tracks).set({ favorite: true }).where(eq(tracks.id, id));
  }

  return NextResponse.json({ items: await getTracks() });
}

export async function DELETE(request: Request) {
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Música inválida." }, { status: 400 });
  await db.delete(tracks).where(eq(tracks.id, id));
  return NextResponse.json({ items: await getTracks() });
}
