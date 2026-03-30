import { queryOptions } from "@tanstack/react-query";

import { ApiError, fetchJson } from "@/shared/api/fetch-json";

import type { AuthSessionResponse, LoginPayload, RegisterPayload } from "../model/types";

export const authKeys = {
  session: () => ["auth", "session"] as const,
};

export function sessionQueryOptions() {
  return queryOptions({
    queryKey: authKeys.session(),
    queryFn: async () => {
      try {
        return await fetchJson<AuthSessionResponse>("/session");
      } catch (error) {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          return null;
        }

        throw error;
      }
    },
    retry: false,
    staleTime: 60_000,
  });
}

export function login(payload: LoginPayload) {
  return fetchJson<AuthSessionResponse>("/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function register(payload: RegisterPayload) {
  return fetchJson<AuthSessionResponse>("/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function logout() {
  return fetchJson<{ status: string }>("/logout", {
    method: "POST",
  });
}
