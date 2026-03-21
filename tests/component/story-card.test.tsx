import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { catalogStories } from "@/mocks/data/catalog";
import { StoryCard } from "@/widgets/catalog/story-card";

describe("StoryCard", () => {
  it("renders the core story fields and CTA", () => {
    render(<StoryCard story={catalogStories[0]} view="feed" />);

    expect(screen.getByRole("heading", { name: catalogStories[0].title })).toBeInTheDocument();
    expect(screen.getByText(/Сводка для читателя/i)).toBeInTheDocument();
    expect(screen.getByText(/Harry Potter/i)).toBeInTheDocument();
    expect(screen.getByText(/❤ 3 482/i)).toBeInTheDocument();
  });
});
