import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider } from "@/entities/auth/model/auth-context";
import { loginMockUser } from "@/mocks/data/auth";
import { StoryDetailsScreen } from "@/widgets/stories/story-details-screen";

let currentSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn() }),
  usePathname: () => "/stories/after-midnight-the-snow-does-not-melt",
  useSearchParams: () => currentSearchParams,
}));

function renderStoryDetails() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StoryDetailsScreen slug="after-midnight-the-snow-does-not-melt" />
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
    expect(document.querySelector("#story-content")).not.toBeNull();
    expect(screen.queryByText("Новая")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Удалить историю" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Настройки истории" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Новая глава" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Редактировать главу" })).not.toBeInTheDocument();
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
});
