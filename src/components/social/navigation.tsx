"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { ComposerDialog } from "@/components/feed/ComposerDialog";
import type { ComposerViewer } from "@/components/feed/PostComposerForm";

export type NavProfile = { id: number; username: string; displayName: string; avatarUrl: string | null };

const items = [
  { href: "/", label: "Início", icon: "🏠" },
  { href: "/notificacoes", label: "Notificações", icon: "🔔" },
  { href: "/mural", label: "Nosso Mural", icon: "💌" },
  { href: "/datas", label: "Datas Especiais", icon: "📅" },
  { href: "/albuns", label: "Álbuns", icon: "🖼" },
  { href: "/musicas", label: "Músicas", icon: "🎵" },
  { href: "/momentos", label: "Momentos Especiais", icon: "✨" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function DesktopSidebar({
  viewer,
  profiles,
  unread,
}: {
  viewer: NavProfile;
  profiles: NavProfile[];
  unread: number;
}) {
  const pathname = usePathname();
  const [composerOpen, setComposerOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const router = useRouter();

  async function switchProfile(id: number) {
    await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId: id }),
    });
    setSwitcherOpen(false);
    router.refresh();
  }

  return (
    <>
      <aside className="sticky top-0 hidden h-screen shrink-0 flex-col gap-1 overflow-y-auto px-3 py-4 no-scrollbar lg:flex xl:w-[272px] lg:w-[248px]">
        <Link href="/" className="mb-3 flex items-center gap-2 rounded-2xl px-2 py-2 transition hover:bg-white/60">
          <span className="text-2xl" aria-hidden>
            ♡
          </span>
          <span className="text-[15px] font-extrabold leading-tight text-brand">
            Nossa História
            <br />
            de Amor <span aria-hidden>✨</span>
          </span>
        </Link>

        <nav aria-label="Navegação principal" className="flex flex-col gap-1">
          {items.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`group flex min-h-11 items-center gap-3 rounded-2xl px-3 text-[15px] font-semibold transition ${
                  active
                    ? "bg-gradient-to-r from-brand-pastel/70 to-white text-brand shadow-[0_10px_24px_-18px_rgba(244,63,117,0.9)]"
                    : "text-ink-soft hover:bg-white/70 hover:text-brand"
                }`}
              >
                <span className="text-lg" aria-hidden>
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {item.href === "/notificacoes" && unread > 0 && (
                  <span className="ml-auto grid h-6 min-w-6 place-items-center rounded-full bg-brand px-1.5 text-xs font-bold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
            );
          })}
          <Link
            href={`/perfil/${viewer.username}`}
            aria-current={pathname.startsWith("/perfil") ? "page" : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-2xl px-3 text-[15px] font-semibold transition ${
              pathname.startsWith("/perfil")
                ? "bg-gradient-to-r from-brand-pastel/70 to-white text-brand"
                : "text-ink-soft hover:bg-white/70 hover:text-brand"
            }`}
          >
            <span className="text-lg" aria-hidden>
              👤
            </span>
            <span>Perfil</span>
          </Link>
          <Link
            href="/configuracoes"
            aria-current={pathname.startsWith("/configuracoes") ? "page" : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-2xl px-3 text-[15px] font-semibold transition ${
              pathname.startsWith("/configuracoes")
                ? "bg-gradient-to-r from-brand-pastel/70 to-white text-brand"
                : "text-ink-soft hover:bg-white/70 hover:text-brand"
            }`}
          >
            <span className="text-lg" aria-hidden>
              ⚙
            </span>
            <span>Configurações</span>
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setComposerOpen(true)}
          className="mt-4 min-h-12 rounded-full bg-gradient-to-r from-brand to-brand-mid px-5 text-sm font-bold tracking-wide text-white shadow-[0_16px_30px_-16px_rgba(244,63,117,0.95)] transition hover:brightness-105 active:scale-[0.98]"
        >
          💗 Criar Momento
        </button>

        <div className="mt-auto pt-4">
          {switcherOpen && (
            <div className="mb-2 rounded-2xl border border-brand-pastel bg-white/95 p-2 shadow-soft">
              <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">Quem está aqui?</p>
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => void switchProfile(profile.id)}
                  className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm font-semibold text-ink transition hover:bg-brand-pastel/40"
                >
                  <Avatar name={profile.displayName} src={profile.avatarUrl} size="sm" ring={false} />
                  <span className="truncate">{profile.displayName}</span>
                  {profile.id === viewer.id && <span className="ml-auto text-brand">✓</span>}
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => setSwitcherOpen((v) => !v)}
            aria-expanded={switcherOpen}
            className="flex w-full items-center gap-2 rounded-2xl px-2 py-2 text-left transition hover:bg-white/70"
          >
            <Avatar name={viewer.displayName} src={viewer.avatarUrl} size="md" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-ink">{viewer.displayName}</span>
              <span className="block truncate text-xs text-ink-soft">@{viewer.username}</span>
            </span>
            <span className="ml-auto text-xs text-ink-soft" aria-hidden>
              ⇅
            </span>
          </button>
        </div>
      </aside>

      <ComposerDialog open={composerOpen} onClose={() => setComposerOpen(false)} viewer={viewer} />
    </>
  );
}

