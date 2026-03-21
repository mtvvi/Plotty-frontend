export const routes = {
  home: "/",
  fandoms: "/fandoms",
  authors: "/authors",
  recommendations: "/recommendations",
  write: "/write",
  story: (slug: string) => `/stories/${slug}`,
  chapter: (slug: string, number: number) => `/stories/${slug}/chapters/${number}`,
  chapterEditor: (storyId: string, chapterId: string) => `/write/stories/${storyId}/chapters/${chapterId}`,
} as const;
