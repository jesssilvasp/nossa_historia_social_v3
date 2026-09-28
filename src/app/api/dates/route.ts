import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { specialDates } from "@/db/schema";
import { getUpcomingDates } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ items: await getUpcomingDates(10) });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { title?: string; date?: string; emoji?: string; recurring?: boolean }
    | null;
  const title = (body?.title ?? "").trim();
  const date = (body?.date ?? "").trim();
  if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Informe um título e uma data válida." }, { status: 400 });
  }
  const [created] = await db
    .insert(specialDates)
    .values({
      title: title.slice(0, 80),
      date,
      emoji: (body?.emoji ?? "💕").slice(0, 4),
      recurring: body?.recurring ?? true,
    })
    .returning();
  return NextResponse.json({ item: created }, { status: 201 });
}

export async function DELETE(request: Request) {
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Data inválida." }, { status: 400 });
  await db.delete(specialDates).where(eq(specialDates.id, id));
  return NextResponse.json({ items: await db.select().from(specialDates).orderBy(desc(specialDates.date)) });
}
