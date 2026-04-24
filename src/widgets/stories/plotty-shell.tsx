import type { ReactNode } from "react";

import {
  PlottyAppMenu,
  PlottyMobileSheet,
  PlottyPageShell,
  PlottySectionCard,
} from "@/widgets/layout/plotty-page-shell";

export function PlottyShell({
  variant = "default",
  title,
  description,
  actions,
  showMobileBack = true,
  mobileBackHref,
  suppressPageIntro,
  className,
  children,
}: {
  variant?: "default" | "reader";
  title: string;
  description: string;
  actions?: ReactNode;
  showMobileBack?: boolean;
  mobileBackHref?: string;
  suppressPageIntro?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <PlottyPageShell
      variant={variant}
      pageTitle={title}
      pageDescription={description}
      pageActions={actions}
      showMobileBack={showMobileBack}
      mobileBackHref={mobileBackHref}
      suppressPageIntro={suppressPageIntro}
      className={className}
      menuContent={({ closeMenu }) => <PlottyAppMenu onNavigate={closeMenu} />}
    >
      {children}
    </PlottyPageShell>
  );
}

export const ShellCard = PlottySectionCard;
export { PlottyAppMenu, PlottyMobileSheet };
