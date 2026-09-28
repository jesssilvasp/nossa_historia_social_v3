import { AffectiveCards } from "./AffectiveCards";

export function RightSidebar() {
  return (
    <aside
      aria-label="Nossa História"
      className="sticky top-0 hidden h-screen w-[300px] shrink-0 flex-col gap-4 overflow-y-auto py-4 pr-2 no-scrollbar xl:w-[320px] lg:flex"
    >
      <h2 className="px-2 text-lg font-extrabold text-ink">Nossa História 💕</h2>
      <AffectiveCards />
    </aside>
  );
}
