import type { ReactNode } from "react";
import { DesktopSidebar, MobileBottomNav, MobileHeader } from "./navigation";
import { RightSidebar } from "./RightSidebar";
import { MusicPlayerProvider } from "@/components/player/MusicPlayerProvider";
import { ToastProvider } from "@/components/ui/toast";

export type SocialViewer = {
  id: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

export function SocialLayout({
  viewer,
  profiles,
  unread,
  children,
}: {
  viewer: SocialViewer;
  profiles: SocialViewer[];
  unread: number;
  children: ReactNode;
}) {
  return (
    <ToastProvider>
      <MusicPlayerProvider>
        <div className="mx-auto flex w-full max-w-[1440px] items-start gap-0 sm:gap-4 sm:px-4">
          <DesktopSidebar viewer={viewer} profiles={profiles} unread={unread} />
          <div className="flex min-h-screen min-w-0 flex-1 flex-col sm:border-x sm:border-brand-pastel/60">
            <MobileHeader unread={unread} />
            <main className="flex-1 px-3 pb-24 pt-3 sm:px-4 lg:pb-12">{children}</main>
          </div>
          <RightSidebar />
        </div>
        <MobileBottomNav viewer={viewer} />
      </MusicPlayerProvider>
    </ToastProvider>
  );
}
