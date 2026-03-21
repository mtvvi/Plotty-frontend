import type { HTMLAttributes } from "react";

import { cn } from "@/shared/lib/utils";

type BadgeTone = "default" | "accent" | "olive" | "gold";

const toneClasses: Record<BadgeTone, string> = {
  default: "bg-[var(--plotty-panel)] text-[var(--plotty-muted)]",
  accent: "bg-[var(--plotty-accent-soft)] text-[var(--plotty-accent)]",
  olive: "bg-[var(--plotty-olive-soft)] text-[var(--plotty-olive)]",
  gold: "bg-[var(--plotty-gold-soft)] text-[var(--plotty-gold)]",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ className, tone = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}

