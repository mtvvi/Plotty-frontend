import { Suspense } from "react";

import { PageContentSkeleton } from "@/shared/ui/skeletons/app-shell-skeleton";
import { StoryEditorScreen } from "@/widgets/stories/story-editor-screen";
import { RequireAuth } from "@/widgets/auth/require-auth";

export default async function ChapterEditorPage({
  params,
}: {
  params: Promise<{ storyId: string; chapterId: string }>;
}) {
  const { storyId, chapterId } = await params;

  return (
    <Suspense fallback={<PageContentSkeleton />}>
      <RequireAuth>
        <StoryEditorScreen storyId={storyId} chapterId={chapterId} />
      </RequireAuth>
    </Suspense>
  );
}
