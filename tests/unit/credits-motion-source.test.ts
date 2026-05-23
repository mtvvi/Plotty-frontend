import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("credits motion source", () => {
  it("uses the shared GSAP counter for the balance summary", () => {
    const source = readFileSync(path.resolve("src/widgets/credits/credits-screen.tsx"), "utf8");

    expect(source).toContain("useGsapCounter");
    expect(source).toContain("data-gsap-counter=\"credits-balance\"");
  });
});
