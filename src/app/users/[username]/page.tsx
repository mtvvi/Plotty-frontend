import { Suspense } from "react";

import { AppShellSkeleton } from "@/shared/ui/skeletons/app-shell-skeleton";
import { PublicProfileScreen } from "@/widgets/profile/public-profile-screen";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  return (
    <Suspense fallback={<AppShellSkeleton />}>
      <PublicProfileScreen username={decodeURIComponent(username)} />
    </Suspense>
  );
}
