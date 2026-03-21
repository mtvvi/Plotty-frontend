import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { fetchJson } from "@/shared/api/fetch-json";

import { serializeCatalogQuery } from "../model/catalog-query";
import type {
  AuthorDraftTeaser,
  CatalogMetaResponse,
  CatalogQuery,
  CatalogResponse,
  TrendingFandom,
} from "../model/types";

export function catalogQueryOptions(query: CatalogQuery) {
  const params = serializeCatalogQuery(query);

  return queryOptions({
    queryKey: ["catalog", query],
    queryFn: () => fetchJson<CatalogResponse>(`/catalog?${params.toString()}`),
    placeholderData: keepPreviousData,
  });
}

export function catalogMetaQueryOptions() {
  return queryOptions({
    queryKey: ["catalog-meta"],
    queryFn: () => fetchJson<CatalogMetaResponse>("/catalog/meta"),
  });
}

export function trendingFandomsQueryOptions() {
  return queryOptions({
    queryKey: ["trending-fandoms"],
    queryFn: () => fetchJson<TrendingFandom[]>("/fandoms/trending"),
  });
}

export function authorDraftTeaserQueryOptions() {
  return queryOptions({
    queryKey: ["author-draft-teaser"],
    queryFn: () => fetchJson<AuthorDraftTeaser>("/me/drafts/teaser"),
  });
}

