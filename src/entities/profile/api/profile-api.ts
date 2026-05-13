import { queryOptions } from "@tanstack/react-query";

import { fetchJson } from "@/shared/api/fetch-json";

import { mapStoryListItem, type BackendStoriesResponse, type BackendStoryListItem } from "@/entities/story/api/story-mappers";
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

export const profileKeys = {
  all: ["profiles"] as const,
  public: (username: string) => ["profiles", "public", normalizeUsername(username)] as const,
  stories: (username: string) => ["profiles", "stories", normalizeUsername(username)] as const,
  collections: (username: string) => ["profiles", "collections", normalizeUsername(username)] as const,
  collection: (username: string, collectionId: string) =>
    ["profiles", "collections", normalizeUsername(username), collectionId] as const,
};

export function publicProfileQueryOptions(username: string) {
  return queryOptions({
    queryKey: profileKeys.public(username),
    queryFn: async (): Promise<PublicUserProfile> => {
      const response = await fetchJson<PublicProfileResponse>(`/users/${encodeURIComponent(normalizeUsername(username))}`);

      return response.profile;
    },
    enabled: Boolean(normalizeUsername(username)),
  });
}

export function publicUserStoriesQueryOptions(username: string) {
  return queryOptions({
    queryKey: profileKeys.stories(username),
    queryFn: async () => {
      const params = new URLSearchParams({ page: "1", pageSize: "100" });
      const response = await fetchJson<BackendStoriesResponse>(
        `/users/${encodeURIComponent(normalizeUsername(username))}/stories?${params.toString()}`,
      );

      return {
        ...response,
        items: response.items.map(mapStoryListItem),
      };
    },
    enabled: Boolean(normalizeUsername(username)),
  });
}

export function publicUserCollectionsQueryOptions(username: string) {
  return queryOptions({
    queryKey: profileKeys.collections(username),
    queryFn: async (): Promise<UserCollectionsResponse> =>
      fetchJson<UserCollectionsResponse>(`/users/${encodeURIComponent(normalizeUsername(username))}/collections`),
    enabled: Boolean(normalizeUsername(username)),
  });
}

export function publicUserCollectionQueryOptions(username: string, collectionId: string) {
  return queryOptions({
    queryKey: profileKeys.collection(username, collectionId),
    queryFn: async (): Promise<UserCollectionDetail> => {
      const response = await fetchJson<BackendCollectionResponse>(
        `/users/${encodeURIComponent(normalizeUsername(username))}/collections/${collectionId}`,
      );

      return {
        ...response.collection,
        stories: response.collection.stories.map(mapStoryListItem),
      };
    },
    enabled: Boolean(normalizeUsername(username) && collectionId),
  });
}
