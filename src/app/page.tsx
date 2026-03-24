import { Suspense } from "react";
import { StoriesCatalogShell } from "@/widgets/stories/stories-catalog-shell";
import { AppShellSkeleton } from "@/shared/ui/skeletons/app-shell-skeleton";

export default function HomePage() {
  return (
    <Suspense fallback={<AppShellSkeleton />}>
      <StoriesCatalogShell />
    </Suspense>
  );
}
