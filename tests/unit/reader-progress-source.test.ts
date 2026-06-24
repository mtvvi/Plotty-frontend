import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("reader progress source", () => {
  it("uses requestAnimationFrame instead of GSAP or React state for scroll progress", () => {
    const source = readFileSync(path.resolve("src/widgets/stories/chapter-reader-screen.tsx"), "utf8");

    expect(source).toContain("requestAnimationFrame");
    expect(source).toContain("data-reader-progress");
    expect(source).not.toContain("quickTo");
    expect(source).not.toContain("@/shared/lib/gsap-motion");
    expect(source).not.toContain("setReadingProgress");
  });
});
