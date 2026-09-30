"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { fullDate } from "@/lib/format";

export type AlbumMemoryItem = {
  id: number;
  url: string;
  kind: string;
  caption: string | null;
  createdAt: Date | string;
};

type Album = {
  id: number;
  title: string;
  description: string | null;
  coverUrl: string | null;
  bgTheme: string;
  ambientSound: string | null;
  fontFamily: string;
};

const BG_THEMES = [
  { key: "rosa", label: "Rosa", value: "#FFF1F4" },
  { key: "pastel", label: "Pastel", value: "#FECBD5" },
  { key: "nuvem", label: "Nuvem", value: "#FFF9FA" },
  { key: "quente", label: "Quente", value: "#FDA4AF" },
];

const SOUND_OPTIONS = ["classico", "chuva", "jazz", "silencio"];
const FONT_OPTIONS = [
  { key: "padrao", label: "Padrão" },
  { key: "serif", label: "Serif" },
  { key: "mono", label: "Mono" },
];

export function AlbumDetail({ album, albumId, initial }: { album: Album; albumId: number; initial: AlbumMemoryItem[] }) {
  const { toast } = useToast();
  const [items, setItems] = useState(initial);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [customizing, setCustomizing] = useState(false);
  const [theme, setTheme] = useState(album.bgTheme);
  const [sound, setSound] = useState(album.ambientSound ?? "classico");
  const [font, setFont] = useState(album.fontFamily);
  const [savingTheme, setSavingTheme] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    const form = new FormData();
    Array.from(files).forEach((file) => form.append("files", file));
    setUploading(true);
    setProgress(0);

    await new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/upload");
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) setProgress(Math.round((event.loaded / event.total) * 100));
      };
      xhr.onload = async () => {
        try {
          const data = JSON.parse(xhr.responseText) as { files?: { url: string; kind: string }[] };
          const put = await fetch("/api/albums", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              albumId,
              memories: (data.files ?? []).map((f) => ({ url: f.url, kind: f.kind })),
            }),
          });
          if (put.ok) {
            const payload = (await put.json()) as { memories: AlbumMemoryItem[] };
            setItems(payload.memories);
            toast("Memórias adicionadas ✨");
          } else {
            toast("Não deu para salvar as memórias.", "error");
          }
        } catch {
          toast("Falha no envio.", "error");
        }
        setUploading(false);
        resolve();
      };
      xhr.onerror = () => {
        setUploading(false);
        toast("Falha no envio.", "error");
        resolve();
      };
      xhr.send(form);
    });
  }

  async function saveCustomization() {
    setSavingTheme(true);
    const response = await fetch("/api/albums", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ albumId, bgTheme: theme, ambientSound: sound, fontFamily: font }),
    });
    setSavingTheme(false);
    if (response.ok) {
      toast("Personalização salva 💗");
      setCustomizing(false);
    } else {
      toast("Não deu para salvar.", "error");
    }
  }

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenIndex(null);
      if (event.key === "ArrowRight") setOpenIndex((i) => ((i ?? 0) + 1) % items.length);
      if (event.key === "ArrowLeft") setOpenIndex((i) => ((i ?? 0) - 1 + items.length) % items.length);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openIndex, items.length]);

  const current = openIndex !== null ? items[openIndex] : null;

  return (
    <div className="flex flex-col gap-4">
      <section className="card-soft p-4" aria-label="Adicionar memórias">
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          hidden
          onChange={(e) => void upload(e.target.files)}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="min-h-12 w-full rounded-full bg-gradient-to-r from-brand to-brand-mid text-sm font-bold text-white transition disabled:opacity-50"
          disabled={uploading}
        >
          {uploading ? `Enviando... ${progress}%` : "📷 + Adicionar fotos e vídeos"}
        </button>
        {uploading && (
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-brand-pastel/60">
            <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
      </section>

      <section className="card-soft p-4" aria-label="Personalizar álbum">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-ink">✨ Personalizar</h3>
          <button
            type="button"
            onClick={() => setCustomizing(!customizing)}
            className="min-h-10 rounded-full border border-brand-pastel bg-white px-3 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand-pastel/40"
          >
            {customizing ? "Fechar" : "Editar"}
          </button>
        </div>

        {customizing && (
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <fieldset>
              <legend className="text-sm font-semibold text-ink">Cor de fundo</legend>
              <div className="mt-2 flex gap-2">
                {BG_THEMES.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    aria-pressed={theme === option.key}
                    aria-label={option.label}
                    onClick={() => setTheme(option.key)}
                    className={`h-10 w-10 rounded-full border-2 transition ${theme === option.key ? "border-brand scale-110" : "border-white"}`}
                    style={{ background: option.value }}
                  />
                ))}
              </div>
            </fieldset>

            <label className="grid gap-1 text-sm font-semibold text-ink">
              Som ambiente
              <select
                value={sound}
                onChange={(e) => setSound(e.target.value)}
                className="min-h-11 rounded-2xl border border-brand-pastel bg-white px-3 text-sm outline-none"
              >
                {SOUND_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1 text-sm font-semibold text-ink">
              Fonte
              <select
                value={font}
                onChange={(e) => setFont(e.target.value)}
                className="min-h-11 rounded-2xl border border-brand-pastel bg-white px-3 text-sm outline-none"
              >
                {FONT_OPTIONS.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {customizing && (
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => void saveCustomization()}
              disabled={savingTheme}
              className="min-h-11 rounded-full bg-gradient-to-r from-brand to-brand-mid px-5 text-sm font-bold text-white disabled:opacity-60"
            >
              {savingTheme ? "Salvando..." : "Salvar"}
            </button>
          </div>
        )}
      </section>

      {items.length === 0 ? (
        <div className="card-soft px-6 py-12 text-center">
          <span className="text-4xl" aria-hidden>
            ✨
          </span>
          <h2 className="mt-2 text-lg font-bold text-ink">Esse álbum está esperando suas primeiras memórias ✨</h2>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {items.map((memory, index) => (
            <li key={memory.id}>
              <button
                type="button"
                onClick={() => setOpenIndex(index)}
                aria-label={`Abrir memória ${index + 1}`}
                className="block w-full overflow-hidden rounded-2xl border border-brand-pastel/70 bg-brand-pastel/30"
              >
                {memory.kind === "video" ? (
                  <span className="relative block">
                    <video src={memory.url} preload="metadata" muted playsInline className="h-36 w-full object-cover" />
                    <span className="absolute inset-0 grid place-items-center text-2xl text-white">▶</span>
                  </span>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={memory.url}
                    alt={memory.caption ?? "Memória do álbum"}
                    loading="lazy"
                    className="h-36 w-full object-cover"
                  />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Visualização de memória"
          className="fixed inset-0 z-[75] flex flex-col bg-ink/80 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpenIndex(null);
          }}
        >
          <div className="flex items-center justify-between p-3 text-white">
            <p className="text-sm font-semibold">
              {(openIndex ?? 0) + 1} / {items.length}
            </p>
            <button
              type="button"
              onClick={() => setOpenIndex(null)}
              className="grid h-11 w-11 place-items-center rounded-full bg-white/15 text-lg"
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>
          <div className="relative flex flex-1 items-center justify-center px-2">
            <button
              type="button"
              onClick={() => setOpenIndex(((openIndex ?? 0) - 1 + items.length) % items.length)}
              className="absolute left-2 grid h-12 w-12 place-items-center rounded-full bg-white/15 text-xl text-white"
              aria-label="Anterior"
            >
              ←
            </button>
            {current.kind === "video" ? (
              <video src={current.url} controls playsInline className="max-h-[75vh] w-auto max-w-full rounded-2xl" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={current.url} alt={current.caption ?? "Memória"} className="max-h-[75vh] w-auto max-w-full rounded-2xl object-contain" />
            )}
            <button
              type="button"
              onClick={() => setOpenIndex(((openIndex ?? 0) + 1) % items.length)}
              className="absolute right-2 grid h-12 w-12 place-items-center rounded-full bg-white/15 text-xl text-white"
              aria-label="Próxima"
            >
              →
            </button>
          </div>
          <div className="bg-surface/90 px-4 py-3 text-ink">
            {current.caption && <p className="text-sm">{current.caption}</p>}
            <p className="text-xs text-ink-soft">
              <time dateTime={String(current.createdAt)}>{fullDate(current.createdAt)}</time>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
