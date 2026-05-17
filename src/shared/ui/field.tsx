import type { HTMLAttributes, LabelHTMLAttributes } from "react";

import { cn } from "@/shared/lib/utils";

export function fieldClassName(className?: string) {
  return cn(
    "w-full rounded-[var(--plotty-radius-md)] border border-[var(--plotty-line)] bg-[rgba(255,253,249,0.86)] px-4 text-[15px] leading-6 text-[var(--plotty-ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] outline-none transition-[background-color,border-color,color,box-shadow] duration-[var(--motion-base)] ease-[var(--ease-out-soft)] placeholder:text-[var(--plotty-muted-soft)] focus:border-[var(--plotty-accent)] focus:shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_0_0_2px_var(--plotty-accent-soft),0_12px_28px_rgba(195,79,50,0.08)] focus-visible:ring-2 focus-visible:ring-[var(--plotty-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--plotty-paper)]",
    className,
  );
}

export function Field({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-2.5", className)} {...props} />;
}

export function FieldLabel({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("plotty-label block", className)} {...props} />;
}

export function FieldHint({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("plotty-meta", className)} {...props} />;
}

export function FieldError({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm font-semibold text-[var(--plotty-accent)]", className)} {...props} />;
}
