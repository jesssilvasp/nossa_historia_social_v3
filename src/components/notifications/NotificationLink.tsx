"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";

export function NotificationLink({ href, id, children, className }: { href: string; id: number; children: ReactNode; className: string }) {
  const router = useRouter();
  async function open(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    await fetch(`/api/notifications/${id}`, { method: "PATCH" }).catch(() => null);
    router.push(href);
    router.refresh();
  }
  return <Link href={href} onClick={(event) => void open(event)} className={className}>{children}</Link>;
}
