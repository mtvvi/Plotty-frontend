import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { StoryDetailsScreen } from "@/widgets/stories/story-details-screen";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn() }),
  usePathname: () => "/stories/after-midnight-the-snow-does-not-melt",
  useSearchParams: () => new URLSearchParams(),
}));

function renderStoryDetails() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <StoryDetailsScreen slug="after-midnight-the-snow-does-not-melt" />
    </QueryClientProvider>,
  );
}

describe("StoryDetailsScreen", () => {
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
    expect(screen.queryByRole("button", { name: "Удалить историю" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Настройки истории" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Новая глава" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Редактировать главу" })).not.toBeInTheDocument();
  });
});
