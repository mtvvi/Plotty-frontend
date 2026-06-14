import { describe, expect, it } from "vitest";

import {
  encodePathSegment,
  sanitizeImageUrl,
  sanitizeInternalNextUrl,
  sanitizePersistedImageUrl,
} from "@/shared/lib/safe-url";

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

describe("sanitizePersistedImageUrl", () => {
  it("allows only relative paths and trusted Plotty image origins", () => {
    expect(sanitizePersistedImageUrl("/uploads/avatar.jpg")).toBe("/uploads/avatar.jpg");
    expect(sanitizePersistedImageUrl("https://s3.plotty-stories.duckdns.org/covers/story.webp")).toBe(
      "https://s3.plotty-stories.duckdns.org/covers/story.webp",
    );
  });

  it("rejects executable, local-preview, insecure, and untrusted image URLs", () => {
    expect(sanitizePersistedImageUrl("javascript:alert(1)")).toBeUndefined();
    expect(sanitizePersistedImageUrl("data:image/svg+xml,%3Csvg%2Fonload=alert(1)%3E")).toBeUndefined();
    expect(sanitizePersistedImageUrl("blob:http://localhost/image")).toBeUndefined();
    expect(sanitizePersistedImageUrl("http://s3.plotty-stories.duckdns.org/covers/story.webp")).toBeUndefined();
    expect(sanitizePersistedImageUrl("https://evil.test/covers/story.webp")).toBeUndefined();
  });
});

describe("encodePathSegment", () => {
  it("keeps dynamic route and API ids inside a single path segment", () => {
    expect(encodePathSegment("../auth?next=/credits#x")).toBe("..%2Fauth%3Fnext%3D%2Fcredits%23x");
    expect(encodePathSegment("a/b")).toBe("a%2Fb");
  });
});
