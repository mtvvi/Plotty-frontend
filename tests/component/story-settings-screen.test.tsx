import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { listStories } from "@/mocks/data/stories";
import { StorySettingsScreen } from "@/widgets/stories/story-settings-screen";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), refresh: vi.fn(), back: vi.fn() }),
  usePathname: () => "/write/stories/story-1/settings",
  useSearchParams: () => new URLSearchParams(),
}));

function renderStorySettings() {
  const story = listStories({ q: "", tags: [], page: 1, pageSize: 20 }).items[0];
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <StorySettingsScreen storyId={story.id} />
    </QueryClientProvider>,
  );

  return story;
}

describe("StorySettingsScreen", () => {
  it("uses the same staged edit flow pattern without chapter creation", async () => {
    const user = userEvent.setup();
    renderStorySettings();

    await waitFor(() => expect(screen.getByRole("button", { name: /Название, описание и тизер/i })).toBeInTheDocument());

    expect(screen.queryByRole("link", { name: "В мастерскую" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Название главы")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Теги и категории/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: "DC" })).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "DC" }));
    await user.click(screen.getByRole("button", { name: "NC-17" }));
    await user.click(screen.getByRole("button", { name: "В процессе" }));
    await user.click(screen.getByRole("button", { name: "Макси" }));

    await user.click(screen.getByRole("button", { name: /Проверка и сохранение/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Сохранить изменения" })).toBeInTheDocument());

    expect(screen.getByRole("button", { name: "Удалить историю" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Название главы")).not.toBeInTheDocument();
  });
});
