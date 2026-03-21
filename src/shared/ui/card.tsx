import type { HTMLAttributes } from "react";

import { cn } from "@/shared/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[20px] border border-[var(--plotty-line)] bg-white/70 shadow-[var(--plotty-shadow-soft)]",
        className,
      )}
      {...props}
    />
  );
}

