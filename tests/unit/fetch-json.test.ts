import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, fetchJson, resolveApiInput } from "@/shared/api/fetch-json";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("fetchJson URL resolution", () => {
  it("uses the Next API proxy for relative paths by default", () => {
    expect(resolveApiInput("/stories")).toBe("/api/stories");
    expect(resolveApiInput("tags")).toBe("/api/tags");
  });

  it("keeps absolute URLs unchanged", () => {
    expect(resolveApiInput("https://api.plotty-stories.duckdns.org/stories")).toBe(
      "https://api.plotty-stories.duckdns.org/stories",
    );
  });

  it("supports the deprecated direct API fallback", () => {
    expect(resolveApiInput("/stories", "https://api.plotty-stories.duckdns.org/")).toBe(
      "https://api.plotty-stories.duckdns.org/api/stories",
    );
    expect(resolveApiInput("/api/tags", "https://api.plotty-stories.duckdns.org")).toBe(
      "https://api.plotty-stories.duckdns.org/api/tags",
    );
  });

  it("sends cookies with API requests", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    await fetchJson<{ ok: boolean }>("/session");

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/session",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("throws typed ApiError objects for failed requests", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "invalid session" }), { status: 401 }),
    );

    await expect(fetchJson("/session")).rejects.toEqual(
      expect.objectContaining<ApiError>({
        name: "ApiError",
        status: 401,
        message: "invalid session",
      }),
    );
  });
});
