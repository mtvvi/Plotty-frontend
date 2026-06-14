import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function readCss() {
  return readFileSync(path.resolve("src/app/globals.css"), "utf8");
}

function readSource(relativePath: string) {
  return readFileSync(path.resolve(relativePath), "utf8");
}

function ruleBody(css: string, selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return css.match(new RegExp(`${escaped}\\s*{(?<body>[\\s\\S]*?)\\n}`))?.groups?.body ?? "";
}

describe("motion performance CSS", () => {
  it("keeps route reveal, mobile sheet, and wiki drawer overlays free of backdrop blur", () => {
    const css = readCss();

    expect(ruleBody(css, ".plotty-story-reveal-overlay")).not.toContain("backdrop-filter");
    expect(css).not.toContain("backdrop-filter");
    expect(readSource("src/shared/ui/sheet.tsx")).not.toContain("backdrop-blur");
    expect(readSource("src/widgets/stories/chapter-reader-screen.tsx")).not.toContain("backdrop-blur");
    expect(readSource("src/widgets/stories/story-editor-form.tsx")).not.toContain("backdrop-blur");
    expect(readSource("src/widgets/profile/public-profile-screen.tsx")).not.toContain("backdrop-blur");
  });

  it("does not animate profile edit panels with blur filters", () => {
    const css = readCss();
    const settingsEnter = css.match(/@keyframes plotty-profile-settings-enter\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? "";
    const settingsExit = css.match(/@keyframes plotty-profile-settings-exit\s*{(?<body>[\s\S]*?)\n}/)?.groups?.body ?? "";

    expect(settingsEnter).not.toContain("filter:");
    expect(settingsExit).not.toContain("filter:");
  });

  it("uses transform and sheen for story card hover instead of animating box-shadow", () => {
    const css = readCss();
    const cardRule = ruleBody(css, ".plotty-story-card");
    const cardHoverRule = ruleBody(css, ".plotty-story-card:hover");

    expect(css).toContain(".plotty-story-card::before");
    expect(cardRule).not.toContain("box-shadow var(");
    expect(cardHoverRule).not.toContain("box-shadow:");
  });

  it("keeps mass catalog elements out of permanent compositor promotion", () => {
    const css = readCss();

    expect(ruleBody(css, ".plotty-cover-preview img")).not.toContain("will-change");
    expect(ruleBody(css, ".plotty-button-label[data-plotty-button],\n.plotty-icon-motion[data-plotty-icon-button]")).not.toContain(
      "will-change",
    );
    expect(ruleBody(css, ".plotty-catalog-filter-card")).not.toContain("will-change");
    expect(css).not.toContain("will-change: transform, opacity");
    expect(css).not.toContain("will-change: transform;");
  });

  it("uses content visibility for offscreen catalog cards", () => {
    const css = readCss();
    const storyCardRule = ruleBody(css, ".plotty-catalog-story-list .plotty-story-card");

    expect(storyCardRule).toContain("content-visibility: auto");
    expect(storyCardRule).toContain("contain-intrinsic-size");
  });

  it("keeps repeated story tiles shadowless and does not zoom cover images on hover", () => {
    const css = readCss();
    const storyCardRule = ruleBody(css, ".plotty-story-card,\n.plotty-story-card:hover,\n.plotty-story-card:focus-within");
    const coverRule = ruleBody(
      css,
      ".plotty-story-card .plotty-cover-preview,\n.plotty-story-card:hover .plotty-cover-preview,\n.plotty-story-card:focus-within .plotty-cover-preview,\n.plotty-story-card .plotty-cover-preview:hover",
    );
    const coverImageRule = ruleBody(
      css,
      ".plotty-story-card .plotty-cover-preview img,\n.plotty-story-card:hover .plotty-cover-preview img,\n.plotty-story-card:focus-within .plotty-cover-preview img,\n.plotty-story-card .plotty-cover-preview:hover img",
    );

    expect(readSource("src/widgets/stories/story-card.tsx")).not.toContain("shadow-[var(--plotty-shadow-card)]");
    expect(storyCardRule).toContain("box-shadow: none");
    expect(coverRule).toContain("box-shadow: none");
    expect(coverImageRule).toContain("transform: none");
  });

  it("uses content visibility for repeated non-catalog story and chapter lists", () => {
    const css = readCss();

    for (const selector of [
      ".plotty-profile-works-list .plotty-story-card",
      ".plotty-library-story-list .plotty-story-card",
      ".plotty-collection-story-list .plotty-story-card",
      ".plotty-reader-chapter-list .plotty-motion-list-item",
      ".plotty-editor-chapter-nav-list a",
      ".plotty-workshop-story-list .plotty-workshop-story-card",
    ]) {
      const body = ruleBody(css, selector);

      expect(body).toContain("content-visibility: auto");
      expect(body).toContain("contain-intrinsic-size");
    }
  });

  it("does not stagger every item in long animated lists", () => {
    const css = readCss();

    expect(css).toContain(".plotty-motion-list-item:nth-child(n + 13)");
    expect(css).toContain("animation: none");
  });

  it("keeps the shared tab indicator off width and height transitions", () => {
    const indicatorRule = ruleBody(readCss(), ".plotty-tab-indicator");

    expect(indicatorRule).toContain("transform var(--motion-slow)");
    expect(indicatorRule).not.toContain("width var(");
    expect(indicatorRule).not.toContain("height var(");
  });
});
