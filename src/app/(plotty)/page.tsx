import { Suspense } from "react";

import { PageContentSkeleton } from "@/shared/ui/skeletons/app-shell-skeleton";
import { StoriesCatalogShell } from "@/widgets/stories/stories-catalog-shell";

export default function HomePage() {
  return (
    <Suspense fallback={<PageContentSkeleton />}>
      <StoriesCatalogShell />
    </Suspense>
  );
}
