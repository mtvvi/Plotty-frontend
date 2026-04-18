import { describe, expect, it } from "vitest";

async function loginWriter() {
  await fetch("http://localhost/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "writer@plotty.test",
      password: "password123",
    }),
  });
}

async function resolveTagIds(...slugs: string[]) {
  const response = await fetch("http://localhost/tags");
  const data = (await response.json()) as { items: Array<{ id: string; slug: string }> };

  return slugs
    .map((slug) => data.items.find((tag) => tag.slug === slug)?.id)
    .filter((tagId): tagId is string => Boolean(tagId));
}

describe("stories mock handlers", () => {
  it("filters stories by multiple tags using AND logic", async () => {
    const response = await fetch("http://localhost/stories?tag=drama&tag=ooc");
    const data = (await response.json()) as {
      pagination: { total: number };
      items: Array<{ slug: string; chaptersCount: number; likesCount: number }>;
    };

    expect(response.ok).toBe(true);
    expect(data.pagination.total).toBe(1);
    expect(data.items[0]?.slug).toBe("after-midnight-the-snow-does-not-melt");
    expect(data.items[0]?.chaptersCount).toBe(2);
    expect(data.items[0]?.likesCount).toBeGreaterThan(0);
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
    await loginWriter();
    const tagIds = await resolveTagIds("drama", "mysticism");

    const storyResponse = await fetch("http://localhost/stories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Midnight Draft",
        tagIds,
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
    await loginWriter();

    await fetch("http://localhost/stories/story-5", { method: "DELETE" });
    const response = await fetch("http://localhost/stories/mine");
    const data = (await response.json()) as { items: Array<{ id: string }> };

    expect(data.items.some((item) => item.id === "story-5")).toBe(false);
  });

  it("updates story title without changing aiHint", async () => {
    await loginWriter();

    const detailsBefore = await fetch("http://localhost/stories/after-midnight-the-snow-does-not-melt");
    const before = (await detailsBefore.json()) as { aiHint?: string };

    const patchResponse = await fetch("http://localhost/stories/story-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "После полуночи снег не тает",
      }),
    });

    expect(patchResponse.ok).toBe(true);

    const detailsResponse = await fetch("http://localhost/stories/after-midnight-the-snow-does-not-melt");
    const details = (await detailsResponse.json()) as { title: string; aiHint?: string };

    expect(details.title).toBe("После полуночи снег не тает");
    expect(details.aiHint).toBe(before.aiHint);
  });

  it("deletes a chapter and removes it from story details", async () => {
    await loginWriter();

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
