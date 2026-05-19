import { Suspense } from "react";

import { PageContentSkeleton } from "@/shared/ui/skeletons/app-shell-skeleton";
import { ReaderLibraryScreen } from "@/widgets/library/reader-library-screen";

export default function LibraryPage() {
  return (
    <Suspense fallback={<PageContentSkeleton />}>
      <ReaderLibraryScreen />
    </Suspense>
  );
}
