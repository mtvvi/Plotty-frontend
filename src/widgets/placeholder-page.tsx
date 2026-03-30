import Link from "next/link";

import { ButtonLink } from "@/shared/ui/button";
import { PlottyPageShell, PlottySectionCard } from "@/widgets/layout/plotty-page-shell";

export function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <PlottyPageShell pageTitle={title} pageDescription={description} showBottomNav={false}>
      <PlottySectionCard className="mx-auto max-w-3xl space-y-5 p-8 text-center">
        <span className="plotty-meta text-xs font-bold uppercase tracking-[0.18em]">Placeholder route</span>
        <p className="mx-auto max-w-xl plotty-body text-[var(--plotty-muted)]">{description}</p>
        <div className="flex justify-center">
          <ButtonLink href="/" variant="primary">
            Вернуться в каталог
          </ButtonLink>
        </div>
      </PlottySectionCard>
    </PlottyPageShell>
  );
}
