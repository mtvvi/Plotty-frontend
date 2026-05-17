import { Suspense } from "react";

import { PageContentSkeleton } from "@/shared/ui/skeletons/app-shell-skeleton";
import { RequireAuth } from "@/widgets/auth/require-auth";
import { CreditsScreen } from "@/widgets/credits/credits-screen";

export default function CreditsPage() {
  return (
    <Suspense fallback={<PageContentSkeleton />}>
      <RequireAuth>
        <CreditsScreen />
      </RequireAuth>
    </Suspense>
  );
}
