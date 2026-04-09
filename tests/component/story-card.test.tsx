import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { listStories } from "@/mocks/data/stories";
import { StoryCard } from "@/widgets/stories/story-card";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

function renderStoryCard() {
  const story = listStories({ q: "", tags: [], page: 1, pageSize: 20 }).items[0];
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <StoryCard story={story} />
    </QueryClientProvider>,
  );

  return story;
}

describe("StoryCard", () => {
  it("renders square cover, tags and whole-card navigation without CTA", () => {
    const story = renderStoryCard();

    expect(screen.getByRole("heading", { name: story.title })).toBeInTheDocument();
    expect(screen.getByText(story.excerpt!)).toBeInTheDocument();
    expect(screen.getByText(story.tags[0].name)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: `Открыть историю ${story.title}` })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Открыть историю" })).not.toBeInTheDocument();
    expect(screen.getByAltText(`Обложка истории «${story.title}»`)).toBeInTheDocument();
    expect(screen.getByLabelText("Действия карточки")).toBeInTheDocument();
    expect(screen.getByAltText(`Обложка истории «${story.title}»`).closest('[data-cover-frame="true"]')).toHaveClass(
      "h-full",
      "min-h-[18rem]",
    );
    expect(screen.queryByText(/\+\d+/)).not.toBeInTheDocument();
  });

  it("navigates on card click, but stats controls do not trigger card navigation", async () => {
    const user = userEvent.setup();
    const story = renderStoryCard();

    push.mockClear();

    await user.click(screen.getByRole("button", { name: "Комментарии" }));
    expect(push).toHaveBeenCalledWith(`/stories/${story.slug}?tab=comments`);

    push.mockClear();

    await user.click(screen.getByRole("button", { name: "Закладки" }));
    expect(push).not.toHaveBeenCalled();

    push.mockClear();

    await user.click(screen.getByRole("link", { name: `Открыть историю ${story.title}` }));
    expect(push).toHaveBeenCalledWith(`/stories/${story.slug}`);
  });

  it("renders a placeholder when the story has no cover image", () => {
    const storyWithoutCover = listStories({ q: "", tags: [], page: 1, pageSize: 20 }).items.find((item) => !item.coverImageUrl);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    expect(storyWithoutCover).toBeDefined();

    render(
      <QueryClientProvider client={queryClient}>
        <StoryCard story={storyWithoutCover!} />
      </QueryClientProvider>,
    );

    expect(screen.getByText(/Обложка появится, когда у первой главы будет иллюстрация/i)).toBeInTheDocument();
    expect(screen.getByText(/Обложка появится, когда у первой главы будет иллюстрация/i).closest('[data-cover-frame="true"]')).toHaveClass(
      "h-full",
      "min-h-[18rem]",
    );
  });
});
