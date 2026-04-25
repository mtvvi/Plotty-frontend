import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/shared/lib/utils";

interface TabButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean;
}

export function TabButton({ className, isActive, ...props }: TabButtonProps) {
  return (
    <button
      className={cn(
        "plotty-tab-button rounded-full px-4 py-2.5 text-sm font-semibold transition-[background-color,color,box-shadow]",
        isActive && "plotty-tab-button-active",
        isActive
          ? "bg-[var(--plotty-accent)] text-white shadow-[0_8px_18px_rgba(188,95,61,0.16)]"
          : "bg-transparent text-[var(--plotty-muted)] hover:bg-white/70 hover:text-[var(--plotty-ink)]",
        className,
      )}
      {...props}
    />
  );
}
