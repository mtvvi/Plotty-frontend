import { afterEach, describe, expect, it, vi } from "vitest";

import { setStoryShelf } from "@/entities/library/api/library-api";
import { likeStory } from "@/entities/story/api/stories-api";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("API path construction", () => {
  it("encodes dynamic ids before sending credentialed API requests", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ likesCount: 1, likedByMe: true }), { status: 200 }),
    );

    await likeStory("../profile?x=1");

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/stories/..%2Fprofile%3Fx%3D1/like",
      expect.objectContaining({ credentials: "include" }),
    );

    fetchSpy.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await setStoryShelf("story/1#frag", "read");

    expect(fetchSpy).toHaveBeenLastCalledWith(
      "/api/me/library/shelf/story%2F1%23frag",
      expect.objectContaining({ credentials: "include" }),
    );
  });
});
