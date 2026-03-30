import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import Link, { type LinkProps } from "next/link";

import { cn } from "@/shared/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "border-transparent bg-[var(--plotty-accent)] !text-white visited:!text-white hover:bg-[#a65434]",
  secondary:
    "border-[var(--plotty-line)] bg-white/82 text-[var(--plotty-ink)] hover:bg-white",
  ghost: "border-transparent bg-transparent text-[var(--plotty-muted)] hover:bg-black/5",
  destructive:
    "border-[rgba(188,95,61,0.2)] bg-[#fff4ee] text-[var(--plotty-accent)] hover:bg-[#fee5da]",
};

export function buttonClassName(variant: ButtonVariant = "secondary", className?: string) {
  return cn(
    "plotty-button-label inline-flex min-h-11 items-center justify-center rounded-[16px] border px-4 py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plotty-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--plotty-paper)] disabled:pointer-events-none disabled:opacity-60",
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
