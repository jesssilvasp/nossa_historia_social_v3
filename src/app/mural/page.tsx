import { PageHeader } from "@/components/ui/PageHeader";
import { WallBoard } from "@/components/wall/WallBoard";
import { getWallMessages } from "@/lib/data";
import { getCurrentProfile } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function WallPage() {
  const [viewer, messages] = await Promise.all([getCurrentProfile(), getWallMessages()]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Nosso Mural 💌"
        subtitle="Recados curtos e carinhosos — diferente do feed, aqui moram as declarações do dia a dia."
      />
      <WallBoard initial={messages} viewerId={viewer.id} />
    </div>
  );
}
