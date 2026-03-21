import { http, HttpResponse } from "msw";

import { defaultCatalogQuery, parseCatalogQuery } from "@/entities/catalog/model/catalog-query";
import type { CatalogSort, CatalogStoryCard } from "@/entities/catalog/model/types";

import { authorDraftTeaser, catalogMeta, catalogStories, trendingFandoms } from "./data/catalog";

const pageSize = 6;

export const handlers = [
  http.get("*/catalog", ({ request }) => {
    const url = new URL(request.url);
    const query = parseCatalogQuery(url.searchParams);
    const filteredItems = sortStories(filterStories(catalogStories, query), query.sort);
    const page = query.page ?? defaultCatalogQuery.page;
    const start = (page - 1) * pageSize;
    const items = filteredItems.slice(start, start + pageSize);

    return HttpResponse.json({
      items,
      total: filteredItems.length,
      page,
      pageSize,
    });
  }),
  http.get("*/catalog/meta", () => HttpResponse.json(catalogMeta)),
  http.get("*/fandoms/trending", () => HttpResponse.json(trendingFandoms)),
  http.get("*/me/drafts/teaser", () => HttpResponse.json(authorDraftTeaser)),
];

function filterStories(items: CatalogStoryCard[], query: ReturnType<typeof parseCatalogQuery>) {
  return items.filter((story) => {
    const matchesSearch = query.q
      ? [story.title, story.fandom, story.pairing, story.tags.join(" "), story.excerpt]
          .join(" ")
          .toLowerCase()
          .includes(query.q.toLowerCase())
      : true;
    const matchesFandom = query.fandom ? story.fandom === query.fandom : true;
    const matchesStatus = query.status ? story.status === query.status : true;
    const matchesRating = query.rating ? story.rating === query.rating : true;
    const matchesSize = query.size ? story.size === query.size : true;

    return matchesSearch && matchesFandom && matchesStatus && matchesRating && matchesSize;
  });
}

function sortStories(items: CatalogStoryCard[], sort: CatalogSort) {
  const copied = [...items];

  switch (sort) {
    case "new":
      return copied.reverse();
    case "popular":
      return copied.sort((a, b) => b.likes - a.likes);
    case "discussed":
      return copied.sort((a, b) => b.comments - a.comments);
    case "bookmarks":
      return copied.sort((a, b) => b.bookmarks - a.bookmarks);
    case "updates":
    default:
      return copied.sort((a, b) => b.chapters - a.chapters);
  }
}
