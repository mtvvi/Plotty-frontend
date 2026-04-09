import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import Link, { type LinkProps } from "next/link";

import { cn } from "@/shared/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-transparent bg-[var(--plotty-accent)] !text-white shadow-[0_12px_26px_rgba(188,95,61,0.2)] visited:!text-white hover:-translate-y-[1px] hover:bg-[#a65434] hover:shadow-[0_14px_30px_rgba(188,95,61,0.24)]",
  secondary:
    "border-[var(--plotty-line)] bg-white/84 text-[var(--plotty-ink)] shadow-[0_3px_12px_rgba(46,35,23,0.04)] hover:-translate-y-[1px] hover:border-[var(--plotty-line-strong)] hover:bg-white",
  ghost:
    "border-transparent bg-transparent text-[var(--plotty-muted)] hover:bg-black/5 hover:text-[var(--plotty-ink)]",
  destructive:
    "border-[rgba(188,95,61,0.16)] bg-[#fff4ee] text-[var(--plotty-accent)] shadow-[0_3px_12px_rgba(188,95,61,0.06)] hover:border-[rgba(188,95,61,0.26)] hover:bg-[#fee5da]",
};

export function buttonClassName(variant: ButtonVariant = "secondary", className?: string) {
  return cn(
    "plotty-button-label inline-flex min-h-[44px] items-center justify-center rounded-[15px] border px-4 py-2.5 transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plotty-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--plotty-paper)] disabled:pointer-events-none disabled:translate-y-0 disabled:shadow-none disabled:opacity-60",
    variantClasses[variant],
    className,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ className, variant = "secondary", ...props }: ButtonProps) {
  return <button className={buttonClassName(variant, className)} {...props} />;
}

type ButtonLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    variant?: ButtonVariant;
  };

export function ButtonLink({ className, variant = "secondary", ...props }: ButtonLinkProps) {
  return <Link className={buttonClassName(variant, className)} {...props} />;
}
