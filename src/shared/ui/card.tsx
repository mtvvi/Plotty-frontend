import type { HTMLAttributes } from "react";

import { cn } from "@/shared/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[24px] border border-[rgba(41,38,34,0.08)] bg-[rgba(255,255,255,0.8)] shadow-[var(--plotty-shadow-card)]",
        className,
      )}
      {...props}
    />
  );
}
