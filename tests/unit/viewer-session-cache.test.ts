import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

import { resetViewerSessionCache } from "@/widgets/auth/viewer-session-cache";

describe("resetViewerSessionCache", () => {
  it("clears viewer-local private caches on logout", async () => {
    window.localStorage.setItem("plotty:chapter-spellcheck:chapter-1", "cached draft text");
    window.localStorage.setItem("plotty.generated-images", JSON.stringify({ "chapter-1": "https://s3.plotty-stories.duckdns.org/a.jpg" }));
    window.localStorage.setItem("plotty.generated-story-covers", JSON.stringify({ story: "https://s3.plotty-stories.duckdns.org/b.jpg" }));
    window.localStorage.setItem("plotty-theme", "dark");

    await resetViewerSessionCache(new QueryClient());

    expect(window.localStorage.getItem("plotty:chapter-spellcheck:chapter-1")).toBeNull();
    expect(window.localStorage.getItem("plotty.generated-images")).toBeNull();
    expect(window.localStorage.getItem("plotty.generated-story-covers")).toBeNull();
    expect(window.localStorage.getItem("plotty-theme")).toBe("dark");
  });
});