export function MobileHeader({ unread }: { unread: number }) {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-brand-pastel/70 bg-surface/85 px-4 py-2.5 backdrop-blur-md lg:hidden">
      <Link href="/" className="flex items-center gap-2">
        <span className="text-xl" aria-hidden>
          ♡
        </span>
        <span className="text-[15px] font-extrabold leading-tight text-brand">
          Nossa História <span aria-hidden>💗</span>
        </span>
      </Link>
      <Link
        href="/notificacoes"
        className="relative grid h-11 w-11 place-items-center rounded-full text-xl transition hover:bg-brand-pastel/40"
        aria-label={`Notificações${unread ? `, ${unread} não lidas` : ""}`}
      >
        <span aria-hidden>🔔</span>
        {unread > 0 && (
          <span className="absolute right-1 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Link>
    </header>
  );
}

export function MobileBottomNav({ viewer }: { viewer: NavProfile }) {
  const pathname = usePathname();
  const [composerOpen, setComposerOpen] = useState(false);

  return (
    <>
      <nav
        aria-label="Navegação do celular"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-brand-pastel/70 bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      >
        <ul className="mx-auto flex max-w-lg items-center justify-around px-2 py-1.5">
          <NavItem href="/" icon="🏠" label="Início" active={pathname === "/"} />
          <NavItem href="/notificacoes" icon="🔔" label="Notificações" active={pathname.startsWith("/notificacoes")} />
          <NavItem href="/datas" icon="📅" label="Datas" active={pathname.startsWith("/datas")} />
          <li>
            <button
              type="button"
              onClick={() => setComposerOpen(true)}
              className="-mt-5 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-mid text-2xl text-white shadow-[0_14px_28px_-12px_rgba(244,63,117,0.95)] transition active:scale-95"
              aria-label="Criar Momento"
            >
              <span aria-hidden>➕</span>
            </button>
          </li>
          <NavItem href="/albuns" icon="🖼" label="Álbuns" active={pathname.startsWith("/albuns")} />
          <NavItem
            href={`/perfil/${viewer.username}`}
            icon="👤"
            label="Perfil"
            active={pathname.startsWith("/perfil")}
          />
        </ul>
      </nav>
      <ComposerDialog open={composerOpen} onClose={() => setComposerOpen(false)} viewer={viewer} />
    </>
  );
}

function NavItem({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: string;
  label: string;
  active: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        aria-label={label}
        className={`grid h-12 w-14 place-items-center rounded-2xl text-xl transition ${
          active ? "bg-brand-pastel/60 text-brand" : "text-ink-soft"
        }`}
      >
        <span aria-hidden>{icon}</span>
      </Link>
    </li>
  );
}
