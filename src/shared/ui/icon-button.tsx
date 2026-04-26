import type { ButtonHTMLAttributes, ReactNode } from "react";

import type { ButtonSize, ButtonVariant } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-transparent bg-[var(--plotty-accent)] !text-white shadow-[0_12px_24px_rgba(195,79,50,0.2)] hover:-translate-y-[1px] hover:bg-[var(--plotty-accent-strong)]",
  secondary:
    "border-[var(--plotty-line)] bg-[rgba(255,253,249,0.78)] text-[var(--plotty-ink)] shadow-[0_4px_14px_rgba(58,43,27,0.04)] hover:-translate-y-[1px] hover:border-[var(--plotty-line-strong)] hover:bg-[var(--plotty-paper-strong)]",
  ghost:
    "border-transparent bg-transparent text-[var(--plotty-muted)] hover:bg-black/5 hover:text-[var(--plotty-ink)]",
  destructive:
    "border-[rgba(189,63,50,0.16)] bg-[var(--plotty-danger-soft)] text-[var(--plotty-danger)] shadow-[0_3px_12px_rgba(189,63,50,0.06)] hover:border-[rgba(189,63,50,0.26)] hover:bg-[#fbd7cd]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "size-10 rounded-[var(--plotty-radius-sm)]",
  md: "size-11 rounded-[var(--plotty-radius-md)]",
  lg: "size-12 rounded-[var(--plotty-radius-md)]",
};

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  size?: ButtonSize;
  variant?: ButtonVariant;
}

export function iconButtonClassName({
  className,
  size = "md",
  variant = "secondary",
}: {
  className?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
} = {}) {
  return cn(
    "inline-flex shrink-0 items-center justify-center border transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plotty-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--plotty-paper)] disabled:pointer-events-none disabled:translate-y-0 disabled:shadow-none disabled:opacity-60",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );
}

export function IconButton({
  children,
  className,
  size = "md",
  type = "button",
  variant = "secondary",
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={iconButtonClassName({ variant, size, className })}
      {...props}
    >
      {children}
    </button>
  );
}
