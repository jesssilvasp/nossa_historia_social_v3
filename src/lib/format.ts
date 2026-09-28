const MONTHS = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

export function timeAgo(input: Date | string): string {
  const date = typeof input === "string" ? new Date(input) : input;
  const diff = Date.now() - date.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min}min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
}

export function fullDate(input: Date | string): string {
  const date = typeof input === "string" ? new Date(input) : input;
  return `${String(date.getUTCDate()).padStart(2, "0")}/${String(
    date.getUTCMonth() + 1,
  ).padStart(2, "0")}/${date.getUTCFullYear()} · ${String(date.getUTCHours()).padStart(2, "0")}h${String(
    date.getUTCMinutes(),
  ).padStart(2, "0")}`;
}

export function clock(seconds?: number | null): string {
  if (!seconds || seconds < 0) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Tempo juntas: anos / meses / dias calculados dinamicamente. */
export function timeTogether(startDate?: string | null): {
  years: number;
  months: number;
  days: number;
  totalDays: number;
} {
  if (!startDate) return { years: 0, months: 0, days: 0, totalDays: 0 };
  const start = new Date(`${startDate}T00:00:00Z`);
  const now = new Date();
  let years = now.getUTCFullYear() - start.getUTCFullYear();
  let months = now.getUTCMonth() - start.getUTCMonth();
  let days = now.getUTCDate() - start.getUTCDate();
  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0));
    days += prevMonth.getUTCDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  const totalDays = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 86400000));
  return { years: Math.max(0, years), months: Math.max(0, months), days: Math.max(0, days), totalDays };
}

/** Dias restantes até a próxima ocorrência da data (aniversário de namoro, aniversários...). */
export function daysUntil(target: string, recurring = true): number {
  const today = new Date();
  const todayMid = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const [y, m, d] = target.split("-").map(Number);
  let next = Date.UTC(today.getUTCFullYear(), (m ?? 1) - 1, d ?? 1);
  if (next < todayMid && recurring) {
    next = Date.UTC(today.getUTCFullYear() + 1, (m ?? 1) - 1, d ?? 1);
  }
  if (next < todayMid && !recurring) return 0;
  return Math.round((next - todayMid) / 86400000);
}

export function monthDayLabel(target: string): string {
  const [, m, d] = target.split("-").map(Number);
  return `${String(d).padStart(2, "0")} ${MONTHS[(m ?? 1) - 1]}`;
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
