import { Suspense } from "react";

import { PageContentSkeleton } from "@/shared/ui/skeletons/app-shell-skeleton";
import { AuthScreen } from "@/widgets/auth/auth-screen";

export default function AuthPage() {
  return (
    <Suspense fallback={<PageContentSkeleton />}>
      <AuthScreen />
    </Suspense>
  );
}
