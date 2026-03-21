import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/shared/lib/utils";

interface TabButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean;
}

export function TabButton({ className, isActive, ...props }: TabButtonProps) {
  return (
    <button
      className={cn(
        "rounded-full px-3.5 py-2 text-sm font-semibold transition-colors",
        isActive
          ? "bg-[var(--plotty-ink)] text-[var(--plotty-paper)]"
          : "bg-white/60 text-[var(--plotty-muted)] hover:bg-white/80",
        className,
      )}
      {...props}
    />
  );
}

