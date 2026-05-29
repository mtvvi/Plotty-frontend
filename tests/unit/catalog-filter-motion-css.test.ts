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

  it("uses CSS-only layout state without GSAP layout markers", () => {
    const css = getCatalogFilterCss();

    expect(css).toContain("--plotty-catalog-filter-rail-width");
    expect(css).toContain("grid-template-columns");
    expect(css).toContain('data-filters-collapsed="true"');
    expect(css).toContain("grid-template-columns var(--motion-base)");
    expect(css).toContain("width var(--motion-base)");
    expect(css).not.toContain("flex-basis var(--motion-slow)");
    expect(css).not.toContain("data-gsap-layout");
    expect(css).not.toContain("filter: blur");
    expect(css).not.toContain("translateX");
  });

  it("uses compositor-friendly fade and scale states for catalog filters", () => {
    const css = getCatalogFilterCss();

    expect(css).toContain('data-filters-state="collapsing"');
    expect(css).toContain('data-filters-state="collapsed"');
    expect(css).toContain("transform: translateZ(0) scale(1)");
    expect(css).toContain("transform: translateZ(0) scale(0.985)");
    expect(css).not.toContain("will-change");
    expect(css).not.toContain("filter: blur");
    expect(css).not.toContain("translateX");
  });

  it("keeps the filter rail visible while collapsing so closing does not teleport", () => {
    const css = getCatalogFilterCss();
    const collapsingRailRule = css.match(
      /\.plotty-catalog-layout\[data-filters-state="collapsing"\] \.plotty-catalog-filter-rail\s*{(?<body>[\s\S]*?)\n\s*}/,
    )?.groups?.body;

    expect(css).toContain('.plotty-catalog-layout[data-filters-state="collapsed"] .plotty-catalog-filter-rail');
    expect(collapsingRailRule).toBeDefined();
    expect(css).toContain("width: var(--plotty-catalog-filter-rail-width)");
    expect(collapsingRailRule).not.toContain("opacity: 0");
  });

  it("adds a catalog-specific story tile enter animation", () => {
    const css = getCatalogFilterCss();

    expect(css).toContain(".plotty-catalog-story-list .plotty-motion-list-item");
    expect(css).toContain("plotty-catalog-story-tile-enter");
    expect(css).toContain("transform: translateY(8px) scale(0.992)");
  });
});
