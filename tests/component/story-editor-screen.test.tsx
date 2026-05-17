import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { loginMockUser, resetMockAuthDb } from "@/mocks/data/auth";
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
    window.localStorage.clear();
    resetMockAuthDb();
    loginMockUser({ email: "writer@plotty.test", password: "password123" });
  });

  it("saves the chapter and updates the mock API state", async () => {
    const user = userEvent.setup();

    renderEditor();

    await waitFor(() => expect(screen.getByDisplayValue("Глава 1. Архив под лестницей")).toBeInTheDocument());

    expect(screen.queryByLabelText("Название истории")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Удалить историю" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Обновить иллюстрацию|Сгенерировать картинку/i })).toBeInTheDocument();

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

  it("dismisses a spellcheck issue without changing chapter text", async () => {
    const user = userEvent.setup();

    renderEditor();

    await waitFor(() => expect(screen.getByDisplayValue("Глава 1. Архив под лестницей")).toBeInTheDocument());
    const chapterContent = screen.getByLabelText("Текст главы");
    const originalContent = (chapterContent as HTMLTextAreaElement).value;

    await user.click(screen.getByRole("button", { name: "Проверить орфографию" }));
    await waitFor(() => expect(screen.getByText(/нечаянно/i)).toBeInTheDocument(), {
      timeout: 4_000,
    });
    await user.click(screen.getByRole("button", { name: "Оставить как есть" }));

    await waitFor(() => expect(screen.queryByText(/нечаянно/i)).not.toBeInTheDocument());
    expect(chapterContent).toHaveValue(originalContent);
  });

  it("does not reopen the spellcheck popover after it is closed", async () => {
    const user = userEvent.setup();
    const view = renderEditor();

    await waitFor(() => expect(screen.getByDisplayValue("Глава 1. Архив под лестницей")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "Проверить орфографию" }));
    await waitFor(() => expect(screen.getByText(/нечаянно/i)).toBeInTheDocument(), {
      timeout: 4_000,
    });

    const mark = view.container.querySelector("mark[data-error-id]") as HTMLElement;
    const layer = view.container.querySelector(".plotty-highlighted-textarea-layer") as HTMLElement;
    const visibleRect = DOMRect.fromRect({ x: 40, y: 80, width: 120, height: 24 });
    const viewportRect = DOMRect.fromRect({ x: 0, y: 0, width: 640, height: 420 });

    vi.spyOn(mark, "getBoundingClientRect").mockReturnValue(visibleRect);
    vi.spyOn(layer, "getBoundingClientRect").mockReturnValue(viewportRect);

    fireEvent.pointerDown(mark);
    await waitFor(() => expect(screen.getAllByRole("button", { name: "Исправить" })).toHaveLength(2));

    fireEvent.pointerDown(document.body);
    await waitFor(() => expect(screen.getAllByRole("button", { name: "Исправить" })).toHaveLength(1));

    fireEvent(window, new Event("resize"));
    await waitFor(() => expect(screen.getAllByRole("button", { name: "Исправить" })).toHaveLength(1));
  });

  it("does not show a credit badge on the spellcheck button", async () => {
    renderEditor();

    await waitFor(() => expect(screen.getByDisplayValue("Глава 1. Архив под лестницей")).toBeInTheDocument());

    expect(screen.queryByLabelText("Стоимость: 1 кредит")).not.toBeInTheDocument();
    expect(screen.getAllByLabelText("Стоимость: 2 кредита")).toHaveLength(2);
  });

  it("runs logic check and renders the verdict", async () => {
    const user = userEvent.setup();

    renderEditor();

    await waitFor(() => expect(screen.getByDisplayValue("Глава 1. Архив под лестницей")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "Проверить логику" }));

    await waitFor(() => expect(screen.getByText(/Логических нестыковок не найдено/i)).toBeInTheDocument(), {
      timeout: 4_000,
    });
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
