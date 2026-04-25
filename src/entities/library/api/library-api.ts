import { queryOptions } from "@tanstack/react-query";

import { fetchJson } from "@/shared/api/fetch-json";

import type { ReaderShelf, ReaderShelfResponse } from "../model/types";

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
