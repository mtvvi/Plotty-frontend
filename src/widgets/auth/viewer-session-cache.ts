"use client";

import type { QueryClient } from "@tanstack/react-query";

import { authKeys } from "@/entities/auth/api/auth-api";
import { libraryKeys } from "@/entities/library/api/library-api";
import { profileKeys } from "@/entities/profile/api/profile-api";
import { storyKeys } from "@/entities/story/api/stories-api";

export async function resetViewerSessionCache(queryClient: QueryClient) {
  queryClient.removeQueries({ queryKey: storyKeys.all });
  queryClient.removeQueries({ queryKey: profileKeys.all });
  queryClient.removeQueries({ queryKey: libraryKeys.all });

  await queryClient.invalidateQueries({ queryKey: authKeys.session() });
}
