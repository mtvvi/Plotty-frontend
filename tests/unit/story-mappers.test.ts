import { describe, expect, it } from "vitest";

import { mapStoryListItem } from "@/entities/story/api/story-mappers";

describe("mapStoryListItem", () => {
  it("maps backend coverUrl into the frontend coverImageUrl field", () => {
    const story = mapStoryListItem({
      id: "story-1",
      slug: "story-one",
      title: "Story One",
      tags: [],
      chaptersCount: 1,
      coverUrl: "/covers/story-one.jpg",
      createdAt: "2026-04-25T10:00:00.000Z",
      updatedAt: "2026-04-25T10:00:00.000Z",
    } as Parameters<typeof mapStoryListItem>[0] & { coverUrl: string });

    expect(story.coverImageUrl).toBe("/covers/story-one.jpg");
  });

  it("does not materialize readChapterNumber when the backend omits it", () => {
    const story = mapStoryListItem({
      id: "story-1",
      slug: "story-one",
      title: "Story One",
      tags: [],
      chaptersCount: 1,
      createdAt: "2026-04-25T10:00:00.000Z",
      updatedAt: "2026-04-25T10:00:00.000Z",
    });

    expect(Object.prototype.hasOwnProperty.call(story, "readChapterNumber")).toBe(false);
  });
});
