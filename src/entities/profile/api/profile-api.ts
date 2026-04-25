import { queryOptions } from "@tanstack/react-query";

import { fetchJson } from "@/shared/api/fetch-json";

import type { StoryListItem, StoryTag } from "@/entities/story/model/types";
import type {
  PublicProfileResponse,
  PublicUserProfile,
  UserCollectionDetail,
  UserCollectionsResponse,
} from "../model/types";

interface BackendStoryListItem {
  id: string;
  slug: string;
  title: string;
  tags?: StoryTag[];
  chaptersCount: number;
  status?: StoryListItem["status"];
  likesCount?: number;
  likedByMe?: boolean;
  aiHint?: string;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: number;
    username: string;
    avatarUrl?: string | null;
  };
}

interface BackendStoriesResponse {
  items: BackendStoryListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

interface BackendCollectionResponse {
  collection: Omit<UserCollectionDetail, "stories"> & {
    stories: BackendStoryListItem[];
  };
}

function getTagName(tags: StoryTag[], category: string) {
  return tags.find((tag) => tag.category === category)?.name;
}

function mapStoryListItem(item: BackendStoryListItem): StoryListItem {
  const tags = item.tags ?? [];

  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    tags,
    chaptersCount: item.chaptersCount,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    status: item.status,
    fandom: getTagName(tags, "directionality"),
    ratingLabel: getTagName(tags, "rating"),
    statusLabel: getTagName(tags, "completion"),
    sizeLabel: getTagName(tags, "size"),
    likesCount: item.likesCount,
    viewerHasLiked: item.likedByMe,
    aiHint: item.aiHint,
    author: item.author,
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
