import type { HTMLAttributes } from "react";

import { cn } from "@/shared/lib/utils";

export type SurfaceVariant = "default" | "panel" | "inset" | "listItem";

const surfaceClasses: Record<SurfaceVariant, string> = {
  default:
    "rounded-[24px] border border-[rgba(41,38,34,0.08)] bg-[rgba(255,255,255,0.8)] shadow-[var(--plotty-shadow-card)]",
  panel:
    "rounded-[22px] border border-[rgba(41,38,34,0.08)] bg-[var(--plotty-panel-muted)]",
  inset:
    "rounded-[18px] border border-[rgba(41,38,34,0.06)] bg-white/72",
  listItem:
    "rounded-[20px] border border-[rgba(41,38,34,0.08)] bg-white/76",
};

export interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  variant?: SurfaceVariant;
}

export function surfaceClassName(variant: SurfaceVariant = "default", className?: string) {
  return cn(surfaceClasses[variant], className);
}

export function Card({ className, variant = "default", ...props }: SurfaceProps) {
  return (
    <div
      className={surfaceClassName(variant, className)}
      {...props}
    />
  );
}

export function Surface({ className, variant = "panel", ...props }: SurfaceProps) {
  return <div className={surfaceClassName(variant, className)} {...props} />;
}
