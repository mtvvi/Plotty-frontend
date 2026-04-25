import { queryOptions } from "@tanstack/react-query";

import { fetchJson } from "@/shared/api/fetch-json";

import type {
  UserCollectionBase,
  UserCollectionDetail,
  UserCollectionResponse,
  UserCollectionsResponse,
} from "@/entities/profile/model/types";

import type { CreateCollectionPayload, ReaderShelf, ReaderShelfResponse, UpdateCollectionPayload } from "../model/types";

export const readerShelfLabels: Record<ReaderShelf, string> = {
  reading: "Читаю",
  planned: "В планах",
  dropped: "Брошено",
  read: "Прочитано",
  favorite: "Любимые",
};

export const readerShelfOptions: Array<{ value: ReaderShelf; label: string }> = [
  { value: "reading", label: readerShelfLabels.reading },
  { value: "planned", label: readerShelfLabels.planned },
  { value: "dropped", label: readerShelfLabels.dropped },
  { value: "read", label: readerShelfLabels.read },
  { value: "favorite", label: readerShelfLabels.favorite },
];

export const libraryKeys = {
  all: ["library"] as const,
  shelf: (shelf?: ReaderShelf | null) => ["library", "shelf", shelf ?? "all"] as const,
  collections: () => ["library", "collections"] as const,
  collection: (collectionId: string) => ["library", "collections", collectionId] as const,
  collectionDetails: () => ["library", "collections", "details"] as const,
};

export function myShelfQueryOptions(shelf?: ReaderShelf | null, options?: { enabled?: boolean }) {
  return queryOptions({
    queryKey: libraryKeys.shelf(shelf),
    queryFn: () => {
      const params = new URLSearchParams();

      if (shelf) {
        params.set("shelf", shelf);
      }

      const query = params.toString();

      return fetchJson<ReaderShelfResponse>(`/me/library/shelf${query ? `?${query}` : ""}`);
    },
    enabled: options?.enabled ?? true,
  });
}

export function setStoryShelf(storyId: string, shelf: ReaderShelf) {
  return fetchJson<null>(`/me/library/shelf/${storyId}`, {
    method: "PUT",
    body: JSON.stringify({ shelf }),
  });
}

export function removeStoryShelf(storyId: string) {
  return fetchJson<null>(`/me/library/shelf/${storyId}`, {
    method: "DELETE",
  });
}

export function myCollectionsQueryOptions(options?: { enabled?: boolean }) {
  return queryOptions({
    queryKey: libraryKeys.collections(),
    queryFn: () => fetchJson<UserCollectionsResponse>("/me/collections"),
    enabled: options?.enabled ?? true,
  });
}

export function myCollectionQueryOptions(collectionId: string, options?: { enabled?: boolean }) {
  return queryOptions({
    queryKey: libraryKeys.collection(collectionId),
    queryFn: async (): Promise<UserCollectionDetail> => {
      const response = await fetchJson<UserCollectionResponse>(`/me/collections/${collectionId}`);

      return response.collection;
    },
    enabled: Boolean(collectionId) && (options?.enabled ?? true),
  });
}

export function myCollectionDetailsQueryOptions(options?: { enabled?: boolean }) {
  return queryOptions({
    queryKey: libraryKeys.collectionDetails(),
    queryFn: async (): Promise<UserCollectionDetail[]> => {
      const response = await fetchJson<UserCollectionsResponse>("/me/collections");

      return Promise.all(
        response.items.map(async (collection) => {
          const detail = await fetchJson<UserCollectionResponse>(`/me/collections/${collection.id}`);

          return detail.collection;
        }),
      );
    },
    enabled: options?.enabled ?? true,
  });
}

export function createCollection(payload: CreateCollectionPayload) {
  return fetchJson<{ collection: UserCollectionBase }>("/me/collections", {
    method: "POST",
    body: JSON.stringify({
      title: payload.title,
      description: normalizeDescription(payload.description),
    }),
  }).then((response) => response.collection);
}

export function updateCollection(collectionId: string, payload: UpdateCollectionPayload) {
  const body: UpdateCollectionPayload = {};

  if (payload.title !== undefined) {
    body.title = payload.title;
  }

  if (payload.description !== undefined) {
    body.description = normalizeDescription(payload.description);
  }

  return fetchJson<{ collection: UserCollectionBase }>(`/me/collections/${collectionId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  }).then((response) => response.collection);
}

export function deleteCollection(collectionId: string) {
  return fetchJson<null>(`/me/collections/${collectionId}`, {
    method: "DELETE",
  });
}

export function addStoryToCollection(collectionId: string, storyId: string) {
  return fetchJson<null>(`/me/collections/${collectionId}/stories`, {
    method: "POST",
    body: JSON.stringify({ storyId }),
  });
}

export function removeStoryFromCollection(collectionId: string, storyId: string) {
  return fetchJson<null>(`/me/collections/${collectionId}/stories/${storyId}`, {
    method: "DELETE",
  });
}

function normalizeDescription(value?: string | null) {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value?.trim() ?? "";

  return trimmed ? trimmed : null;
}
