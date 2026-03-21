import type { TextareaHTMLAttributes } from "react";

import { cn } from "@/shared/lib/utils";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-36 w-full rounded-[20px] border border-[var(--plotty-line)] bg-white/85 px-4 py-3 text-sm leading-7 outline-none transition-colors placeholder:text-[var(--plotty-muted)] focus:border-[var(--plotty-accent)]",
        className,
      )}
      {...props}
    />
  );
}
