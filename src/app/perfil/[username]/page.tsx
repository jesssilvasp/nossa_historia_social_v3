import { notFound } from "next/navigation";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { Avatar } from "@/components/ui/avatar";
import { getProfileStats, getFeed } from "@/lib/data";
import { getProfileByUsername } from "@/lib/session";
import { timeTogether } from "@/lib/format";
import { getSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const profile = await getProfileByUsername(decodeURIComponent(username));
  if (!profile) notFound();

  const [stats, settings] = await Promise.all([getProfileStats(profile.id), getSettings()]);
  const feed = await getFeed(profile.id, { limit: 10 });
  const current = { id: profile.id, username: profile.username, displayName: profile.displayName, avatarUrl: profile.avatarUrl };
  const together = timeTogether(settings.startDate);

  return (
    <div className="flex flex-col gap-4">
      <section className="card-soft overflow-hidden" aria-label="Cabeçalho do perfil">
        <div className="relative h-36 bg-gradient-to-br from-brand-pastel via-brand-light to-brand-mid sm:h-48">
          {profile.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.coverUrl} alt={`Capa de ${profile.displayName}`} className="h-full w-full object-cover" />
          ) : (
            <span className="absolute right-4 top-4 text-3xl opacity-70" aria-hidden>
              ♡ ✦
            </span>
          )}
        </div>
        <div className="px-4 pb-4">
          <div className="-mt-10 flex items-end gap-3">
            <Avatar name={profile.displayName} src={profile.avatarUrl} size="xl" />
          </div>
          <h1 className="mt-2 text-xl font-extrabold text-ink">{profile.displayName}</h1>
          <p className="text-sm text-ink-soft">@{profile.username}</p>
          {profile.bio && <p className="mt-2 text-[15px] text-ink">{profile.bio}</p>}

          <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="momentos" value={stats.posts} />
            <Stat label="especiais" value={stats.special} />
            <Stat label="fotos e vídeos" value={stats.media} />
            <Stat label="salvos" value={stats.saved} />
          </dl>

          {settings.startDate && (
            <p className="mt-3 text-xs font-semibold text-brand">
              ✦ juntas há {together.years}a {together.months}m {together.days}d ✦
            </p>
          )}
        </div>
      </section>

      <ProfileTabs
        username={profile.username}
        viewer={current}
        initial={feed}
        nextCursor={feed.length ? feed[feed.length - 1].createdAt : null}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-brand-pastel/80 bg-white/70 px-3 py-2 text-center">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">{label}</dt>
      <dd className="text-lg font-extrabold text-brand">{value}</dd>
    </div>
  );
}
