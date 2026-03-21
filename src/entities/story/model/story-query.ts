import type { StoriesQuery } from "./types";

export const defaultStoriesQuery: StoriesQuery = {
  tags: [],
  q: "",
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
    tags: rawTags.filter((tag, index) => tag.trim() && rawTags.indexOf(tag) === index),
    q: searchParams.get("q")?.trim() ?? "",
    fandom: searchParams.get("fandom")?.trim() ?? "",
    rating: searchParams.get("rating")?.trim() ?? "",
    status: searchParams.get("status")?.trim() ?? "",
    size: searchParams.get("size")?.trim() ?? "",
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

  if (query.fandom) {
    params.set("fandom", query.fandom);
  }

  if (query.rating) {
    params.set("rating", query.rating);
  }

  if (query.status) {
    params.set("status", query.status);
  }

  if (query.size) {
    params.set("size", query.size);
  }

  if (query.page !== defaultStoriesQuery.page) {
    params.set("page", String(query.page));
  }

  if (query.pageSize !== defaultStoriesQuery.pageSize) {
    params.set("pageSize", String(query.pageSize));
  }

  return params;
}
