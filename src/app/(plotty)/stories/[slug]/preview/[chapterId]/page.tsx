import { Suspense } from "react";

import { PageContentSkeleton } from "@/shared/ui/skeletons/app-shell-skeleton";
import { RequireAuth } from "@/widgets/auth/require-auth";
import { ChapterReaderScreen } from "@/widgets/stories/chapter-reader-screen";

export default async function ChapterPreviewPage({
  params,
}: {
  params: Promise<{ slug: string; chapterId: string }>;
}) {
  const { slug, chapterId } = await params;

  return (
    <Suspense fallback={<PageContentSkeleton />}>
      <RequireAuth>
        <ChapterReaderScreen slug={slug} chapterId={chapterId} />
      </RequireAuth>
    </Suspense>
  );
}
