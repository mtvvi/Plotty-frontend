import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthProvider } from "@/entities/auth/model/auth-context";
import { getSidebarStoryCoverImageUrl } from "@/widgets/stories/story-create-screen";
import { StoryCreateScreen } from "@/widgets/stories/story-create-screen";

const push = vi.fn();
let currentSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/write",
  useSearchParams: () => currentSearchParams,
}));

vi.mock("@/entities/auth/model/auth-context", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: {
      id: 1,
      email: "writer@plotty.test",
      username: "writer",
      avatar_url: null,
      created_at: "2026-03-01T10:00:00.000Z",
      updated_at: "2026-03-01T10:00:00.000Z",
    },
    isAuthenticated: true,
    isLoading: false,
    isError: false,
  }),
}));

vi.mock("@/entities/story/api/stories-api", async () => {
  const actual = await vi.importActual<typeof import("@/entities/story/api/stories-api")>("@/entities/story/api/stories-api");

  return {
    ...actual,
    myStoriesQueryOptions: () => ({
      queryKey: ["test", "my-stories"],
      queryFn: async () => ({
        items: [
          {
            id: "story-emerald-wolf",
            slug: "emerald-wolf",
            title: "Изумрудная волчица",
            tags: [],
            chaptersCount: 1,
            status: "draft",
            coverImageUrl: null,
            createdAt: "2026-04-25T10:00:00.000Z",
            updatedAt: "2026-04-25T10:00:00.000Z",
          },
          {
            id: "story-silent-rain",
            slug: "silent-rain",
            title: "Тихий дождь",
            tags: [],
            chaptersCount: 1,
            status: "draft",
            coverImageUrl: null,
            createdAt: "2026-04-24T10:00:00.000Z",
            updatedAt: "2026-04-24T10:00:00.000Z",
          },
        ],
        pagination: { page: 1, pageSize: 50, total: 2 },
      }),
      enabled: true,
    }),
    storyDetailsQueryOptions: (slug: string) => ({
      queryKey: ["test", "story-details", slug],
      queryFn: async () => ({
        id: slug === "silent-rain" ? "story-silent-rain" : "story-emerald-wolf",
        slug,
        title: slug === "silent-rain" ? "Тихий дождь" : "Изумрудная волчица",
        tags: [],
        chapters: [],
        chaptersCount: 0,
        status: "draft",
        coverImageUrl: null,
        createdAt: "2026-04-25T10:00:00.000Z",
        updatedAt: "2026-04-25T10:00:00.000Z",
      }),
      enabled: Boolean(slug),
    }),
  };
});

function renderStoryCreateScreen() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StoryCreateScreen />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  currentSearchParams = new URLSearchParams();
  push.mockClear();
});

describe("getSidebarStoryCoverImageUrl", () => {
  it("uses the selected story display cover when the list item has no cover", () => {
    expect(
      getSidebarStoryCoverImageUrl({
        story: { slug: "selected-story", coverImageUrl: null },
        selectedStorySlug: "selected-story",
        selectedStoryDisplayCover: "/chapter-cover.png",
      }),
    ).toBe("/chapter-cover.png");
  });

  it("keeps the story cover from the list item when it exists", () => {
    expect(
      getSidebarStoryCoverImageUrl({
        story: { slug: "selected-story", coverImageUrl: "/story-cover.png" },
        selectedStorySlug: "selected-story",
        selectedStoryDisplayCover: "/chapter-cover.png",
      }),
    ).toBe("/story-cover.png");
  });

  it("does not reuse the selected cover for another sidebar story", () => {
    expect(
      getSidebarStoryCoverImageUrl({
        story: { slug: "other-story", coverImageUrl: null },
        selectedStorySlug: "selected-story",
        selectedStoryDisplayCover: "/chapter-cover.png",
      }),
    ).toBeUndefined();
  });
});

describe("StoryCreateScreen sidebar", () => {
  it("lets short two-word story titles wrap instead of truncating them", async () => {
    renderStoryCreateScreen();

    const sidebarTitle = await waitFor(() => screen.getByText("Изумрудная волчица", { selector: ".plotty-card-title" }));

    expect(sidebarTitle).not.toHaveClass("truncate");
  });

  it("filters the workshop story list by local story title", async () => {
    const user = userEvent.setup();
    renderStoryCreateScreen();

    await screen.findByText("Изумрудная волчица", { selector: ".plotty-card-title" });

    await user.type(screen.getByLabelText("Поиск по моим историям"), "дождь");

    expect(screen.getByText("Тихий дождь", { selector: ".plotty-card-title" })).toBeInTheDocument();
    expect(screen.queryByText("Изумрудная волчица", { selector: ".plotty-card-title" })).not.toBeInTheDocument();
  });

  it("shows a story settings saved message from the redirect flag", async () => {
    currentSearchParams = new URLSearchParams("saved=story");

    renderStoryCreateScreen();

    expect(await screen.findByRole("status")).toHaveTextContent("История сохранена");
  });

  it("makes tag editing visible from the active workshop story", async () => {
    renderStoryCreateScreen();

    expect(await screen.findByText("Теги, жанры и предупреждения")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Редактировать теги" })[0]).toHaveAttribute(
      "href",
      "/write/stories/story-emerald-wolf/settings",
    );
  });
});
