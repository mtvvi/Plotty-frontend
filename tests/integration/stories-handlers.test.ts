import { describe, expect, it } from "vitest";

describe("stories mock handlers", () => {
  it("filters stories by multiple tags using AND logic", async () => {
    const response = await fetch("http://localhost/stories?tag=drama&tag=ooc");
    const data = (await response.json()) as {
      pagination: { total: number };
      items: Array<{ slug: string; coverImageUrl?: string }>;
    };

    expect(response.ok).toBe(true);
    expect(data.pagination.total).toBe(1);
    expect(data.items[0]?.slug).toBe("after-midnight-the-snow-does-not-melt");
    expect(data.items[0]?.coverImageUrl).toContain("data:image/svg+xml");
  });

  it("filters stories by fandom, rating, status and size", async () => {
    const response = await fetch(
      "http://localhost/stories?tag=harry-potter&tag=r&tag=in-progress&tag=midi",
    );
    const data = (await response.json()) as { pagination: { total: number }; items: Array<{ slug: string }> };

    expect(response.ok).toBe(true);
    expect(data.pagination.total).toBe(1);
    expect(data.items[0]?.slug).toBe("after-midnight-the-snow-does-not-melt");
  });

  it("creates a story and its first chapter", async () => {
    const storyResponse = await fetch("http://localhost/stories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Midnight Draft",
        description: "Описание истории",
        tags: ["drama", "mysticism"],
      }),
    });
    const story = (await storyResponse.json()) as { id: string; slug: string };

    const chapterResponse = await fetch(`http://localhost/stories/${story.id}/chapters`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Глава 1",
        content: "Первый текст",
      }),
    });
    const chapter = (await chapterResponse.json()) as { id: string };

    const detailsResponse = await fetch(`http://localhost/stories/${story.slug}`);
    const details = (await detailsResponse.json()) as { chapters: Array<{ id: string }> };

    expect(detailsResponse.ok).toBe(true);
    expect(details.chapters[0]?.id).toBe(chapter.id);
  });

  it("deletes a story and removes it from the list", async () => {
    await fetch("http://localhost/stories/story-3", { method: "DELETE" });
    const response = await fetch("http://localhost/stories");
    const data = (await response.json()) as { items: Array<{ id: string }> };

    expect(data.items.some((item) => item.id === "story-3")).toBe(false);
  });

  it("updates story title without changing description (annotation comes from backend/ML)", async () => {
    const detailsBefore = await fetch("http://localhost/stories/after-midnight-the-snow-does-not-melt");
    const before = (await detailsBefore.json()) as { description?: string };

    const patchResponse = await fetch("http://localhost/stories/story-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "После полуночи снег не тает",
      }),
    });

    expect(patchResponse.ok).toBe(true);

    const detailsResponse = await fetch("http://localhost/stories/after-midnight-the-snow-does-not-melt");
    const details = (await detailsResponse.json()) as { title: string; description?: string };

    expect(details.title).toBe("После полуночи снег не тает");
    expect(details.description).toBe(before.description);
  });

  it("deletes a chapter and removes it from story details", async () => {
    await fetch("http://localhost/chapters/chapter-2", { method: "DELETE" });
    const response = await fetch("http://localhost/stories/after-midnight-the-snow-does-not-melt");
    const data = (await response.json()) as { chapters: Array<{ id: string }> };

    expect(data.chapters.some((chapter) => chapter.id === "chapter-2")).toBe(false);
  });

  it("stores a generated image on the chapter and exposes it in chapter details", async () => {
    const acceptedResponse = await fetch("http://localhost/ai/image-generation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chapterId: "chapter-1",
        content: "Текст",
        prompt: "Снег и архив",
      }),
    });
    const accepted = (await acceptedResponse.json()) as { jobId: string };

    await new Promise((resolve) => setTimeout(resolve, 350));
    await fetch(`http://localhost/ai/jobs/${accepted.jobId}`);

    const chapterResponse = await fetch("http://localhost/chapters/chapter-1");
    const chapter = (await chapterResponse.json()) as { imageUrl?: string };

    expect(chapter.imageUrl).toContain("data:image/svg+xml");
  });
});
