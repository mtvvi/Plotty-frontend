import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, fetchJson, resolveApiInput } from "@/shared/api/fetch-json";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
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

  it("does not send JSON content type for bodyless GET requests", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    await fetchJson<{ ok: boolean }>("/session");

    const init = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(new Headers(init.headers).has("Content-Type")).toBe(false);
  });

  it("sends JSON content type when a request body is present", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    await fetchJson<{ ok: boolean }>("/login", {
      method: "POST",
      body: JSON.stringify({ email: "writer@plotty.test", password: "password123" }),
    });

    const init = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(new Headers(init.headers).get("Content-Type")).toBe("application/json");
  });

  it("ignores NEXT_PUBLIC_API_URL by default in production", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.test");
    vi.stubEnv("NODE_ENV", "production");

    expect(resolveApiInput("/stories")).toBe("/api/stories");
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

  it("uses common backend message fields for failed requests", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: "invalid payload" }), { status: 400 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ detail: "email already exists" }), { status: 422 }));

    await expect(fetchJson("/register")).rejects.toMatchObject({
      message: "invalid payload",
      status: 400,
    });
    await expect(fetchJson("/register")).rejects.toMatchObject({
      message: "email already exists",
      status: 422,
    });
  });
});
