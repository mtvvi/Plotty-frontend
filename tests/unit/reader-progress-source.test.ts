import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("reader progress source", () => {
  it("uses a GSAP quick setter instead of React state for scroll progress", () => {
    const source = readFileSync(path.resolve("src/widgets/stories/chapter-reader-screen.tsx"), "utf8");

    expect(source).toContain("quickTo");
    expect(source).toContain("data-gsap-reader-progress");
    expect(source).not.toContain("setReadingProgress");
  });
});
