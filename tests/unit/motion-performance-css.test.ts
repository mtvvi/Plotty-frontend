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

  it("keeps the shared tab indicator off width and height transitions", () => {
    const indicatorRule = ruleBody(readCss(), ".plotty-tab-indicator");

    expect(indicatorRule).toContain("transform var(--motion-slow)");
    expect(indicatorRule).not.toContain("width var(");
    expect(indicatorRule).not.toContain("height var(");
  });
});
