import { describe, expect, it } from "vitest";

import {
  defaultStoriesQuery,
  parseStoriesQuery,
  serializeStoriesQuery,
} from "@/entities/story/model/story-query";

describe("story query helpers", () => {
  it("serializes repeated tag params and omits defaults", () => {
    const params = serializeStoriesQuery({
      ...defaultStoriesQuery,
      tags: ["slow-burn", "angst"],
    });

    expect(params.toString()).toBe("tag=slow-burn&tag=angst");
  });

  it("parses supported tags and drops unknown values", () => {
    const params = new URLSearchParams([
      ["tag", "slow-burn"],
      ["tag", "wrong-tag"],
      ["tag", "angst"],
      ["page", "2"],
    ]);

    expect(parseStoriesQuery(params)).toEqual({
      tags: ["slow-burn", "angst"],
      page: 2,
      pageSize: 20,
    });
  });
});
