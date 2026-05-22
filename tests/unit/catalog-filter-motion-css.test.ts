import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("catalog filter motion CSS", () => {
  it("does not animate layout-affecting catalog grid columns", () => {
    const css = readFileSync(path.resolve("src/app/globals.css"), "utf8");
    const mediaRule = css.match(/@media \(min-width: 1024px\) \{(?<body>[\s\S]*?)\n\}/)?.groups?.body;

    expect(mediaRule).toBeDefined();
    expect(mediaRule).not.toContain("grid-template-columns 620ms");
    expect(mediaRule).not.toContain("column-gap 520ms");
    expect(mediaRule).not.toContain("filter: blur");
    expect(mediaRule).not.toContain("translateX");
    expect(mediaRule).not.toContain('data-filters-state="collapsing"');
  });
});
