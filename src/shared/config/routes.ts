import { encodePathSegment } from "@/shared/lib/safe-url";

export const routes = {
  home: "/",
  auth: (options?: { mode?: "login" | "register"; next?: string }) => {
    const params = new URLSearchParams();

    if (options?.mode && options.mode !== "login") {
      params.set("mode", options.mode);
    }

    if (options?.next) {
      params.set("next", options.next);
    }

    return params.toString() ? `/auth?${params.toString()}` : "/auth";
  },
  write: "/write",
  writeNew: "/write/new",
  fandoms: "/fandoms",
  credits: "/credits",
  library: "/library",
  user: (username: string) => `/users/${encodePathSegment(username)}`,
  userCollection: (username: string, collectionId: string) =>
    `/users/${encodePathSegment(username)}/collections/${encodePathSegment(collectionId)}`,
  story: (slug: string) => `/stories/${encodePathSegment(slug)}`,
  chapter: (slug: string, number: number) => `/stories/${encodePathSegment(slug)}/chapters/${encodePathSegment(number)}`,
  chapterPreview: (slug: string, chapterId: string) =>
    `/stories/${encodePathSegment(slug)}/preview/${encodePathSegment(chapterId)}`,
  storySettings: (storyId: string) => `/write/stories/${encodePathSegment(storyId)}/settings`,
  chapterEditor: (storyId: string, chapterId: string) =>
    `/write/stories/${encodePathSegment(storyId)}/chapters/${encodePathSegment(chapterId)}`,
} as const;
