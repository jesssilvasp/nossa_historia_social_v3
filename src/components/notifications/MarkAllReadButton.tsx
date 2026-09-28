"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ui/toast";

export function MarkAllReadButton({ unread }: { unread: number }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  if (unread === 0) return null;

  return (
    <button
      type="button"
      disabled={loading}
      onClick={async () => {
        if (loading) return;
        setLoading(true);
        try {
          const response = await fetch("/api/notifications", { method: "POST" });
          if (!response.ok) throw new Error();
          toast("Notificações lidas 💕");
          router.refresh();
        } catch {
          toast("Não foi possível atualizar as notificações.", "error");
        } finally {
          setLoading(false);
        }
      }}
      className="min-h-11 rounded-full border border-brand-pastel bg-white/80 px-4 text-sm font-bold text-brand transition hover:bg-white disabled:opacity-60"
    >
      {loading ? "Marcando..." : "Marcar todas como lidas"}
    </button>
  );
}
