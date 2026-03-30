import { describe, expect, it } from "vitest";

import { resolveApiInput } from "@/shared/api/fetch-json";

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
      "https://api.plotty-stories.duckdns.org/stories",
    );
    expect(resolveApiInput("/api/tags", "https://api.plotty-stories.duckdns.org")).toBe(
      "https://api.plotty-stories.duckdns.org/tags",
    );
  });
});
