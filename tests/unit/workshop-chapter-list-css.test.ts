import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("workshop chapter list mobile scrolling", () => {
  it("defines scroll constraints before the desktop-only media query", () => {
    const css = readFileSync(path.resolve("src/app/globals.css"), "utf8");
    const desktopWorkshopMediaIndex = css.indexOf("@media (min-width: 1024px) {\n  .plotty-workshop-story-list");
    const mobileCss = css.slice(0, desktopWorkshopMediaIndex);
    const mobileRule = mobileCss.match(/\.plotty-workshop-chapter-list\s*{(?<body>[^}]*)}/);
    const ruleBody = mobileRule?.groups?.body;

    expect(ruleBody).toBeDefined();
    expect(ruleBody).toContain("max-height");
    expect(ruleBody).toContain("overflow-y: auto");
    expect(ruleBody).toContain("overscroll-behavior: contain");
  });
});
