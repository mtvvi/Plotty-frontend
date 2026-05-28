import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("chapter preview route auth gate", () => {
  it("wraps draft preview reading with RequireAuth", () => {
    const source = readFileSync(
      path.resolve("src/app/(plotty)/stories/[slug]/preview/[chapterId]/page.tsx"),
      "utf8",
    );

    expect(source).toContain("RequireAuth");
    expect(source).toContain("<RequireAuth>");
  });
});
