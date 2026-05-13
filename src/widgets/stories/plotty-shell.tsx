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
  showMobileBack = true,
  mobileBackHref,
  children,
}: {
  title: ReactNode;
  description: string;
  actions?: ReactNode;
  showMobileBack?: boolean;
  mobileBackHref?: string;
  children: ReactNode;
}) {
  return (
    <PlottyPageShell
      pageTitle={title}
      pageDescription={description}
      pageActions={actions}
      showMobileBack={showMobileBack}
      mobileBackHref={mobileBackHref}
      menuContent={({ closeMenu }) => <PlottyAppMenu onNavigate={closeMenu} />}
    >
      {children}
    </PlottyPageShell>
  );
}

export const ShellCard = PlottySectionCard;
export { PlottyAppMenu, PlottyMobileSheet };
