import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { listStories } from "@/mocks/data/stories";
import { StoryCard } from "@/widgets/stories/story-card";

describe("StoryCard", () => {
  it("renders story data, tags and link to story page", () => {
    const story = listStories({ tags: [], page: 1, pageSize: 20 }).items[0];

    render(<StoryCard story={story} />);

    expect(screen.getByRole("heading", { name: story.title })).toBeInTheDocument();
    expect(screen.getByText(story.excerpt!)).toBeInTheDocument();
    expect(screen.getByText(story.tags[0].name)).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", `/stories/${story.slug}`);
    expect(screen.getByAltText(`Обложка истории «${story.title}»`)).toBeInTheDocument();
  });

  it("renders a placeholder when the story has no cover image", () => {
    const storyWithoutCover = listStories({ tags: [], page: 1, pageSize: 20 }).items.find((item) => !item.coverImageUrl);

    expect(storyWithoutCover).toBeDefined();

    render(<StoryCard story={storyWithoutCover!} />);

    expect(screen.getByText(/Обложка появится автоматически/i)).toBeInTheDocument();
  });
});
