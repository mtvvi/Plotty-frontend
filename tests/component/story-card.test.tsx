import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AuthProvider } from "@/entities/auth/model/auth-context";
import { loginMockUser } from "@/mocks/data/auth";
import { server } from "@/mocks/server";
import { listStories } from "@/mocks/data/stories";
import { StoryCard } from "@/widgets/stories/story-card";
import { storyCoverPlaceholderSrc } from "@/widgets/stories/story-cover-preview";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

function renderStoryCard(index = 0, storyOverride: Partial<ReturnType<typeof listStories>["items"][number]> = {}) {
  const story = {
    ...listStories({ q: "", tags: [], page: 1, pageSize: 20 }).items[index],
    ...storyOverride,
  };
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
    expect(screen.getByAltText(`Обложка появится позже для истории «${story.title}»`).getAttribute("src")).toContain(
      encodeURIComponent(storyCoverPlaceholderSrc),
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

  it("links to the first chapter without fetching reader progress when the list has no direct read number", async () => {
    loginMockUser({ email: "writer@plotty.test", password: "password123" });
    renderStoryCard();

    expect(screen.getAllByRole("link", { name: "Читать" })[0]).toHaveAttribute(
      "href",
      "/stories/after-midnight-the-snow-does-not-melt/chapters/1",
    );
  });

  it("does not fetch story details or viewed chapters during initial catalog render", async () => {
    let storyDetailsRequests = 0;
    let chaptersViewedRequests = 0;

    loginMockUser({ email: "writer@plotty.test", password: "password123" });
    server.use(
      http.get("*/stories/:slug/chapters/viewed", () => {
        chaptersViewedRequests += 1;

        return HttpResponse.json({ items: [] });
      }),
      http.get("*/stories/:slug", () => {
        storyDetailsRequests += 1;

        return HttpResponse.json({ message: "Unexpected story details fetch" }, { status: 500 });
      }),
    );

    renderStoryCard();

    await waitFor(() => expect(screen.getAllByRole("link", { name: "Читать" })[0]).toBeInTheDocument());
    expect(storyDetailsRequests).toBe(0);
    expect(chaptersViewedRequests).toBe(0);
  });

  it("does not fetch collection details before the collection control is opened", async () => {
    const user = userEvent.setup();
    let collectionDetailsRequests = 0;

    loginMockUser({ email: "writer@plotty.test", password: "password123" });
    server.use(
      http.get("*/me/collections/:collectionId", () => {
        collectionDetailsRequests += 1;

        return HttpResponse.json({ message: "Unexpected eager collection detail fetch" }, { status: 500 });
      }),
    );

    renderStoryCard();

    await waitFor(() => expect(screen.getAllByRole("button", { name: "В подборку" })[0]).toBeInTheDocument());
    expect(collectionDetailsRequests).toBe(0);

    await user.click(screen.getAllByRole("button", { name: "В подборку" })[0]);

    await waitFor(() => expect(collectionDetailsRequests).toBeGreaterThan(0));
  });

  it("renders a placeholder cover from list data instead of fetching chapter imagery", () => {
    const story = renderStoryCard();
    const placeholder = screen.getByAltText(`Обложка появится позже для истории «${story.title}»`);

    expect(placeholder.getAttribute("src")).toContain(encodeURIComponent(storyCoverPlaceholderSrc));
    expect(placeholder.closest('[data-cover-frame="true"]')).toHaveClass(
      "h-full",
      "min-h-[18rem]",
    );
    expect(placeholder).toHaveClass("object-cover");
  });

  it("does not fetch chapter details just to resolve catalog cover imagery", async () => {
    let chapterDetailsRequests = 0;

    server.use(
      http.get("*/chapters/:chapterId", () => {
        chapterDetailsRequests += 1;

        return HttpResponse.json({
          id: "chapter-1",
          storyId: "story-after-midnight",
          title: "Глава 1",
          content: "Текст главы",
          updatedAt: "2026-04-25T10:00:00.000Z",
          status: "published",
          imageUrl: "/chapter-cover.jpg",
        });
      }),
    );

    renderStoryCard();

    await waitFor(() =>
      expect(screen.getAllByRole("link", { name: "Читать" })[0]).toHaveAttribute(
        "href",
        "/stories/after-midnight-the-snow-does-not-melt/chapters/1",
      ),
    );
    expect(chapterDetailsRequests).toBe(0);
  });

  it("uses backend readChapterNumber without fetching story details", () => {
    let storyDetailsRequests = 0;
    const story = listStories({ q: "", tags: [], page: 1, pageSize: 20 }).items[0];

    server.use(
      http.get("*/stories/:slug", () => {
        storyDetailsRequests += 1;

        return HttpResponse.json({ ...story, chapters: [] });
      }),
    );

    renderStoryCard(0, { readChapterNumber: 2 });

    expect(screen.getAllByRole("link", { name: "Читать" })[0]).toHaveAttribute(
      "href",
      "/stories/after-midnight-the-snow-does-not-melt/chapters/2",
    );
    expect(storyDetailsRequests).toBe(0);
  });
});
