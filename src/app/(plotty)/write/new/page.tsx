import { Suspense } from "react";

import { RequireAuth } from "@/widgets/auth/require-auth";
import { StoryCreateFlowScreen } from "@/widgets/stories/story-create-flow-screen";
import { PageContentSkeleton } from "@/shared/ui/skeletons/app-shell-skeleton";

export default function WriteNewPage() {
  return (
    <Suspense fallback={<PageContentSkeleton />}>
      <RequireAuth>
        <StoryCreateFlowScreen />
      </RequireAuth>
    </Suspense>
  );
}
