import type { HTMLAttributes } from "react";

import { cn } from "@/shared/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[24px] border border-[var(--plotty-line)] bg-[rgba(255,255,255,0.76)] shadow-[var(--plotty-shadow-soft)]",
        className,
      )}
      {...props}
    />
  );
}
