"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ComposerDialog } from "./ComposerDialog";
import type { ComposerViewer } from "./PostComposerForm";

/** Botão que abre o composer em modal — usado em empty states e atalhos. */
export function ComposerLauncherButton({
  viewer,
  label = "💗 Criar Momento",
}: {
  viewer: ComposerViewer;
  label?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="min-h-11 rounded-full bg-gradient-to-r from-brand to-brand-mid px-5 text-sm font-bold text-white shadow-[0_14px_28px_-14px_rgba(244,63,117,0.95)] transition hover:brightness-105"
      >
        {label}
      </button>
      <ComposerDialog
        open={open}
        onClose={() => {
          setOpen(false);
          if (pathname === "/") router.refresh();
        }}
        viewer={viewer}
      />
    </>
  );
}
