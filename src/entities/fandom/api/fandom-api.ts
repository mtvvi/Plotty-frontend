import { queryOptions } from "@tanstack/react-query";

import { fetchJson } from "@/shared/api/fetch-json";

import type {
  SuggestedFandom,
  SuggestedFandomsResponse,
  SuggestFandomPayload,
} from "../model/types";

export const fandomKeys = {
  all: ["fandoms"] as const,
  pending: () => ["fandoms", "pending"] as const,
};

export function suggestFandom(payload: SuggestFandomPayload) {
  return fetchJson<SuggestedFandom>("/fandoms/suggest", {
    method: "POST",
    body: JSON.stringify({
      name: payload.name.trim(),
      description: payload.description.trim(),
    }),
  });
}

export function pendingFandomsQueryOptions(options?: { enabled?: boolean }) {
  return queryOptions({
    queryKey: fandomKeys.pending(),
    queryFn: () => fetchJson<SuggestedFandomsResponse>("/admin/fandoms/pending"),
    enabled: options?.enabled ?? true,
  });
}

export function approveFandom(fandomId: string) {
  return fetchJson<{ status: "approved" }>(`/admin/fandoms/${fandomId}/approve`, {
    method: "POST",
  });
}

export function rejectFandom(fandomId: string) {
  return fetchJson<{ status: "rejected" }>(`/admin/fandoms/${fandomId}/reject`, {
    method: "POST",
  });
}
