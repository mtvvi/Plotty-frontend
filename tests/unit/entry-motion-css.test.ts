import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function keyframesBody(css: string, name: string) {
  return css.match(new RegExp(`@keyframes ${name}\\s*{(?<body>[\\s\\S]*?)\\n}`))?.groups?.body;
}

describe("entry motion CSS", () => {
  it("does not move layout-sized page, header, or list containers during initial paint", () => {
    const css = readFileSync(path.resolve("src/app/globals.css"), "utf8");

    for (const name of [
      "plotty-header-enter",
      "plotty-page-enter",
      "plotty-stagger-enter",
      "plotty-motion-list-item-enter",
    ]) {
      const body = keyframesBody(css, name);

      expect(body).toBeDefined();
      expect(body).not.toContain("translate");
      expect(body).not.toContain("scale(");
    }
  });
});
