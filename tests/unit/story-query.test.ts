import { describe, expect, it } from "vitest";

import type { StoryListItem } from "@/entities/story/model/types";
import {
  defaultStoriesQuery,
  isStoryInPublicCatalog,
  parseStoriesQuery,
  serializeStoriesQuery,
} from "@/entities/story/model/story-query";

function minimalStory(overrides: Partial<StoryListItem>): StoryListItem {
  return {
    id: "1",
    slug: "s",
    title: "T",
    tags: [],
    chaptersCount: 0,
    createdAt: "",
    updatedAt: "",
    ...overrides,
  };
}

describe("story query helpers", () => {
  it("isStoryInPublicCatalog is true only for published", () => {
    expect(isStoryInPublicCatalog(minimalStory({ status: "published" }))).toBe(true);
    expect(isStoryInPublicCatalog(minimalStory({ status: "draft" }))).toBe(false);
    expect(isStoryInPublicCatalog(minimalStory({}))).toBe(false);
  });

  it("serializes repeated tag params and omits defaults", () => {
    const params = serializeStoriesQuery({
      ...defaultStoriesQuery,
      tags: ["drama", "ooc"],
    });

    expect(params.toString()).toBe("tag=drama&tag=ooc");
  });

  it("parses repeated tags, keeps order and includes q/page", () => {
    const params = new URLSearchParams([
      ["tag", "drama"],
      ["tag", "wrong-tag"],
      ["tag", "ooc"],
      ["q", "архив"],
      ["page", "2"],
    ]);

    expect(parseStoriesQuery(params)).toEqual({
      tags: ["drama", "wrong-tag", "ooc"],
      q: "архив",
      page: 2,
      pageSize: 20,
    });
  });

  it("serializes normalized tag filters", () => {
    const params = serializeStoriesQuery({
      ...defaultStoriesQuery,
      tags: ["harry-potter", "r", "in-progress", "midi"],
    });

    expect(params.toString()).toBe("tag=harry-potter&tag=r&tag=in-progress&tag=midi");
  });

  it("maps legacy secondary filters into normalized tags", () => {
    const params = new URLSearchParams([
      ["fandom", "Гарри Поттер"],
      ["rating", "R"],
      ["status", "в процессе"],
      ["size", "миди"],
    ]);

    expect(parseStoriesQuery(params)).toEqual({
      ...defaultStoriesQuery,
      tags: ["harry-potter", "r", "in-progress", "midi"],
    });
  });

  it("ignores unknown legacy secondary filters safely", () => {
    const params = new URLSearchParams([
      ["fandom", "Аркейн"],
      ["rating", "NC-99"],
      ["status", "Черновик"],
      ["size", "супер-макси"],
    ]);

    expect(parseStoriesQuery(params)).toEqual({
      ...defaultStoriesQuery,
    });
  });
});
