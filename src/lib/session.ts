import { cookies } from "next/headers";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles, type Profile } from "@/db/schema";
import { ensureBootstrap } from "./bootstrap";

export const SESSION_COOKIE = "nha_profile";

const FALLBACK: Profile = {
  id: 0,
  username: "maymay",
  displayName: "Mayara 💗",
  avatarUrl: null,
  coverUrl: null,
  bio: null,
  createdAt: new Date(),
};

export async function listProfiles(): Promise<Profile[]> {
  await ensureBootstrap();
  try {
    return await db.select().from(profiles).orderBy(asc(profiles.id));
  } catch {
    return [FALLBACK];
  }
}

export async function getCurrentProfile(): Promise<Profile> {
  const all = await listProfiles();
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  const id = raw ? Number(raw) : Number.NaN;
  const found = Number.isFinite(id) ? all.find((p) => p.id === id) : undefined;
  return found ?? all[0] ?? FALLBACK;
}

export async function getProfileByUsername(username: string): Promise<Profile | undefined> {
  await ensureBootstrap();
  try {
    const rows = await db.select().from(profiles).where(eq(profiles.username, username)).limit(1);
    return rows[0];
  } catch {
    return undefined;
  }
}
