import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { profileAvatarPlaceholderSrc } from "@/widgets/profile/profile-avatar-placeholder";
import { storyCoverPlaceholderSrc } from "@/widgets/stories/story-cover-preview";

function publicAssetBytes(src: string) {
  return statSync(path.resolve("public", src.replace(/^\//, ""))).size;
}

describe("placeholder image assets", () => {
  it("keeps default cover and avatar placeholders under the first-load image budget", () => {
    expect(storyCoverPlaceholderSrc).toMatch(/\.jpg$/);
    expect(publicAssetBytes(storyCoverPlaceholderSrc)).toBeLessThanOrEqual(25_000);
    expect(publicAssetBytes(profileAvatarPlaceholderSrc)).toBeLessThan(40_000);
  });

  it("does not keep the heavyweight PNG cover placeholder in public assets", () => {
    expect(existsSync(path.resolve("public/story-cover-placeholder.png"))).toBe(false);
  });
});
