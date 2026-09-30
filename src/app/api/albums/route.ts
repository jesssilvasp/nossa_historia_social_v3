import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { albumMemories, albums } from "@/db/schema";
import { getAlbum, getAlbums } from "@/lib/data";
import { sanitizePlainText, sanitizeText } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (id) {
    const found = await getAlbum(Number(id));
    if (!found) return NextResponse.json({ error: "Álbum não encontrado." }, { status: 404 });
    return NextResponse.json(found);
  }
  return NextResponse.json({ items: await getAlbums() });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { title?: string; description?: string; coverUrl?: string | null }
    | null;
  const title = sanitizePlainText(body?.title ?? "", 80);
  if (!title) return NextResponse.json({ error: "Dê um nome ao álbum 💗" }, { status: 400 });

  const [created] = await db
    .insert(albums)
    .values({ title, description: body?.description ? sanitizeText(body.description, 200) : null, coverUrl: body?.coverUrl ?? null })
    .returning();

  return NextResponse.json({ album: created }, { status: 201 });
}

/** Adiciona memórias (fotos/vídeos) a um álbum existente. */
export async function PUT(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { albumId?: number; memories?: { url: string; kind?: string; caption?: string }[] }
    | null;
  const albumId = Number(body?.albumId);
  const memories = (body?.memories ?? []).filter((m) => typeof m?.url === "string" && m.url);
  if (!Number.isFinite(albumId) || memories.length === 0) {
    return NextResponse.json({ error: "Escolha ao menos uma memória." }, { status: 400 });
  }

  await db.insert(albumMemories).values(
    memories.map((m) => ({
      albumId,
      url: m.url,
      kind: m.kind === "video" ? "video" : "image",
      caption: m.caption ? sanitizePlainText(m.caption, 160) : null,
    })),
  );

  const [first] = memories;
  const album = await db.select().from(albums).where(eq(albums.id, albumId)).limit(1);
  if (album[0] && !album[0].coverUrl) {
    await db.update(albums).set({ coverUrl: first.url }).where(eq(albums.id, albumId));
  }

  return NextResponse.json(await getAlbum(albumId), { status: 201 });
}

/** Atualiza personalização do álbum (tema, som, fonte). */
export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { albumId?: number; bgTheme?: string; ambientSound?: string; fontFamily?: string }
    | null;
  const albumId = Number(body?.albumId);
  if (!Number.isFinite(albumId)) {
    return NextResponse.json({ error: "Álbum inválido." }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (typeof body?.bgTheme === "string") patch.bgTheme = sanitizePlainText(body.bgTheme, 20);
  if (typeof body?.ambientSound === "string") patch.ambientSound = sanitizePlainText(body.ambientSound, 20);
  if (typeof body?.fontFamily === "string") patch.fontFamily = sanitizePlainText(body.fontFamily, 20);

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ ok: true });
  }

  await db.update(albums).set(patch).where(eq(albums.id, albumId));
  return NextResponse.json(await getAlbum(albumId));
}
