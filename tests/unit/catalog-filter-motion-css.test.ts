import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("catalog filter motion CSS", () => {
  function getCatalogFilterCss() {
    const css = readFileSync(path.resolve("src/app/globals.css"), "utf8");
    const start = css.indexOf(".plotty-catalog-layout");
    const end = css.indexOf(".plotty-info-row");

    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);

    return css.slice(start, end);
  }

  it("does not animate layout-affecting catalog grid columns", () => {
    const css = readFileSync(path.resolve("src/app/globals.css"), "utf8");
    const mediaRule = css.match(/@media \(min-width: 1024px\) \{(?<body>[\s\S]*?)\n\}/)?.groups?.body;

    expect(mediaRule).toBeDefined();
    expect(mediaRule).not.toMatch(/transition:[^;]*(grid-template-columns|column-gap)/);
    expect(mediaRule).not.toContain("filter: blur");
    expect(mediaRule).not.toContain("translateX");
  });

  it("uses compositor-friendly fade and scale states for catalog filters", () => {
    const css = getCatalogFilterCss();

    expect(css).toContain('data-filters-state="collapsing"');
    expect(css).toContain('data-filters-state="collapsed"');
    expect(css).toContain("transform: translateZ(0) scale(1)");
    expect(css).toContain("transform: translateZ(0) scale(0.985)");
    expect(css).not.toContain("filter: blur");
    expect(css).not.toContain("translateX");
  });
});
