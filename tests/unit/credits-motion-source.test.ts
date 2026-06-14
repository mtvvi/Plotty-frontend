import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("credits motion source", () => {
  it("uses a lightweight rAF counter without importing GSAP", () => {
    const source = readFileSync(path.resolve("src/widgets/credits/credits-screen.tsx"), "utf8");

    expect(source).toContain("useRafCounter");
    expect(source).toContain("data-raf-counter=\"credits-balance\"");
    expect(source).not.toContain("useGsapCounter");
    expect(source).not.toContain("@/shared/lib/gsap-motion");
  });
});
