import type { InputHTMLAttributes } from "react";

import { cn } from "@/shared/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-2xl border border-[var(--plotty-line)] bg-white/80 px-4 text-sm outline-none transition-colors placeholder:text-[var(--plotty-muted)] focus:border-[var(--plotty-accent)]",
        className,
      )}
      {...props}
    />
  );
}

