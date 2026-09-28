"use client";

import { initials } from "@/lib/format";

type Size = "sm" | "md" | "lg" | "xl";

const sizes: Record<Size, string> = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-10 w-10 text-xs",
  lg: "h-12 w-12 text-sm",
  xl: "h-24 w-24 text-2xl",
};

export function Avatar({
  name,
  src,
  size = "md",
  ring = true,
}: {
  name: string;
  src?: string | null;
  size?: Size;
  ring?: boolean;
}) {
  return (
    <span
      className={`${sizes[size]} relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand-pastel via-brand-light to-brand-mid font-bold text-white ${
        ring ? "ring-2 ring-white shadow-[0_6px_18px_-8px_rgba(244,63,117,0.8)]" : ""
      }`}
      aria-hidden={false}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={`Avatar de ${name}`} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <span>{initials(name.replace(/[^\p{L}\s]/gu, "") || name)}</span>
      )}
    </span>
  );
}
