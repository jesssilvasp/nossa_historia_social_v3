"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type Toast = { id: number; message: string; tone: "ok" | "error" };

const ToastContext = createContext<{ toast: (message: string, tone?: "ok" | "error") => void }>({
  toast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const toast = useCallback((message: string, tone: "ok" | "error" = "ok") => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3200);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-[80] flex flex-col items-center gap-2 px-4 sm:bottom-8"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className="animate-[pop_0.3s_ease] pointer-events-auto max-w-sm rounded-2xl border border-brand-pastel bg-white/95 px-4 py-3 text-sm font-semibold text-ink shadow-[0_18px_40px_-20px_rgba(244,63,117,0.55)] backdrop-blur"
          >
            <span aria-hidden>{item.tone === "ok" ? "💗" : "😕"}</span> {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
