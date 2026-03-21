import type {
  CatalogQuery,
  CatalogRating,
  CatalogSize,
  CatalogSort,
  CatalogStatus,
  CatalogView,
} from "./types";

const statusValues = new Set<CatalogStatus>(["in-progress", "completed", "frozen"]);
const ratingValues = new Set<CatalogRating>(["G", "PG-13", "R", "NC-17"]);
const sizeValues = new Set<CatalogSize>(["mini", "midi", "maxi"]);
const sortValues = new Set<CatalogSort>(["new", "updates", "popular", "discussed", "bookmarks"]);
const viewValues = new Set<CatalogView>(["feed", "tiles"]);

export const defaultCatalogQuery: CatalogQuery = {
  q: "",
  fandom: "",
  status: "",
  rating: "",
  size: "",
  sort: "updates",
  view: "feed",
  page: 1,
};

export function parseCatalogQuery(searchParams: URLSearchParams): CatalogQuery {
  const rawPage = Number(searchParams.get("page") ?? defaultCatalogQuery.page);

  return {
    q: searchParams.get("q") ?? "",
    fandom: searchParams.get("fandom") ?? "",
    status: validateSetValue(statusValues, searchParams.get("status")) ?? "",
    rating: validateSetValue(ratingValues, searchParams.get("rating")) ?? "",
    size: validateSetValue(sizeValues, searchParams.get("size")) ?? "",
    sort: validateSetValue(sortValues, searchParams.get("sort")) ?? defaultCatalogQuery.sort,
    view: validateSetValue(viewValues, searchParams.get("view")) ?? defaultCatalogQuery.view,
    page: Number.isFinite(rawPage) && rawPage > 0 ? rawPage : defaultCatalogQuery.page,
  };
}

export function serializeCatalogQuery(query: CatalogQuery) {
  const params = new URLSearchParams();

  if (query.q) params.set("q", query.q);
  if (query.fandom) params.set("fandom", query.fandom);
  if (query.status) params.set("status", query.status);
  if (query.rating) params.set("rating", query.rating);
  if (query.size) params.set("size", query.size);
  if (query.sort !== defaultCatalogQuery.sort) params.set("sort", query.sort);
  if (query.view !== defaultCatalogQuery.view) params.set("view", query.view);
  if (query.page !== defaultCatalogQuery.page) params.set("page", String(query.page));

  return params;
}

function validateSetValue<T extends string>(set: Set<T>, rawValue: string | null): T | null {
  if (!rawValue) {
    return null;
  }

  return set.has(rawValue as T) ? (rawValue as T) : null;
}

