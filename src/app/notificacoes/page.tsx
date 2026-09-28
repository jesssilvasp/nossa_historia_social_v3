import Link from "next/link";
import { MarkAllReadButton } from "@/components/notifications/MarkAllReadButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { Avatar } from "@/components/ui/avatar";
import { getNotifications, getUnreadCount } from "@/lib/data";
import { getCurrentProfile } from "@/lib/session";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

const ICONS: Record<string, string> = { like: "💗", comment: "💬", post: "✨" };

export default async function NotificationsPage() {
  const viewer = await getCurrentProfile();
  const [items, unread] = await Promise.all([getNotifications(viewer.id), getUnreadCount(viewer.id)]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Notificações 🔔"
        subtitle={unread > 0 ? `${unread} novidade${unread > 1 ? "s" : ""} por aqui` : "Tudo tranquilo por aqui 💕"}
        action={<MarkAllReadButton unread={unread} />}
      />

      {items.length === 0 ? (
        <div className="card-soft flex flex-col items-center gap-2 px-6 py-12 text-center">
          <span className="text-4xl" aria-hidden>
            💕
          </span>
          <h2 className="text-lg font-bold text-ink">Tudo tranquilo por aqui 💕</h2>
          <p className="max-w-xs text-sm text-ink-soft">
            Quando vocês curtirem, comentarem ou publicarem momentos, os avisos aparecem aqui.
          </p>
        </div>
      ) : (
        <ul className="card-soft divide-y divide-brand-pastel/60 overflow-hidden">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.postId ? `/#post-${item.postId}` : "/"}
                className={`flex items-center gap-3 px-4 py-3 transition hover:bg-brand-pastel/25 ${
                  item.read ? "" : "bg-brand-pastel/15"
                }`}
              >
                <Avatar name={item.actorName ?? "Nós"} src={item.actorAvatar} size="md" ring={false} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink">
                    <span aria-hidden>{ICONS[item.kind] ?? "✨"}</span> {item.message}
                  </p>
                  <p className="text-xs text-ink-soft">
                    <time dateTime={item.createdAt}>{timeAgo(item.createdAt)}</time>
                  </p>
                </div>
                {!item.read && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand" aria-label="Não lida" />}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
