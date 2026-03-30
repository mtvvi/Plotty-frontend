import { Suspense } from "react";

import { StoryCreateScreen } from "@/widgets/stories/story-create-screen";
import { RequireAuth } from "@/widgets/auth/require-auth";
import { AppShellSkeleton } from "@/shared/ui/skeletons/app-shell-skeleton";

export default function WritePage() {
  return (
    <Suspense fallback={<AppShellSkeleton />}>
      <RequireAuth>
        <StoryCreateScreen />
      </RequireAuth>
    </Suspense>
  );
}
