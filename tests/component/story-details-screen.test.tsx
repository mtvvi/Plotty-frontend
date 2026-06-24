import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider } from "@/entities/auth/model/auth-context";
import { loginMockUser } from "@/mocks/data/auth";
import { server } from "@/mocks/server";
import { StoryDetailsScreen } from "@/widgets/stories/story-details-screen";

let currentSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn() }),
  usePathname: () => "/stories/after-midnight-the-snow-does-not-melt",
  useSearchParams: () => currentSearchParams,
}));

function renderStoryDetails(slug = "after-midnight-the-snow-does-not-melt") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StoryDetailsScreen slug={slug} />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe("StoryDetailsScreen", () => {
  beforeEach(() => {
    currentSearchParams = new URLSearchParams();
  });

  it("renders cover, read CTA, AI annotation and chapters access without authoring controls", async () => {
    renderStoryDetails();

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "После полуночи снег не тает" })).toBeInTheDocument(),
    );

    await waitFor(() =>
      expect(screen.getByAltText("Обложка истории «После полуночи снег не тает»")).toBeInTheDocument(),
    );
    expect(screen.getAllByRole("link", { name: "Читать" })[0]).toHaveAttribute(
      "href",
      "/stories/after-midnight-the-snow-does-not-melt/chapters/1",
    );
    expect(screen.getByRole("button", { name: "Описание" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Главы" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Комментарии" })).toBeInTheDocument();
    expect(screen.getAllByText(/AI автора: 2 замечания по канону/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Фильтр: Драма" })).toHaveAttribute("href", "/?tag=drama");
    expect(document.querySelector("#story-content")).not.toBeNull();
    expect(screen.queryByText("Новая")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Удалить историю" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Настройки истории" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Новая глава" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Редактировать главу" })).not.toBeInTheDocument();
  });

  it("keeps the 1279px story layout through 1330px before enabling the wide sidebar", async () => {
    renderStoryDetails();

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "После полуночи снег не тает" })).toBeInTheDocument(),
    );

    const layout = document.querySelector(".plotty-story-details-layout");

    expect(layout).not.toBeNull();
    expect(layout?.className).not.toContain("xl:grid-cols-[minmax(0,1fr)_21rem]");
    expect(layout?.className).toContain("min-[1331px]:grid-cols-[minmax(0,1fr)_21rem]");
  });

  it("opens the chapters tab from the tab query param", async () => {
    currentSearchParams = new URLSearchParams("tab=chapters");

    renderStoryDetails();

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "После полуночи снег не тает" })).toBeInTheDocument(),
    );

    expect(screen.getByRole("button", { name: "Главы" })).toHaveAttribute("aria-pressed", "true");
    expect(document.querySelector("#chapters")).not.toHaveClass("max-lg:hidden");
  });

  it("sends authenticated readers to the first unread chapter", async () => {
    currentSearchParams = new URLSearchParams();
    loginMockUser({ email: "writer@plotty.test", password: "password123" });

    renderStoryDetails();

    await waitFor(() =>
      expect(screen.getAllByRole("link", { name: "Читать" })[0]).toHaveAttribute(
        "href",
        "/stories/after-midnight-the-snow-does-not-melt/chapters/2",
      ),
    );
  });

  it("restores a generated chapter image as the story cover when details have no cover URL", async () => {
    let chapterRequests = 0;
    vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(800);

    server.use(
      http.get("*/stories/no-cover-generated", () =>
        HttpResponse.json({
          id: "story-no-cover",
          slug: "no-cover-generated",
          title: "История без обложки",
          createdAt: "2026-05-01T10:00:00.000Z",
          updatedAt: "2026-05-02T10:00:00.000Z",
          coverImageUrl: null,
          coverUrl: null,
          tags: [],
          likesCount: 0,
          likedByMe: false,
          aiHint: "Картинка лежит на первой главе.",
          author: { id: 1, username: "writer" },
          chapters: [
            {
              id: "chapter-generated-cover",
              title: "Глава с картинкой",
              updatedAt: "2026-05-02T10:00:00.000Z",
              status: "published",
            },
          ],
        }),
      ),
      http.get("*/chapters/chapter-generated-cover", () => {
        chapterRequests += 1;

        return HttpResponse.json({
          id: "chapter-generated-cover",
          storyId: "story-no-cover",
          title: "Глава с картинкой",
          content: "Текст главы",
          updatedAt: "2026-05-02T10:00:00.000Z",
          status: "published",
          imageUrl: "https://s3.plotty-stories.duckdns.org/mock/generated-cover.webp",
        });
      }),
    );

    renderStoryDetails("no-cover-generated");

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "История без обложки" })).toBeInTheDocument(),
    );

    await waitFor(() => expect(chapterRequests).toBe(1));
    await waitFor(() =>
      expect(screen.getByAltText("Обложка истории «История без обложки»")).toBeInTheDocument(),
    );
  });
});
