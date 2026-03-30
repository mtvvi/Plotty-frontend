import type { ReactNode } from "react";

import {
  PlottyAppMenu,
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
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <PlottyPageShell
      pageTitle={title}
      pageDescription={description}
      pageActions={actions}
      menuContent={({ closeMenu }) => <PlottyAppMenu onNavigate={closeMenu} />}
    >
      {children}
    </PlottyPageShell>
  );
}

export const ShellCard = PlottySectionCard;
export { PlottyAppMenu, PlottyMobileSheet };
