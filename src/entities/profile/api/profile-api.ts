import { queryOptions } from "@tanstack/react-query";

import { fetchJson } from "@/shared/api/fetch-json";
import { encodePathSegment } from "@/shared/lib/safe-url";

import { mapStoryListItem, type BackendStoriesResponse, type BackendStoryListItem } from "@/entities/story/api/story-mappers";
import type { StoriesQuery, StoriesResponse } from "@/entities/story/model/types";
import type {
  PublicProfileResponse,
  PublicUserProfile,
  UserCollectionDetail,
  UserCollectionsResponse,
} from "../model/types";

interface BackendCollectionResponse {
  collection: Omit<UserCollectionDetail, "stories"> & {
    stories: BackendStoryListItem[];
  };
}

function normalizeUsername(username: string) {
  return username.trim();
}

const defaultPublicUserStoriesQuery: StoriesQuery = {
  tags: [],
  q: "",
  page: 1,
  pageSize: 100,
};

export const profileKeys = {
  all: ["profiles"] as const,
  public: (username: string) => ["profiles", "public", normalizeUsername(username)] as const,
  stories: (username: string, query: StoriesQuery = defaultPublicUserStoriesQuery) =>
    ["profiles", "stories", normalizeUsername(username), query] as const,
  collections: (username: string) => ["profiles", "collections", normalizeUsername(username)] as const,
  collection: (username: string, collectionId: string) =>
    ["profiles", "collections", normalizeUsername(username), collectionId] as const,
};

export function publicProfileQueryOptions(username: string) {
  return queryOptions({
    queryKey: profileKeys.public(username),
    queryFn: async (): Promise<PublicUserProfile> => {
      const response = await fetchJson<PublicProfileResponse>(`/users/${encodePathSegment(normalizeUsername(username))}`);

      return response.profile;
    },
    enabled: Boolean(normalizeUsername(username)),
  });
}

function serializeUserStoriesQuery(query: StoriesQuery) {
  const params = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
  });

  if (query.q) {
    params.set("q", query.q);
  }

  if (query.sort) {
    params.set("sort", query.sort);
  }

  query.tags.forEach((tag) => params.append("tag", tag));

  return params;
}

export async function fetchPublicUserStories(
  username: string,
  query: StoriesQuery = defaultPublicUserStoriesQuery,
  signal?: AbortSignal,
): Promise<StoriesResponse> {
  const params = serializeUserStoriesQuery(query);
  const response = await fetchJson<BackendStoriesResponse>(
    `/users/${encodePathSegment(normalizeUsername(username))}/stories?${params.toString()}`,
    { signal },
  );

  return {
    ...response,
    items: response.items.map(mapStoryListItem),
  };
}

export function publicUserStoriesQueryOptions(
  username: string,
  query: StoriesQuery = defaultPublicUserStoriesQuery,
  options?: { enabled?: boolean },
) {
  return queryOptions({
    queryKey: profileKeys.stories(username, query),
    queryFn: ({ signal }): Promise<StoriesResponse> => fetchPublicUserStories(username, query, signal),
    enabled: Boolean(normalizeUsername(username)) && (options?.enabled ?? true),
  });
}

export function publicUserCollectionsQueryOptions(username: string) {
  return queryOptions({
    queryKey: profileKeys.collections(username),
    queryFn: async (): Promise<UserCollectionsResponse> =>
      fetchJson<UserCollectionsResponse>(`/users/${encodePathSegment(normalizeUsername(username))}/collections`),
    enabled: Boolean(normalizeUsername(username)),
  });
}

export function publicUserCollectionQueryOptions(username: string, collectionId: string) {
  return queryOptions({
    queryKey: profileKeys.collection(username, collectionId),
    queryFn: async (): Promise<UserCollectionDetail> => {
      const response = await fetchJson<BackendCollectionResponse>(
        `/users/${encodePathSegment(normalizeUsername(username))}/collections/${encodePathSegment(collectionId)}`,
      );

      return {
        ...response.collection,
        stories: response.collection.stories.map(mapStoryListItem),
      };
    },
    enabled: Boolean(normalizeUsername(username) && collectionId),
  });
}
