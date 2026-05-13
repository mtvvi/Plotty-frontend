import { queryOptions } from "@tanstack/react-query";

import { ApiError, fetchJson, resolveApiInput } from "@/shared/api/fetch-json";

import type { AuthSessionResponse, LoginPayload, RegisterPayload, UpdateProfilePayload } from "../model/types";

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

export function updateProfile(payload: UpdateProfilePayload) {
  const body: {
    username: string;
    bio?: string | null;
    avatarUrl?: string | null;
  } = {
    username: payload.username.trim(),
  };

  if (payload.bio !== undefined) {
    body.bio = payload.bio;
  }

  if (payload.avatarUrl !== undefined) {
    body.avatarUrl = payload.avatarUrl;
  }

  return fetchJson<AuthSessionResponse>("/profile", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function uploadAvatar(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(resolveApiInput("/profile/avatar"), {
    method: "POST",
    body: formData,
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;

    try {
      const payload = (await response.json()) as { error?: string };
      message = payload.error || message;
    } catch {
      // Keep the generic HTTP error if the backend returns a non-JSON body.
    }

    throw new ApiError(message, response.status);
  }

  return (await response.json()) as AuthSessionResponse;
}
