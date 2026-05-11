import { Suspense } from "react";

import { AppShellSkeleton } from "@/shared/ui/skeletons/app-shell-skeleton";
import { RequireAuth } from "@/widgets/auth/require-auth";
import { CreditsScreen } from "@/widgets/credits/credits-screen";

export default function CreditsPage() {
  return (
    <Suspense fallback={<AppShellSkeleton />}>
      <RequireAuth>
        <CreditsScreen />
      </RequireAuth>
    </Suspense>
  );
}
