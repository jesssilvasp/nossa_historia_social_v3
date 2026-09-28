"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { fullDate } from "@/lib/format";

export type WallNote = {
  id: number;
  content: string;
  emoji: string;
  createdAt: Date | string;
  authorId: number | null;
  authorName: string | null;
};

const EMOJIS = ["💗", "❤️", "✨", "☁️", "🥰", "💌"];

export function WallBoard({ initial, viewerId }: { initial: WallNote[]; viewerId: number }) {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState(initial);
  const [value, setValue] = useState("");
  const [emoji, setEmoji] = useState("💗");
  const [sending, setSending] = useState(false);

  async function send() {
    if (!value.trim()) return;
    setSending(true);
    const response = await fetch("/api/wall", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: value, emoji }),
    });
    setSending(false);
    if (!response.ok) {
      toast("Não deu para salvar o recado.", "error");
      return;
    }
    const data = (await response.json()) as { items: WallNote[] };
    setItems(data.items);
    setValue("");
    toast("Recado guardado no mural 💌");
    router.refresh();
  }

  async function remove(id: number) {
    const response = await fetch(`/api/wall?id=${id}`, { method: "DELETE" });
    if (!response.ok) {
      toast("Só é possível excluir o seu recado.", "error");
      return;
    }
    const data = (await response.json()) as { items: WallNote[] };
    setItems(data.items);
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="card-soft p-4" aria-label="Escrever recado">
        <form
          className="flex flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void send();
          }}
        >
          <label className="sr-only" htmlFor="wall-content">
            Escreva um recado carinhoso
          </label>
          <textarea
            id="wall-content"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={2}
            maxLength={280}
            placeholder="Escreva um recado carinhoso... 💌"
            className="w-full resize-none rounded-2xl border border-brand-pastel bg-white px-4 py-3 text-[15px] outline-none placeholder:text-ink-soft/70"
          />
          <div className="flex flex-wrap items-center gap-1.5">
            {EMOJIS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setEmoji(item)}
                aria-pressed={emoji === item}
                aria-label={`Usar ${item}`}
                className={`grid h-11 w-11 place-items-center rounded-full text-lg transition ${
                  emoji === item ? "bg-brand-pastel" : "hover:bg-brand-pastel/40"
                }`}
              >
                {item}
              </button>
            ))}
            <button
              type="submit"
              disabled={sending || !value.trim()}
              className="ml-auto min-h-11 rounded-full bg-gradient-to-r from-brand to-brand-mid px-6 text-sm font-bold text-white transition disabled:opacity-50"
            >
              {sending ? "Enviando..." : "Enviar 💌"}
            </button>
          </div>
        </form>
      </section>

      {items.length === 0 ? (
        <div className="card-soft px-6 py-12 text-center">
          <span className="text-4xl" aria-hidden>
            💌
          </span>
          <h2 className="mt-2 text-lg font-bold text-ink">O mural está esperando o primeiro recado</h2>
          <p className="text-sm text-ink-soft">Escreva aquilo que você diria olhando nos olhos 💗</p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((note) => (
            <li
              key={note.id}
              className="animate-[fade-in_0.3s_ease] card-soft flex flex-col gap-2 p-4"
              style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.95), rgba(254,203,213,0.35))" }}
            >
              <p className="text-2xl" aria-hidden>
                {note.emoji}
              </p>
              <p className="whitespace-pre-wrap text-[15px] text-ink">{note.content}</p>
              <p className="mt-auto pt-1 text-xs text-ink-soft">
                {note.authorName ?? "Nós"} • <time dateTime={String(note.createdAt)}>{fullDate(note.createdAt)}</time>
              </p>
              {note.authorId === viewerId && (
                <button
                  type="button"
                  onClick={() => void remove(note.id)}
                  className="self-start text-xs font-semibold text-ink-soft transition hover:text-brand"
                >
                  excluir
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
