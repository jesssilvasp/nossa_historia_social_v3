import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function canonicalLink(value: string): { provider: "youtube" | "spotify"; url: string } | null {
  try {
    const input = new URL(value);
    if (["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"].includes(input.hostname)) {
      const id = input.hostname === "youtu.be"
        ? input.pathname.split("/").filter(Boolean)[0]
        : input.pathname === "/watch"
          ? input.searchParams.get("v")
          : input.pathname.split("/").filter(Boolean).at(-1);
      if (id && /^[\w-]{11}$/.test(id)) return { provider: "youtube", url: `https://www.youtube.com/watch?v=${id}` };
    }
    if (["open.spotify.com", "www.open.spotify.com"].includes(input.hostname)) {
      const [, type, id] = input.pathname.match(/^\/(track|album|playlist)\/([\w]+)\/?$/) ?? [];
      if (type && id) return { provider: "spotify", url: `https://open.spotify.com/${type}/${id}` };
    }
  } catch {
    return null;
  }
  return null;
}

async function fetchMetadata(provider: "youtube" | "spotify", url: string) {
  try {
    const endpoint = new URL(provider === "youtube" ? "https://www.youtube.com/oembed" : "https://open.spotify.com/oembed");
    endpoint.searchParams.set("url", url);
    endpoint.searchParams.set("format", "json");
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return {};
    const data = await response.json();
    return { title: data.title as string | undefined, artist: data.author_name as string | undefined, thumbnail: data.thumbnail_url as string | undefined };
  } catch {
    return {};
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { url?: string } | null;
  const input = body?.url?.trim();
  if (!input) return NextResponse.json({ error: "URL necessária" }, { status: 400 });
  const link = canonicalLink(input);
  if (!link) return NextResponse.json({ error: "Use um link do YouTube ou Spotify." }, { status: 400 });
  const metadata = await fetchMetadata(link.provider, link.url);
  return NextResponse.json({ ...metadata, url: link.url, source: link.provider });
}
