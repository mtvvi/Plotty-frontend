import { storyTags } from "@/shared/config/story-tags";

import type { ChapterListItem, StoriesQuery, StoryListItem } from "./types";

export function isStoryInPublicCatalog(story: StoryListItem): boolean {
  return story.status === "published";
}

export function publicChaptersForReader(chapters: ChapterListItem[]): ChapterListItem[] {
  const published = chapters.filter((ch) => (ch.status ?? "published") === "published");

  return published.map((ch, index) => ({
    ...ch,
    number: index + 1,
  }));
}

export const defaultStoriesQuery: StoriesQuery = {
  tags: [],
  q: "",
  page: 1,
  pageSize: 20,
};

const legacyQueryCategories = {
  fandom: "directionality",
  rating: "rating",
  status: "completion",
  size: "size",
} as const;

function normalizeTagValue(value: string) {
  return value.trim().toLowerCase();
}

function resolveLegacyTagSlug(category: string, value: string) {
  const normalizedValue = normalizeTagValue(value);

  if (!normalizedValue) {
    return null;
  }

  return (
    storyTags.find(
      (tag) =>
        tag.category === category &&
        (normalizeTagValue(tag.slug) === normalizedValue || normalizeTagValue(tag.name) === normalizedValue),
    )?.slug ?? null
  );
}

export function parseStoriesQuery(searchParams: URLSearchParams): StoriesQuery {
  const rawTags = searchParams.getAll("tag");
  const rawPage = Number(searchParams.get("page") ?? defaultStoriesQuery.page);
  const rawPageSize = Number(searchParams.get("pageSize") ?? defaultStoriesQuery.pageSize);
  const legacyTags = Object.entries(legacyQueryCategories)
    .map(([param, category]) => resolveLegacyTagSlug(category, searchParams.get(param) ?? ""))
    .filter((tagSlug): tagSlug is string => Boolean(tagSlug));

  return {
    tags: [...rawTags, ...legacyTags].filter((tag, index, items) => tag.trim() && items.indexOf(tag) === index),
    q: searchParams.get("q")?.trim() ?? "",
    page: Number.isFinite(rawPage) && rawPage > 0 ? rawPage : defaultStoriesQuery.page,
    pageSize: Number.isFinite(rawPageSize) && rawPageSize > 0 ? rawPageSize : defaultStoriesQuery.pageSize,
  };
}

export function serializeStoriesQuery(query: StoriesQuery) {
  const params = new URLSearchParams();

  query.tags.forEach((tag) => params.append("tag", tag));

  if (query.q) {
    params.set("q", query.q);
  }

  if (query.page !== defaultStoriesQuery.page) {
    params.set("page", String(query.page));
  }

  if (query.pageSize !== defaultStoriesQuery.pageSize) {
    params.set("pageSize", String(query.pageSize));
  }

  return params;
}
