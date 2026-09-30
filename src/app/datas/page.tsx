import { PageHeader } from "@/components/ui/PageHeader";
import { getUpcomingDates } from "@/lib/data";
import DatesClient from "./DatesClient";

export const dynamic = "force-dynamic";

export default async function DatesPage() {
  const dates = await getUpcomingDates(50);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Datas Especiais 📅"
        subtitle="Aniversários, viagens, conquistas — todas as datas que fazem nossa história."
      />
      <DatesClient initial={dates} />
    </div>
  );
}