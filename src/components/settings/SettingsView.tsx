"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { timeTogether } from "@/lib/format";

type Props = {
  settings: {
    coupleName: string;
    tagline: string;
    startDate: string | null;
    city: string;
    ambientSound: string;
    bgColor: string;
    fontFamily: string;
  };
  viewer: { id: number; username: string; displayName: string; avatarUrl: string | null; bio: string | null };
  profiles: { id: number; username: string; displayName: string; avatarUrl: string | null }[];
  dates: { id: number; title: string; date: string; emoji: string; daysLeft: number }[];
};

const BG_OPTIONS = [
  { key: "rosa", label: "Rosa", value: "#FFF1F4" },
  { key: "pastel", label: "Pastel", value: "#FECBD5" },
  { key: "nuvem", label: "Nuvem", value: "#FFF9FA" },
  { key: "quente", label: "Quente", value: "#FDA4AF" },
];

const SOUND_OPTIONS = ["classico", "chuva", "jazz", "silencio"];

export function SettingsView({ settings, viewer, profiles, dates }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState(settings);
  const [profileForm, setProfileForm] = useState({
    displayName: viewer.displayName,
    bio: viewer.bio ?? "",
    username: viewer.username,
  });
  const [dateForm, setDateForm] = useState({ title: "", date: "", emoji: "💕" });
  const [saving, setSaving] = useState(false);
  const together = timeTogether(form.startDate);

  async function saveSettings() {
    setSaving(true);
    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    toast(response.ok ? "Personalização salva 💗" : "Não conseguimos salvar.", response.ok ? "ok" : "error");
    router.refresh();
  }

  async function saveProfile() {
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileForm),
    });
    toast(response.ok ? "Perfil atualizado ✨" : "Não conseguimos atualizar.", response.ok ? "ok" : "error");
    router.refresh();
  }

  async function switchProfile(id: number) {
    await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId: id }),
    });
    toast("Agora você está publicando como outra pessoa 💕");
    router.refresh();
  }

  async function addDate() {
    const response = await fetch("/api/dates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dateForm),
    });
    if (!response.ok) {
      toast("Informe título e data válidos.", "error");
      return;
    }
    setDateForm({ title: "", date: "", emoji: "💕" });
    toast("Data especial guardada 📅");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="card-soft p-4" aria-label="Identidade ativa">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink-soft">👤 Quem está publicando</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {profiles.map((profile) => (
            <button
              key={profile.id}
              type="button"
              onClick={() => void switchProfile(profile.id)}
              aria-pressed={profile.id === viewer.id}
              className={`flex min-h-12 flex-1 items-center gap-2 rounded-2xl border px-3 py-2 text-left text-sm font-semibold transition ${
                profile.id === viewer.id
                  ? "border-brand bg-brand-pastel/40 text-brand"
                  : "border-brand-pastel bg-white/70 text-ink hover:bg-white"
              }`}
            >
              <Avatar name={profile.displayName} src={profile.avatarUrl} size="sm" ring={false} />
              <span className="min-w-0 truncate">{profile.displayName}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="card-soft p-4" aria-label="Editar perfil">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink-soft">✏️ Perfil</h2>
        <div className="mt-3 grid gap-2">
          <input
            value={profileForm.displayName}
            onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
            placeholder="Nome"
            aria-label="Nome"
            className="min-h-11 rounded-2xl border border-brand-pastel bg-white px-4 text-sm outline-none"
          />
          <input
            value={profileForm.username}
            onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
            placeholder="@usuario"
            aria-label="Nome de usuário"
            className="min-h-11 rounded-2xl border border-brand-pastel bg-white px-4 text-sm outline-none"
          />
          <textarea
            value={profileForm.bio}
            onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
            rows={2}
            placeholder="bio"
            aria-label="Bio"
            className="rounded-2xl border border-brand-pastel bg-white px-4 py-3 text-sm outline-none"
          />
          <button
            type="button"
            onClick={() => void saveProfile()}
            className="min-h-11 self-start rounded-full bg-brand px-5 text-sm font-bold text-white"
          >
            Salvar perfil
          </button>
        </div>
      </section>

      <section className="card-soft p-4" aria-label="Personalização">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink-soft">🎨 Personalização</h2>
        <div className="mt-3 grid gap-3">
          <label className="grid gap-1 text-sm font-semibold text-ink">
            Nome do cantinho
            <input
              value={form.coupleName}
              onChange={(e) => setForm({ ...form, coupleName: e.target.value })}
              className="min-h-11 rounded-2xl border border-brand-pastel bg-white px-4 text-sm outline-none"
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-ink">
            Assinatura
            <input
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              className="min-h-11 rounded-2xl border border-brand-pastel bg-white px-4 text-sm outline-none"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="grid gap-1 text-sm font-semibold text-ink">
              Começo de tudo
              <input
                type="date"
                value={form.startDate ?? ""}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="min-h-11 rounded-2xl border border-brand-pastel bg-white px-3 text-sm outline-none"
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-ink">
              Cidade
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="min-h-11 rounded-2xl border border-brand-pastel bg-white px-4 text-sm outline-none"
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-ink">
              Som ambiente
              <select
                value={form.ambientSound}
                onChange={(e) => setForm({ ...form, ambientSound: e.target.value })}
                className="min-h-11 rounded-2xl border border-brand-pastel bg-white px-3 text-sm outline-none"
              >
                {SOUND_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <fieldset>
            <legend className="text-sm font-semibold text-ink">Cor de fundo</legend>
            <div className="mt-2 flex gap-2">
              {BG_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  aria-pressed={form.bgColor === option.key}
                  aria-label={option.label}
                  onClick={() => setForm({ ...form, bgColor: option.key })}
                  className={`h-10 w-10 rounded-full border-2 transition ${
                    form.bgColor === option.key ? "border-brand scale-110" : "border-white"
                  }`}
                  style={{ background: option.value }}
                />
              ))}
            </div>
          </fieldset>

          <button
            type="button"
            onClick={() => void saveSettings()}
            disabled={saving}
            className="min-h-12 self-start rounded-full bg-gradient-to-r from-brand to-brand-mid px-6 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving ? "Salvando..." : "💾 Salvar"}
          </button>
        </div>
      </section>

      <section className="card-soft p-4" aria-label="Datas especiais">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink-soft">📅 Datas especiais</h2>
        {form.startDate && (
          <p className="mt-1 text-xs text-ink-soft">
            Juntas há {together.years}a {together.months}m {together.days}d ({together.totalDays} dias)
          </p>
        )}
        <ul className="mt-3 flex flex-col gap-2">
          {dates.map((item) => (
            <li key={item.id} className="flex items-center gap-3 rounded-2xl border border-brand-pastel/80 bg-white/70 px-3 py-2">
              <span aria-hidden>{item.emoji}</span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{item.title}</span>
              <span className="text-xs text-ink-soft">
                {item.daysLeft === 0 ? "hoje 💕" : `em ${item.daysLeft}d`}
              </span>
            </li>
          ))}
          {dates.length === 0 && <li className="text-sm text-ink-soft">Nenhuma data cadastrada ainda.</li>}
        </ul>
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <input
            value={dateForm.title}
            onChange={(e) => setDateForm({ ...dateForm, title: e.target.value })}
            placeholder="Nome da data (ex.: Nosso aniversário 💕)"
            aria-label="Nome da data especial"
            className="min-h-11 rounded-2xl border border-brand-pastel bg-white px-4 text-sm outline-none"
          />
          <input
            type="date"
            value={dateForm.date}
            onChange={(e) => setDateForm({ ...dateForm, date: e.target.value })}
            aria-label="Data"
            className="min-h-11 rounded-2xl border border-brand-pastel bg-white px-3 text-sm outline-none"
          />
          <button
            type="button"
            onClick={() => void addDate()}
            className="min-h-11 rounded-full bg-brand px-5 text-sm font-bold text-white"
          >
            Adicionar
          </button>
        </div>
      </section>
    </div>
  );
}
