import type { HTMLAttributes } from "react";

import { cn } from "@/shared/lib/utils";

interface SectionProps extends HTMLAttributes<HTMLElement> {
  title?: string;
  description?: string;
}

export function Section({ className, title, description, children, ...props }: SectionProps) {
  return (
    <section className={cn("space-y-4", className)} {...props}>
      {(title || description) && (
        <header className="space-y-1">
          {title ? <h2 className="text-lg font-semibold">{title}</h2> : null}
          {description ? <p className="text-sm text-[var(--plotty-muted)]">{description}</p> : null}
        </header>
      )}
      {children}
    </section>
  );
}

