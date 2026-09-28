import Link from "next/link";
import { getSettings, getThrowback, getTracks, getUpcomingDates } from "@/lib/data";
import { monthDayLabel, timeTogether } from "@/lib/format";
import { NowPlayingCard } from "@/components/player/NowPlayingCard";
import type { PlayerTrack } from "@/components/player/MusicPlayerProvider";

export async function AffectiveCards() {
  const [settings, dates, tracks, throwback] = await Promise.all([
    getSettings(),
    getUpcomingDates(1),
    getTracks(),
    getThrowback(),
  ]);

  const together = timeTogether(settings.startDate);
  const next = dates[0];
  const playlist: PlayerTrack[] = tracks.map((t) => ({
    id: t.id,
    title: t.title,
    artist: t.artist,
    url: t.url,
    coverUrl: t.coverUrl,
  }));
  const nowPlaying = playlist.find((t) => t.id === settings.nowPlayingTrackId) ?? playlist[0] ?? null;

  return (
    <div className="flex flex-col gap-4">
      <section className="card-soft p-4" aria-label="Nossa História">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink-soft">💗 Nossa História</h2>
        <p className="mt-1 text-sm text-ink-soft">
          {settings.startDate ? "Juntas há" : "Defina a data de início nas configurações"}
        </p>
        {settings.startDate && (
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <Counter value={together.years} label="anos" />
            <Counter value={together.months} label="meses" />
            <Counter value={together.days} label="dias" />
          </div>
        )}
        {settings.startDate && (
          <p className="mt-3 text-xs text-ink-soft">
            ✦ São {together.totalDays.toLocaleString("pt-BR")} dias de história escritas a duas ✦
          </p>
        )}
      </section>

      <section className="card-soft p-4" aria-label="Próxima data especial">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink-soft">📅 Próxima data especial</h2>
        {next ? (
          <div className="mt-2 flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-pastel/50 text-xl" aria-hidden>
              {next.emoji}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink">{next.title}</p>
              <p className="text-xs text-ink-soft">
                {monthDayLabel(next.date)} ·{" "}
                {next.daysLeft === 0 ? "é hoje! 💕" : `em ${next.daysLeft} ${next.daysLeft === 1 ? "dia" : "dias"}`}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-ink-soft">
            Nenhuma data cadastrada.{" "}
            <Link href="/configuracoes" className="font-semibold text-brand underline decoration-dotted">
              Adicionar
            </Link>
          </p>
        )}
      </section>

      <NowPlayingCard track={nowPlaying} playlist={playlist} />

      {throwback && (
        <section className="card-soft overflow-hidden" aria-label="Lembra disso?">
          <h2 className="px-4 pt-4 text-sm font-bold uppercase tracking-wide text-ink-soft">✨ Lembra disso?</h2>
          {throwback.media[0]?.kind === "video" ? (
            <video
              src={throwback.media[0].url}
              className="mt-3 h-40 w-full object-cover"
              preload="metadata"
              muted
              playsInline
            />
          ) : throwback.media[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={throwback.media[0].url}
              alt={throwback.media[0].alt ?? "Memória antiga de vocês"}
              loading="lazy"
              className="mt-3 h-40 w-full object-cover"
            />
          ) : null}
          <div className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">
              Há {yearsAgo(throwback.createdAt)}
            </p>
            <p className="mt-1 line-clamp-3 text-sm text-ink">{throwback.content || "Um momento guardado 💗"}</p>
            <Link
              href="/momentos"
              className="mt-3 inline-block text-xs font-bold text-brand underline decoration-dotted"
            >
              ver momentos especiais
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

function Counter({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-brand-pastel/80 bg-white/70 px-2 py-2">
      <p className="text-xl font-extrabold text-brand">{value}</p>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">{label}</p>
    </div>
  );
}

function yearsAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days >= 730) return `${Math.floor(days / 365)} anos`;
  if (days >= 365) return "1 ano";
  if (days >= 60) return `${Math.floor(days / 30)} meses`;
  return `${days} dias`;
}
