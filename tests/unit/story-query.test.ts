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
      tags: ["drama", "ooc"],
    });

    expect(params.toString()).toBe("tag=drama&tag=ooc");
  });

  it("parses supported tags and drops unknown values", () => {
    const params = new URLSearchParams([
      ["tag", "drama"],
      ["tag", "wrong-tag"],
      ["tag", "ooc"],
      ["page", "2"],
    ]);

    expect(parseStoriesQuery(params)).toEqual({
      tags: ["drama", "ooc"],
      fandom: "",
      rating: "",
      status: "",
      size: "",
      page: 2,
      pageSize: 20,
    });
  });

  it("serializes secondary filters", () => {
    const params = serializeStoriesQuery({
      ...defaultStoriesQuery,
      fandom: "Гарри Поттер",
      rating: "R",
      status: "в процессе",
      size: "миди",
    });

    expect(params.toString()).toBe(
      "fandom=%D0%93%D0%B0%D1%80%D1%80%D0%B8+%D0%9F%D0%BE%D1%82%D1%82%D0%B5%D1%80&rating=R&status=%D0%B2+%D0%BF%D1%80%D0%BE%D1%86%D0%B5%D1%81%D1%81%D0%B5&size=%D0%BC%D0%B8%D0%B4%D0%B8",
    );
  });

  it("drops unsupported secondary filters", () => {
    const params = new URLSearchParams([
      ["fandom", "Аркейн"],
      ["rating", "NC-99"],
      ["status", "Черновик"],
      ["size", "супер-макси"],
    ]);

    expect(parseStoriesQuery(params)).toEqual(defaultStoriesQuery);
  });
});
