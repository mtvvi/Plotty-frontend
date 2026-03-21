import {
  storyFandoms,
  storyRatings,
  storySizes,
  storyStatuses,
  storyTags,
} from "@/shared/config/story-tags";

import type { StoriesQuery } from "./types";

const validTagSlugs = new Set(storyTags.map((tag) => tag.slug));

function pickValidOption(options: readonly string[], value: string | null) {
  return value && options.includes(value) ? value : "";
}

export const defaultStoriesQuery: StoriesQuery = {
  tags: [],
  fandom: "",
  rating: "",
  status: "",
  size: "",
  page: 1,
  pageSize: 20,
};

export function parseStoriesQuery(searchParams: URLSearchParams): StoriesQuery {
  const rawTags = searchParams.getAll("tag");
  const rawPage = Number(searchParams.get("page") ?? defaultStoriesQuery.page);
  const rawPageSize = Number(searchParams.get("pageSize") ?? defaultStoriesQuery.pageSize);

  return {
    tags: rawTags.filter((tag, index) => validTagSlugs.has(tag) && rawTags.indexOf(tag) === index),
    fandom: pickValidOption(storyFandoms, searchParams.get("fandom")),
    rating: pickValidOption(storyRatings, searchParams.get("rating")),
    status: pickValidOption(storyStatuses, searchParams.get("status")),
    size: pickValidOption(storySizes, searchParams.get("size")),
    page: Number.isFinite(rawPage) && rawPage > 0 ? rawPage : defaultStoriesQuery.page,
    pageSize: Number.isFinite(rawPageSize) && rawPageSize > 0 ? rawPageSize : defaultStoriesQuery.pageSize,
  };
}

export function serializeStoriesQuery(query: StoriesQuery) {
  const params = new URLSearchParams();

  query.tags.forEach((tag) => params.append("tag", tag));
  if (query.fandom) params.set("fandom", query.fandom);
  if (query.rating) params.set("rating", query.rating);
  if (query.status) params.set("status", query.status);
  if (query.size) params.set("size", query.size);

  if (query.page !== defaultStoriesQuery.page) {
    params.set("page", String(query.page));
  }

  if (query.pageSize !== defaultStoriesQuery.pageSize) {
    params.set("pageSize", String(query.pageSize));
  }

  return params;
}
