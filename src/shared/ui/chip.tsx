import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

type ChipTone = "default" | "accent" | "olive" | "gold" | "blue";

const toneClasses: Record<ChipTone, string> = {
  default: "border-[var(--plotty-line)] bg-[rgba(255,253,249,0.76)] text-[var(--plotty-muted)]",
  accent: "border-[rgba(195,79,50,0.14)] bg-[var(--plotty-accent-wash)] text-[var(--plotty-accent)]",
  olive: "border-[rgba(63,93,69,0.14)] bg-[var(--plotty-olive-soft)] text-[var(--plotty-olive)]",
  gold: "border-[rgba(169,120,46,0.16)] bg-[var(--plotty-gold-soft)] text-[var(--plotty-gold)]",
  blue: "border-[rgba(109,148,183,0.16)] bg-[var(--plotty-blue-soft)] text-[var(--plotty-blue)]",
};

export function chipClassName(selected = false, className?: string, tone: ChipTone = "default") {
  return cn(
    "inline-flex min-h-[32px] items-center justify-center rounded-[var(--plotty-radius-sm)] border px-3 py-1.5 text-xs font-semibold leading-none",
    selected
      ? "border-transparent bg-[var(--plotty-accent)] !text-white shadow-[0_8px_18px_rgba(195,79,50,0.14)] visited:!text-white"
      : toneClasses[tone],
    className,
  );
}

export function Chip({
  children,
  selected = false,
  onClick,
  className,
  tone = "default",
}: {
  children: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  tone?: ChipTone;
}) {
  const content = <span className={chipClassName(selected, className, tone)}>{children}</span>;

  if (!onClick) {
    return content;
  }

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className="rounded-[var(--plotty-radius-sm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plotty-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--plotty-paper)]"
    >
      {content}
    </button>
  );
}
