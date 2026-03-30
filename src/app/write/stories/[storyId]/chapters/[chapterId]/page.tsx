import { Suspense } from "react";

import { AppShellSkeleton } from "@/shared/ui/skeletons/app-shell-skeleton";
import { StoryEditorScreen } from "@/widgets/stories/story-editor-screen";
import { RequireAuth } from "@/widgets/auth/require-auth";

export default async function ChapterEditorPage({
  params,
}: {
  params: Promise<{ storyId: string; chapterId: string }>;
}) {
  const { storyId, chapterId } = await params;

  return (
    <Suspense fallback={<AppShellSkeleton />}>
      <RequireAuth>
        <StoryEditorScreen storyId={storyId} chapterId={chapterId} />
      </RequireAuth>
    </Suspense>
  );
}
