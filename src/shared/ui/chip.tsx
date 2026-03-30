import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

export function chipClassName(selected = false, className?: string) {
  return cn(
    "inline-flex min-h-10 items-center justify-center rounded-full border px-3.5 py-2 text-sm font-semibold leading-none transition-colors",
    selected
      ? "border-transparent bg-[var(--plotty-accent)] !text-white visited:!text-white hover:bg-[#a65434]"
      : "border-[var(--plotty-line)] bg-white/84 text-[var(--plotty-muted)] hover:bg-white",
    className,
  );
}

export function Chip({
  children,
  selected = false,
  onClick,
  className,
}: {
  children: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const content = <span className={chipClassName(selected, className)}>{children}</span>;

  if (!onClick) {
    return content;
  }

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plotty-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--plotty-paper)]"
    >
      {content}
    </button>
  );
}
