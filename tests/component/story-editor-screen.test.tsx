import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StoryEditorScreen } from "@/widgets/stories/story-editor-screen";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  usePathname: () => "/write/stories/story-1/chapters/chapter-1",
  useSearchParams: () => new URLSearchParams(),
}));

function renderEditor() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <StoryEditorScreen storyId="story-1" chapterId="chapter-1" />
    </QueryClientProvider>,
  );
}

describe("StoryEditorScreen", () => {
  beforeEach(() => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("saves the chapter and updates the mock API state", async () => {
    const user = userEvent.setup();

    renderEditor();

    await waitFor(() => expect(screen.getByDisplayValue("Глава 1. Архив под лестницей")).toBeInTheDocument());

    expect(screen.queryByLabelText("Название истории")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Удалить историю" })).not.toBeInTheDocument();

    const chapterTitle = screen.getByDisplayValue("Глава 1. Архив под лестницей");
    await user.clear(chapterTitle);
    await user.type(chapterTitle, "Глава 1. Новый архив");
    await user.click(screen.getByRole("button", { name: "Сохранить" }));

    await waitFor(async () => {
      const response = await fetch("http://localhost/chapters/chapter-1");
      const data = (await response.json()) as { title: string };

      expect(data.title).toBe("Глава 1. Новый архив");
    });
  });

  it("runs spellcheck and renders the returned issues", async () => {
    const user = userEvent.setup();

    renderEditor();

    await waitFor(() => expect(screen.getByDisplayValue("Глава 1. Архив под лестницей")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "Проверить орфографию" }));

    await waitFor(() => expect(screen.getByText(/Найдено 1 замечание/i)).toBeInTheDocument(), {
      timeout: 4_000,
    });
    expect(screen.getByText(/нечаянно/i)).toBeInTheDocument();
  });

  it("deletes the current chapter and navigates back to the story page", async () => {
    const user = userEvent.setup();

    renderEditor();

    await waitFor(() => expect(screen.getByDisplayValue("Глава 1. Архив под лестницей")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "Удалить главу" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/stories/after-midnight-the-snow-does-not-melt"));
    const response = await fetch("http://localhost/chapters/chapter-1");
    expect(response.status).toBe(404);
  });
});
