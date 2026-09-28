import Link from "next/link";
import { notFound } from "next/navigation";
import { AlbumDetail } from "@/components/albums/AlbumDetail";
import { PageHeader } from "@/components/ui/PageHeader";
import { getAlbum } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getAlbum(Number(id));
  if (!data) notFound();

  const { album, memories } = data;

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/albuns"
        className="glass-pill inline-flex w-fit items-center gap-2 px-4 py-2 text-sm font-bold text-brand transition hover:bg-white"
      >
        ← Voltar aos álbuns
      </Link>
      <PageHeader title={album.title} subtitle={album.description ?? "Nossas memórias guardadas aqui 💗"} />
      <AlbumDetail
        albumId={album.id}
        initial={memories.map((m) => ({
          id: m.id,
          url: m.url,
          kind: m.kind,
          caption: m.caption,
          createdAt: m.createdAt,
        }))}
      />
    </div>
  );
}
