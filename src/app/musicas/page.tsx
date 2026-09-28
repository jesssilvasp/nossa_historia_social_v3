import { MusicView } from "@/components/music/MusicView";
import { PageHeader } from "@/components/ui/PageHeader";
import { getSettings, getTracks } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function MusicPage() {
  const [tracks, settings] = await Promise.all([getTracks(), getSettings()]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Nossas Músicas 🎵"
        subtitle="Nossa playlist, as músicas dos momentos e as favoritas de sempre."
      />
      <MusicView
        initial={tracks.map((t) => ({
          id: t.id,
          title: t.title,
          artist: t.artist,
          url: t.url,
          coverUrl: t.coverUrl,
          favorite: t.favorite,
        }))}
        nowPlayingId={settings.nowPlayingTrackId}
      />
    </div>
  );
}
