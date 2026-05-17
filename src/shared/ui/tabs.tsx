import type { ButtonHTMLAttributes, HTMLAttributes } from "react";

import { cn } from "@/shared/lib/utils";

interface TabButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean;
}

interface SegmentedControlProps extends HTMLAttributes<HTMLDivElement> {
  layout?: "inline" | "mobileGrid";
}

export function SegmentedControl({ className, layout = "inline", ...props }: SegmentedControlProps) {
  return (
    <div
      className={cn("plotty-segmented", layout === "mobileGrid" && "plotty-segmented-mobile-grid", className)}
      {...props}
    />
  );
}

export function TabButton({ className, isActive, ...props }: TabButtonProps) {
  return (
    <button
      className={cn(
        "rounded-[calc(var(--plotty-radius-md)-4px)] px-4 py-2.5 text-sm font-semibold transition-[background-color,color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plotty-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--plotty-paper)] disabled:pointer-events-none disabled:opacity-60",
        isActive
          ? "bg-[var(--plotty-accent)] text-white shadow-[0_8px_18px_rgba(188,95,61,0.16)]"
          : "bg-transparent text-[var(--plotty-muted)] hover:bg-white/70 hover:text-[var(--plotty-ink)]",
        className,
      )}
      {...props}
    />
  );
}
