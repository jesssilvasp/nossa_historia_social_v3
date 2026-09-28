import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { getCurrentProfile } from "@/lib/session";
import { getNotifications, getUnreadCount } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const viewer = await getCurrentProfile();
  const [items, unread] = await Promise.all([getNotifications(viewer.id), getUnreadCount(viewer.id)]);
  return NextResponse.json({ items, unread });
}

export async function POST() {
  const viewer = await getCurrentProfile();
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.profileId, viewer.id), isNull(notifications.readAt)));
  return NextResponse.json({ ok: true, unread: 0 });
}
