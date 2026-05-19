import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("popover motion CSS", () => {
  it("does not scale popover content during open or close animations", () => {
    const css = readFileSync(path.resolve("src/app/globals.css"), "utf8");
    const openKeyframes = css.match(/@keyframes plotty-popover-open\s*{(?<body>[\s\S]*?)\n}/);
    const closeKeyframes = css.match(/@keyframes plotty-popover-close\s*{(?<body>[\s\S]*?)\n}/);

    expect(openKeyframes?.groups?.body).toBeDefined();
    expect(closeKeyframes?.groups?.body).toBeDefined();
    expect(openKeyframes?.groups?.body).not.toContain("scale(");
    expect(closeKeyframes?.groups?.body).not.toContain("scale(");
  });
});
