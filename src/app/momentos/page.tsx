import { FeedList } from "@/components/feed/FeedList";
import { PageHeader } from "@/components/ui/PageHeader";
import { getFeed } from "@/lib/data";
import { getCurrentProfile } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function SpecialMomentsPage() {
  const viewer = await getCurrentProfile();
  const feed = await getFeed(viewer.id, { limit: 10, onlySpecial: true });
  const safeViewer = {
    id: viewer.id,
    username: viewer.username,
    displayName: viewer.displayName,
    avatarUrl: viewer.avatarUrl,
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Momentos Especiais ✨"
        subtitle="Só os momentos que vocês marcaram com ✨ — a linha do tempo do nosso amor."
      />
      <FeedList
        initial={feed}
        nextCursor={feed.length ? feed[feed.length - 1].createdAt : null}
        viewer={safeViewer}
        query="special=1"
        emptyTitle="Nenhum momento marcado ainda ✨"
        emptyText="Toque em ✨ Especial num post para ele morar aqui para sempre."
      />
    </div>
  );
}
