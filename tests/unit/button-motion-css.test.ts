import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("button motion CSS", () => {
  it("restores the decorative hover glint on shared buttons", () => {
    const css = readFileSync(path.resolve("src/app/globals.css"), "utf8");

    expect(css).toContain(".plotty-button-label[data-plotty-button]::after");
    expect(css).toContain("mix-blend-mode: soft-light");
    expect(css).toContain("transform 520ms var(--ease-out-soft)");
    expect(css).toMatch(/\.plotty-button-label\[data-plotty-button\][\s\S]{0,240}will-change:\s*transform/);
    expect(css).toMatch(/\.plotty-icon-motion\[data-plotty-icon-button\][\s\S]{0,240}will-change:\s*transform/);
    expect(css).toContain('data-variant="primary"]:hover:not(:disabled):not([aria-disabled="true"])');
  });
});
