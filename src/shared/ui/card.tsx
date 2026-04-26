import type { HTMLAttributes } from "react";

import { cn } from "@/shared/lib/utils";

export type SurfaceVariant =
  | "default"
  | "panel"
  | "inset"
  | "listItem"
  | "sidebar"
  | "subtle"
  | "media"
  | "interactive";

const surfaceClasses: Record<SurfaceVariant, string> = {
  default:
    "rounded-[var(--plotty-radius-lg)] border border-[var(--plotty-line)] bg-[rgba(255,253,249,0.82)] shadow-[var(--plotty-shadow-card)]",
  panel:
    "rounded-[var(--plotty-radius-lg)] border border-[var(--plotty-line)] bg-[var(--plotty-panel-muted)]",
  inset:
    "rounded-[var(--plotty-radius-md)] border border-[var(--plotty-line)] bg-[rgba(255,253,249,0.78)]",
  listItem:
    "rounded-[var(--plotty-radius-md)] border border-[var(--plotty-line)] bg-[rgba(255,253,249,0.76)]",
  sidebar:
    "rounded-[var(--plotty-radius-lg)] border border-[var(--plotty-line)] bg-[rgba(250,245,238,0.78)] shadow-[0_12px_34px_rgba(58,43,27,0.06)]",
  subtle:
    "rounded-[var(--plotty-radius-md)] border border-[var(--plotty-line)] bg-[rgba(255,253,249,0.56)]",
  media:
    "overflow-hidden rounded-[var(--plotty-radius-lg)] border border-[var(--plotty-line)] bg-[linear-gradient(135deg,var(--plotty-panel),var(--plotty-paper))]",
  interactive:
    "rounded-[var(--plotty-radius-lg)] border border-[var(--plotty-line)] bg-[rgba(255,253,249,0.84)] shadow-[var(--plotty-shadow-card)] transition-[border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-[rgba(195,79,50,0.2)] hover:shadow-[0_24px_58px_rgba(58,43,27,0.13)]",
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
