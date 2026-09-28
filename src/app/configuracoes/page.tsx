import { SettingsView } from "@/components/settings/SettingsView";
import { PageHeader } from "@/components/ui/PageHeader";
import { getSettings, getUpcomingDates } from "@/lib/data";
import { getCurrentProfile, listProfiles } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [viewer, profiles, settings, dates] = await Promise.all([
    getCurrentProfile(),
    listProfiles(),
    getSettings(),
    getUpcomingDates(10),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Configurações ⚙" subtitle="Personalize o cantinho e o perfil de vocês." />
      <SettingsView
        settings={{
          coupleName: settings.coupleName,
          tagline: settings.tagline,
          startDate: settings.startDate,
          city: settings.city,
          ambientSound: settings.ambientSound,
          bgColor: settings.bgColor,
          fontFamily: settings.fontFamily,
        }}
        viewer={{
          id: viewer.id,
          username: viewer.username,
          displayName: viewer.displayName,
          avatarUrl: viewer.avatarUrl,
          bio: viewer.bio,
        }}
        profiles={profiles.map((p) => ({
          id: p.id,
          username: p.username,
          displayName: p.displayName,
          avatarUrl: p.avatarUrl,
        }))}
        dates={dates.map((d) => ({ id: d.id, title: d.title, date: d.date, emoji: d.emoji, daysLeft: d.daysLeft }))}
      />
    </div>
  );
}
