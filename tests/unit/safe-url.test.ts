import { describe, expect, it } from "vitest";

import { sanitizeImageUrl, sanitizeInternalNextUrl } from "@/shared/lib/safe-url";

describe("sanitizeInternalNextUrl", () => {
  it("allows same-origin relative paths", () => {
    expect(sanitizeInternalNextUrl("/library?x=1#section", "/write")).toBe("/library?x=1#section");
  });

  it("rejects external and executable URLs", () => {
    expect(sanitizeInternalNextUrl("https://evil.test", "/write")).toBe("/write");
    expect(sanitizeInternalNextUrl("//evil.test", "/write")).toBe("/write");
    expect(sanitizeInternalNextUrl("javascript:alert(1)", "/write")).toBe("/write");
  });
});

describe("sanitizeImageUrl", () => {
  it("keeps relative and http image URLs", () => {
    expect(sanitizeImageUrl("/covers/story.jpg")).toBe("/covers/story.jpg");
    expect(sanitizeImageUrl("https://cdn.example.test/story.jpg")).toBe("https://cdn.example.test/story.jpg");
  });

  it("drops unsupported image URL schemes", () => {
    expect(sanitizeImageUrl("javascript:alert(1)")).toBeUndefined();
  });
});
