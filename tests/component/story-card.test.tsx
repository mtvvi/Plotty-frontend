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
    expect(screen.getByText(story.tags[0].name)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: story.title })).toHaveAttribute("href", `/stories/${story.slug}`);
  });
});
