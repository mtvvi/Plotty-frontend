import type { ReactNode } from "react";

import { PlottyAppChrome } from "@/widgets/layout/plotty-page-shell";

export default function PlottyLayout({ children }: { children: ReactNode }) {
  return <PlottyAppChrome>{children}</PlottyAppChrome>;
}
