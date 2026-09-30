import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { getCurrentProfile } from "@/lib/session";
import { sanitizePlainText, sanitizeText, sanitizeUsername } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const viewer = await getCurrentProfile();
  const body = (await request.json().catch(() => null)) as
    | { displayName?: string; bio?: string; avatarUrl?: string | null; coverUrl?: string | null; username?: string }
    | null;
  if (!body) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if (typeof body.displayName === "string" && body.displayName.trim()) {
    patch.displayName = sanitizePlainText(body.displayName, 60);
  }
  if (typeof body.bio === "string") patch.bio = sanitizeText(body.bio, 200);
  if (typeof body.avatarUrl === "string") patch.avatarUrl = body.avatarUrl;
  if (body.avatarUrl === null) patch.avatarUrl = null;
  if (typeof body.coverUrl === "string") patch.coverUrl = body.coverUrl;
  if (body.coverUrl === null) patch.coverUrl = null;
  if (typeof body.username === "string" && body.username.trim()) {
    patch.username = sanitizeUsername(body.username);
  }

  if (Object.keys(patch).length === 0) return NextResponse.json({ ok: true });

  const [updated] = await db.update(profiles).set(patch).where(eq(profiles.id, viewer.id)).returning();
  return NextResponse.json({ profile: updated });
}
