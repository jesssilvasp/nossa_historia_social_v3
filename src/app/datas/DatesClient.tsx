"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { fullDate, daysUntil } from "@/lib/format";

type SpecialDate = {
  id: number;
  title: string;
  date: string;
  emoji: string;
  recurring: boolean;
  daysLeft: number;
};

export default function DatesClient({ initial }: { initial: SpecialDate[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState(initial);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [emoji, setEmoji] = useState("💕");
  const [recurring, setRecurring] = useState(true);
  const [saving, setSaving] = useState(false);

  const EMOJIS = ["💕", "💗", "❤️", "🌸", "🌹", "💍", "🎂", "🌊", "✈️", "🏠", "🐱", "🐶", "🍷", "☕", "📸", "✨"];

  async function add() {
    if (!title.trim() || !date) return;
    setSaving(true);
    const response = await fetch("/api/dates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, date, emoji, recurring }),
    });
    setSaving(false);
    if (!response.ok) {
      toast("Informe título e data válidos.", "error");
      return;
    }
    const data = (await response.json()) as { item: SpecialDate };
    const withDays = { ...data.item, daysLeft: daysUntil(data.item.date, data.item.recurring) };
    setItems((prev) => [...prev, withDays].sort((a, b) => a.daysLeft - b.daysLeft));
    setTitle("");
    setDate("");
    setEmoji("💕");
    setRecurring(true);
    toast("Data especial guardada 📅");
  }

  async function remove(id: number) {
    const response = await fetch(`/api/dates?id=${id}`, { method: "DELETE" });
    if (!response.ok) {
      toast("Não deu para excluir.", "error");
      return;
    }
    setItems((prev) => prev.filter((d) => d.id !== id));
    toast("Data removida");
  }

  const past = items.filter((d) => d.daysLeft < 0);
  const upcoming = items.filter((d) => d.daysLeft >= 0);

  return (
    <div className="flex flex-col gap-4">
      <section className="card-soft p-4" aria-label="Adicionar data especial">
        <h2 className="mb-3 text-center text-sm font-bold text-brand">＋ Nova Data Especial</h2>
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            void add();
          }}
        >
          <label className="sr-only" htmlFor="date-title">
            Nome da data
          </label>
          <input
            id="date-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nome da data (ex.: Nosso aniversário 💕)"
            className="min-h-11 flex-1 rounded-full border border-brand-pastel bg-white px-4 text-sm outline-none"
            maxLength={80}
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="min-h-11 rounded-full border border-brand-pastel bg-white px-4 text-sm outline-none"
            aria-label="Data"
          />
          <select
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            className="min-h-11 rounded-full border border-brand-pastel bg-white px-4 text-lg outline-none"
            aria-label="Emoji"
          >
            {EMOJIS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
          <label className="min-h-11 flex items-center gap-2 rounded-full border border-brand-pastel bg-white px-4 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={recurring}
              onChange={(e) => setRecurring(e.target.checked)}
              className="h-4 w-4 accent-brand"
            />
            Repete todo ano
          </label>
          <button
            type="submit"
            disabled={saving || !title.trim() || !date}
            className="min-h-11 rounded-full bg-gradient-to-r from-brand to-brand-mid px-6 text-sm font-bold text-white transition disabled:opacity-50"
          >
            {saving ? "Salvando..." : "📅 Guardar"}
          </button>
        </form>
      </section>

      {upcoming.length === 0 && past.length === 0 ? (
        <div className="card-soft px-6 py-12 text-center">
          <span className="text-4xl" aria-hidden>
            📅
          </span>
          <h2 className="mt-2 text-lg font-bold text-ink">Nenhuma data especial ainda</h2>
          <p className="text-sm text-ink-soft">Adicione a primeira data acima para começar a contar os dias 💗</p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section className="card-soft p-4" aria-label="Próximas datas">
              <h2 className="text-sm font-bold uppercase tracking-wide text-ink-soft">📅 Próximas datas</h2>
              <ul className="mt-3 flex flex-col gap-2">
                {upcoming.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 rounded-2xl border border-brand-pastel/80 bg-white/70 px-3 py-2">
                    <span aria-hidden>{item.emoji}</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{item.title}</span>
                    <time dateTime={item.date} className="text-xs text-ink-soft whitespace-nowrap">
                      {fullDate(item.date)}
                    </time>
                    <span className="text-xs font-semibold text-brand">
                      {item.daysLeft === 0 ? "hoje 💕" : `em ${item.daysLeft}d`}
                    </span>
                    <button
                      type="button"
                      onClick={() => void remove(item.id)}
                      className="ml-2 text-ink-soft hover:text-brand transition"
                      aria-label={`Excluir ${item.title}`}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {past.length > 0 && (
            <section className="card-soft p-4" aria-label="Datas passadas">
              <h2 className="text-sm font-bold uppercase tracking-wide text-ink-soft">📜 Datas passadas</h2>
              <ul className="mt-3 flex flex-col gap-2">
                {past
                  .sort((a, b) => b.daysLeft - a.daysLeft)
                  .map((item) => (
                    <li key={item.id} className="flex items-center gap-3 rounded-2xl border border-brand-pastel/50 bg-brand-pastel/30 px-3 py-2 opacity-70">
                      <span aria-hidden>{item.emoji}</span>
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{item.title}</span>
                      <time dateTime={item.date} className="text-xs text-ink-soft whitespace-nowrap">
                        {fullDate(item.date)}
                      </time>
                      <span className="text-xs text-ink-soft">
                        {Math.abs(item.daysLeft)} dias atrás
                      </span>
                    </li>
                  ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}