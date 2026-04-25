import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

export function chipClassName(selected = false, className?: string) {
  return cn(
    "plotty-tag-chip inline-flex min-h-[36px] items-center justify-center rounded-full border px-3.5 py-2 text-sm font-semibold leading-none transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out",
    selected && "plotty-tag-chip-selected",
    selected
      ? "border-transparent bg-[var(--plotty-accent)] !text-white shadow-[0_8px_18px_rgba(188,95,61,0.14)] visited:!text-white hover:-translate-y-[1px] hover:bg-[#a65434]"
      : "border-[rgba(41,38,34,0.09)] bg-white/84 text-[var(--plotty-muted)] hover:-translate-y-[1px] hover:border-[var(--plotty-line-strong)] hover:bg-white hover:text-[var(--plotty-ink)]",
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
