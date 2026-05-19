import type { ReactNode } from "react";

import {
  PlottyMobileSheet,
  PlottyPageShell,
  PlottySectionCard,
} from "@/widgets/layout/plotty-page-shell";

export function PlottyShell({
  title,
  description,
  actions,
  children,
}: {
  title: ReactNode;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <PlottyPageShell
      pageTitle={title}
      pageDescription={description}
      pageActions={actions}
    >
      {children}
    </PlottyPageShell>
  );
}

export const ShellCard = PlottySectionCard;
export { PlottyMobileSheet };
