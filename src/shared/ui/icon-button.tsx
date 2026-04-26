import type { ButtonHTMLAttributes, ReactNode } from "react";

import type { ButtonSize, ButtonVariant } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-transparent bg-[var(--plotty-accent)] !text-white shadow-[0_12px_26px_rgba(188,95,61,0.2)] hover:-translate-y-[1px] hover:bg-[#a65434]",
  secondary:
    "border-[var(--plotty-line)] bg-white/84 text-[var(--plotty-ink)] shadow-[0_3px_12px_rgba(46,35,23,0.04)] hover:-translate-y-[1px] hover:border-[var(--plotty-line-strong)] hover:bg-white",
  ghost:
    "border-transparent bg-transparent text-[var(--plotty-muted)] hover:bg-black/5 hover:text-[var(--plotty-ink)]",
  destructive:
    "border-[rgba(188,95,61,0.16)] bg-[#fff4ee] text-[var(--plotty-accent)] shadow-[0_3px_12px_rgba(188,95,61,0.06)] hover:border-[rgba(188,95,61,0.26)] hover:bg-[#fee5da]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "size-10 rounded-[13px]",
  md: "size-11 rounded-[15px]",
  lg: "size-12 rounded-[16px]",
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
