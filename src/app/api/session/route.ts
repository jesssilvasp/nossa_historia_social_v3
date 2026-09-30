import { NextResponse } from "next/server";
import { SESSION_COOKIE, getCurrentProfile, listProfiles } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const [viewer, profiles] = await Promise.all([getCurrentProfile(), listProfiles()]);
  return NextResponse.json({ viewer, profiles });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { profileId?: number } | null;
  const profiles = await listProfiles();
  const target = profiles.find((p) => p.id === Number(body?.profileId));
  if (!target) return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 });

  const response = NextResponse.json({ ok: true, profile: target });
  response.cookies.set(SESSION_COOKIE, String(target.id), {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  response.cookies.delete("a_session");
  return response;
}