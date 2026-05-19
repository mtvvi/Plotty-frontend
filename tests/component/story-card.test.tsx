import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AuthProvider } from "@/entities/auth/model/auth-context";
import { loginMockUser } from "@/mocks/data/auth";
import { listStories } from "@/mocks/data/stories";
import { StoryCard } from "@/widgets/stories/story-card";
import { storyCoverPlaceholderSrc } from "@/widgets/stories/story-cover-preview";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

function renderStoryCard(index = 0) {
  const story = listStories({ q: "", tags: [], page: 1, pageSize: 20 }).items[index];
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StoryCard story={story} />
      </AuthProvider>
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
    expect(screen.getByRole("link", { name: `Фильтр: ${story.tags[0].name}` })).toHaveAttribute(
      "href",
      `/?tag=${story.tags[0].slug}`,
    );
    expect(screen.getByText(`Автор ${story.author?.username}`)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: `Открыть историю ${story.title}` })).toBeInTheDocument();
    expect(screen.getByAltText(`Обложка появится позже для истории «${story.title}»`)).toHaveAttribute(
      "src",
      storyCoverPlaceholderSrc,
    );
    expect(screen.getByLabelText("Действия карточки")).toBeInTheDocument();
    expect(screen.queryByText(/\+\d+/)).not.toBeInTheDocument();
  });

  it("exposes semantic links for details and chapters", () => {
    const story = renderStoryCard();
    expect(screen.getByRole("link", { name: "Главы" })).toHaveAttribute("href", `/stories/${story.slug}?tab=chapters`);
    expect(screen.getByRole("link", { name: `Открыть историю ${story.title}` })).toHaveAttribute("href", `/stories/${story.slug}`);
  });

  it("uses explicit shelf and collection action labels", async () => {
    loginMockUser({ email: "writer@plotty.test", password: "password123" });
    renderStoryCard(1);

    expect(await screen.findAllByRole("button", { name: "В планы" })).not.toHaveLength(0);
    expect(screen.getAllByRole("button", { name: "В подборку" })).not.toHaveLength(0);
  });

  it("links authenticated readers to the first unread chapter", async () => {
    loginMockUser({ email: "writer@plotty.test", password: "password123" });
    renderStoryCard();

    await waitFor(() =>
      expect(screen.getAllByRole("link", { name: "Читать" })[0]).toHaveAttribute(
        "href",
        "/stories/after-midnight-the-snow-does-not-melt/chapters/2",
      ),
    );
  });

  it("renders a placeholder cover from list data instead of fetching chapter imagery", () => {
    const story = renderStoryCard();
    const placeholder = screen.getByAltText(`Обложка появится позже для истории «${story.title}»`);

    expect(placeholder).toHaveAttribute("src", storyCoverPlaceholderSrc);
    expect(placeholder.closest('[data-cover-frame="true"]')).toHaveClass(
      "h-full",
      "min-h-[18rem]",
    );
    expect(placeholder).toHaveClass("object-cover");
  });
});
