import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
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
  it("renders backend-backed summary data without per-card fetch affordances", () => {
    const story = renderStoryCard();

    expect(screen.getByRole("heading", { name: story.title })).toBeInTheDocument();
    expect(screen.getByText(story.aiHint!)).toBeInTheDocument();
    expect(screen.getByText(story.tags[0].name)).toBeInTheDocument();
    expect(screen.getByText(`Автор ${story.author?.username}`)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: `Открыть историю ${story.title}` })).toBeInTheDocument();
    expect(screen.getByText(/Обложка появится, когда у первой главы будет иллюстрация/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Действия карточки")).toBeInTheDocument();
    expect(screen.queryByText(/\+\d+/)).not.toBeInTheDocument();
  });

  it("exposes semantic links for details and chapters", () => {
    const story = renderStoryCard();
    expect(screen.getByRole("link", { name: "Главы" })).toHaveAttribute("href", `/stories/${story.slug}?tab=chapters`);
    expect(screen.getByRole("link", { name: `Открыть историю ${story.title}` })).toHaveAttribute("href", `/stories/${story.slug}`);
  });

  it("renders a placeholder cover from list data instead of fetching chapter imagery", () => {
    renderStoryCard();

    expect(screen.getByText(/Обложка появится, когда у первой главы будет иллюстрация/i)).toBeInTheDocument();
    expect(screen.getByText(/Обложка появится, когда у первой главы будет иллюстрация/i).closest('[data-cover-frame="true"]')).toHaveClass(
      "h-full",
      "min-h-[18rem]",
    );
  });
});
