import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { getCurrentProfile, listProfiles } from "@/lib/session";
import { getUnreadCount } from "@/lib/data";
import { SocialLayout } from "@/components/social/SocialLayout";

export const metadata: Metadata = {
  title: "Nossa História de Amor ✨",
  description: "Um cantinho privado para duas pessoas guardarem a própria história.",
};

export const viewport: Viewport = {
  themeColor: "#F43F75",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [viewer, profiles] = await Promise.all([getCurrentProfile(), listProfiles()]);
  const unread = await getUnreadCount(viewer.id);

  const safeViewer = {
    id: viewer.id,
    username: viewer.username,
    displayName: viewer.displayName,
    avatarUrl: viewer.avatarUrl,
  };

  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[90] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-brand"
        >
          Ir para o conteúdo
        </a>
        <SocialLayout
          viewer={safeViewer}
          profiles={profiles.map((p) => ({
            id: p.id,
            username: p.username,
            displayName: p.displayName,
            avatarUrl: p.avatarUrl,
          }))}
          unread={unread}
        >
          <div id="conteudo">{children}</div>
        </SocialLayout>
      </body>
    </html>
  );
}
