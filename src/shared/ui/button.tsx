import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/shared/lib/utils";

type ButtonVariant = "primary" | "secondary" | "soft" | "ghost";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-[var(--plotty-accent)] text-[#fff8f4] hover:bg-[#a64f30]",
  secondary:
    "bg-white/80 text-[var(--plotty-ink)] border border-[var(--plotty-line)] hover:bg-white",
  soft: "bg-[var(--plotty-olive-soft)] text-[var(--plotty-olive)] hover:bg-[#c8d6ca]",
  ghost: "bg-transparent text-[var(--plotty-muted)] hover:bg-black/5",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ className, variant = "secondary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-[14px] px-4 text-sm font-bold transition-colors",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}

