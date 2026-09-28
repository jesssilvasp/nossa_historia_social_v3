import { AffectiveCards } from "@/components/social/AffectiveCards";
import { FeedList } from "@/components/feed/FeedList";
import { PostComposerForm } from "@/components/feed/PostComposerForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { getFeed, getSettings } from "@/lib/data";
import { getCurrentProfile } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const viewer = await getCurrentProfile();
  const [feed, settings] = await Promise.all([getFeed(viewer.id, { limit: 8 }), getSettings()]);

  const safeViewer = {
    id: viewer.id,
    username: viewer.username,
    displayName: viewer.displayName,
    avatarUrl: viewer.avatarUrl,
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Início 💕"
        subtitle={settings.tagline}
        action={
          <span className="glass-pill hidden px-3 py-1 text-xs font-semibold text-ink-soft sm:inline">
            ✦ privado só para nós duas ✦
          </span>
        }
      />

      <PostComposerForm viewer={safeViewer} />

      <FeedList
        initial={feed}
        nextCursor={feed.length ? feed[feed.length - 1].createdAt : null}
        viewer={safeViewer}
      />

      <div className="lg:hidden">
        <h2 className="px-1 pb-1 text-lg font-extrabold text-ink">Nossa História 💕</h2>
        <AffectiveCards />
      </div>
    </div>
  );
}
