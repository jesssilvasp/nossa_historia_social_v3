"use client";

import { useEffect, useRef } from "react";
import { PostComposerForm, type ComposerViewer } from "./PostComposerForm";

export function ComposerDialog({
  open,
  onClose,
  viewer,
}: {
  open: boolean;
  onClose: () => void;
  viewer: ComposerViewer;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-ink/25 px-3 py-6 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Criar momento"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="animate-[pop_0.28s_ease] w-full max-w-xl">
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-lg font-bold text-ink">Criar Momento 💗</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/90 text-ink shadow"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>
        <div className="card-soft p-1">
          <PostComposerForm viewer={viewer} autoFocus onPublished={onClose} />
        </div>
      </div>
    </div>
  );
}
