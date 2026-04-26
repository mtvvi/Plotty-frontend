import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes } from "react";
import Link, { type LinkProps } from "next/link";

import { cn } from "@/shared/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-transparent bg-[var(--plotty-accent)] !text-white shadow-[0_12px_24px_rgba(195,79,50,0.2)] visited:!text-white hover:-translate-y-[1px] hover:bg-[var(--plotty-accent-strong)] hover:shadow-[0_16px_30px_rgba(195,79,50,0.23)]",
  secondary:
    "border-[var(--plotty-line)] bg-[rgba(255,253,249,0.78)] text-[var(--plotty-ink)] shadow-[0_4px_14px_rgba(58,43,27,0.04)] hover:-translate-y-[1px] hover:border-[var(--plotty-line-strong)] hover:bg-[var(--plotty-paper-strong)]",
  ghost:
    "border-transparent bg-transparent text-[var(--plotty-muted)] hover:bg-black/5 hover:text-[var(--plotty-ink)]",
  destructive:
    "border-[rgba(189,63,50,0.16)] bg-[var(--plotty-danger-soft)] text-[var(--plotty-danger)] shadow-[0_3px_12px_rgba(189,63,50,0.06)] hover:border-[rgba(189,63,50,0.26)] hover:bg-[#fbd7cd]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-10 rounded-[var(--plotty-radius-sm)] px-3 py-2 text-sm",
  md: "min-h-[44px] rounded-[var(--plotty-radius-md)] px-4 py-2.5",
  lg: "min-h-12 rounded-[var(--plotty-radius-md)] px-5 py-3 text-base",
};

export function buttonClassName({
  variant = "secondary",
  size = "md",
  fullWidth = false,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
} = {}) {
  return cn(
    "plotty-button-label inline-flex items-center justify-center gap-2 border transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plotty-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--plotty-paper)] disabled:pointer-events-none disabled:translate-y-0 disabled:shadow-none disabled:opacity-60",
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && "w-full",
    className,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    className,
    disabled,
    fullWidth,
    isLoading = false,
    size = "md",
    variant = "secondary",
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      className={buttonClassName({ variant, size, fullWidth, className })}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading ? (
        <span
          className="mr-2 size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      ) : null}
      {children}
    </button>
  );
});

type ButtonLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    fullWidth?: boolean;
  };

export function ButtonLink({
  className,
  fullWidth,
  size = "md",
  variant = "secondary",
  ...props
}: ButtonLinkProps) {
  return <Link className={buttonClassName({ variant, size, fullWidth, className })} {...props} />;
}
