"use client";

import type { QueryClient } from "@tanstack/react-query";

import { authKeys } from "@/entities/auth/api/auth-api";
import { creditsKeys } from "@/entities/credits/api/credits-api";
import { libraryKeys } from "@/entities/library/api/library-api";
import { profileKeys } from "@/entities/profile/api/profile-api";
import { storyKeys } from "@/entities/story/api/stories-api";

const viewerLocalStorageKeyPrefixes = ["plotty:chapter-spellcheck:"];
const viewerLocalStorageKeys = ["plotty.generated-images", "plotty.generated-story-covers"];

export function clearViewerLocalCaches() {
  if (typeof window === "undefined") {
    return;
  }

  viewerLocalStorageKeys.forEach((key) => window.localStorage.removeItem(key));

  for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
    const key = window.localStorage.key(index);

    if (key && viewerLocalStorageKeyPrefixes.some((prefix) => key.startsWith(prefix))) {
      window.localStorage.removeItem(key);
    }
  }
}

export async function resetViewerSessionCache(queryClient: QueryClient) {
  clearViewerLocalCaches();

  queryClient.removeQueries({ queryKey: storyKeys.all });
  queryClient.removeQueries({ queryKey: profileKeys.all });
  queryClient.removeQueries({ queryKey: libraryKeys.all });
  queryClient.removeQueries({ queryKey: creditsKeys.all });

  await queryClient.invalidateQueries({ queryKey: authKeys.session() });
}
