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
  story: (slug: string) => `/stories/${slug}`,
  chapter: (slug: string, number: number) => `/stories/${slug}/chapters/${number}`,
  chapterPreview: (slug: string, chapterId: string) => `/stories/${slug}/preview/${chapterId}`,
  storySettings: (storyId: string) => `/write/stories/${storyId}/settings`,
  chapterEditor: (storyId: string, chapterId: string) => `/write/stories/${storyId}/chapters/${chapterId}`,
} as const;
