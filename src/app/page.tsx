import { Suspense } from "react";

import { AppShellSkeleton } from "@/shared/ui/skeletons/app-shell-skeleton";
import { StoriesCatalogShell } from "@/widgets/stories/stories-catalog-shell";

export default function HomePage() {
  return (
    <Suspense fallback={<AppShellSkeleton />}>
      <StoriesCatalogShell />
    </Suspense>
  );
}
