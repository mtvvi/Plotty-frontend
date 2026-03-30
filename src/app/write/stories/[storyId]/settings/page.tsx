import { Suspense } from "react";

import { RequireAuth } from "@/widgets/auth/require-auth";
import { AppShellSkeleton } from "@/shared/ui/skeletons/app-shell-skeleton";
import { StorySettingsScreen } from "@/widgets/stories/story-settings-screen";

export default async function StorySettingsPage({
  params,
}: {
  params: Promise<{ storyId: string }>;
}) {
  const { storyId } = await params;

  return (
    <Suspense fallback={<AppShellSkeleton />}>
      <RequireAuth>
        <StorySettingsScreen storyId={storyId} />
      </RequireAuth>
    </Suspense>
  );
}
