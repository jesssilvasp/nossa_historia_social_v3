import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { getSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ settings: await getSettings() });
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof body.coupleName === "string") patch.coupleName = body.coupleName.slice(0, 120);
  if (typeof body.tagline === "string") patch.tagline = body.tagline.slice(0, 160);
  if (typeof body.startDate === "string") patch.startDate = body.startDate || null;
  if (typeof body.ambientSound === "string") patch.ambientSound = body.ambientSound;
  if (typeof body.bgColor === "string") patch.bgColor = body.bgColor;
  if (typeof body.fontFamily === "string") patch.fontFamily = body.fontFamily;
  if (typeof body.city === "string") patch.city = body.city;
  if (body.nowPlayingTrackId === null) patch.nowPlayingTrackId = null;
  if (typeof body.nowPlayingTrackId === "number") patch.nowPlayingTrackId = body.nowPlayingTrackId;

  await db
    .insert(settings)
    .values({ id: 1 })
    .onConflictDoNothing();
  await db.update(settings).set(patch).where(eq(settings.id, 1));

  return NextResponse.json({ settings: await getSettings() });
}
