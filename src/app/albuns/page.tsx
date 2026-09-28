import { AlbumsView } from "@/components/albums/AlbumsView";
import { PageHeader } from "@/components/ui/PageHeader";
import { getAlbums } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AlbumsPage() {
  const albums = await getAlbums();

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Álbuns 🖼" subtitle="As pastas onde a nossa história fica organizada." />
      <AlbumsView initial={albums} />
    </div>
  );
}
