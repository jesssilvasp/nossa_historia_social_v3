import { AffectiveCards } from "./AffectiveCards";

export function RightSidebar() {
  return (
    <aside
      aria-label="Nossa História"
      className="contents lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-[300px] lg:shrink-0 lg:flex-col lg:gap-4 lg:overflow-y-auto lg:py-4 lg:pr-2 lg:no-scrollbar xl:w-[320px]"
    >
      <h2 className="hidden px-2 text-lg font-extrabold text-ink lg:block">Nossa História 💕</h2>
      <AffectiveCards sidebar />
    </aside>
  );
}
