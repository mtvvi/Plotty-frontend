import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { loginMockUser, resetMockAuthDb } from "@/mocks/data/auth";
import { server } from "@/mocks/server";
import { StoryEditorScreen } from "@/widgets/stories/story-editor-screen";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  usePathname: () => "/write/stories/story-1/chapters/chapter-1",
  useSearchParams: () => new URLSearchParams(),
}));

function renderEditor(storyId = "story-1", chapterId = "chapter-1") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <StoryEditorScreen storyId={storyId} chapterId={chapterId} />
    </QueryClientProvider>,
  );
}

describe("StoryEditorScreen", () => {
  beforeEach(() => {
    push.mockReset();
    window.localStorage.clear();
    resetMockAuthDb();
    loginMockUser({ email: "writer@plotty.test", password: "password123" });
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
    await user.click(screen.getByRole("button", { name: "Сохранить черновик" }));

    await waitFor(async () => {
      const response = await fetch("http://localhost/chapters/chapter-1");
      const data = (await response.json()) as { title: string };

      expect(data.title).toBe("Глава 1. Новый архив");
    });
    expect(screen.getByRole("status")).toHaveTextContent("Черновик сохранён");
  });

  it("sends one chapter save PATCH with the current backend body contract", async () => {
    const user = userEvent.setup();
    const patchBodies: unknown[] = [];
    server.use(
      http.patch("*/chapters/:chapterId", async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;

        patchBodies.push(body);

        if ("draftTitle" in body || "draftContent" in body) {
          return HttpResponse.json({ error: "invalid chapter patch body" }, { status: 422 });
        }

        return HttpResponse.json({
          id: "chapter-1",
          storyId: "story-1",
          title: body.title,
          content: body.content,
          updatedAt: "2026-05-19T12:00:00.000Z",
          status: "draft",
        });
      }),
    );

    renderEditor();

    await waitFor(() => expect(screen.getByDisplayValue("Глава 1. Архив под лестницей")).toBeInTheDocument());

    const chapterTitle = screen.getByDisplayValue("Глава 1. Архив под лестницей");
    await user.clear(chapterTitle);
    await user.type(chapterTitle, "Глава 1. Один PATCH");
    await user.click(screen.getByRole("button", { name: "Сохранить черновик" }));

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Черновик сохранён"));

    expect(patchBodies).toHaveLength(1);
    expect(patchBodies[0]).toEqual(
      expect.objectContaining({
        title: "Глава 1. Один PATCH",
        content: expect.any(String),
      }),
    );
    expect(patchBodies[0]).not.toHaveProperty("draftTitle");
    expect(patchBodies[0]).not.toHaveProperty("draftContent");
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
    expect(screen.getByText("Было")).toBeInTheDocument();
    expect(screen.getByText("Замена")).toBeInTheDocument();
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

  it("removes a spellcheck issue from the sidebar after applying the suggested fix", async () => {
    const user = userEvent.setup();

    renderEditor();

    await waitFor(() => expect(screen.getByDisplayValue("Глава 1. Архив под лестницей")).toBeInTheDocument());
    const chapterContent = screen.getByLabelText("Текст главы") as HTMLTextAreaElement;

    expect(chapterContent.value).toContain("нечаяно");

    await user.click(screen.getByRole("button", { name: "Проверить орфографию" }));
    await waitFor(() => expect(screen.getByText(/нечаянно/i)).toBeInTheDocument(), {
      timeout: 4_000,
    });
    await user.click(screen.getByRole("button", { name: "Исправить" }));

    await waitFor(() => expect(screen.queryByText("Возможная орфографическая ошибка")).not.toBeInTheDocument());
    expect(chapterContent.value).toContain("нечаянно");
    expect(chapterContent.value).not.toContain("нечаяно");
  });

  it("removes stale spellcheck issues from the sidebar once the text is corrected", async () => {
    const user = userEvent.setup();

    renderEditor();

    await waitFor(() => expect(screen.getByDisplayValue("Глава 1. Архив под лестницей")).toBeInTheDocument());
    const chapterContent = screen.getByLabelText("Текст главы") as HTMLTextAreaElement;

    await user.click(screen.getByRole("button", { name: "Проверить орфографию" }));
    await waitFor(() => expect(screen.getByText(/нечаянно/i)).toBeInTheDocument(), {
      timeout: 4_000,
    });

    fireEvent.change(chapterContent, {
      target: { value: chapterContent.value.replace("нечаяно", "нечаянно") },
    });

    await waitFor(() => expect(screen.queryByText("Возможная орфографическая ошибка")).not.toBeInTheDocument());
    expect(chapterContent.value).toContain("нечаянно");
  });

  it("removes a spellcheck issue from the sidebar after applying the popover fix", async () => {
    const user = userEvent.setup();
    const view = renderEditor();

    await waitFor(() => expect(screen.getByDisplayValue("Глава 1. Архив под лестницей")).toBeInTheDocument());
    const chapterContent = screen.getByLabelText("Текст главы") as HTMLTextAreaElement;

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

    const applyButtons = screen.getAllByRole("button", { name: "Исправить" });
    await user.click(applyButtons[applyButtons.length - 1]);

    await waitFor(() => expect(screen.queryByText("Возможная орфографическая ошибка")).not.toBeInTheDocument());
    expect(chapterContent.value).toContain("нечаянно");
    expect(chapterContent.value).not.toContain("нечаяно");
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
    const costBadges = screen.getAllByLabelText("Стоимость: 2 кредита");

    expect(costBadges).toHaveLength(2);
    expect(costBadges[0]).toHaveAttribute("title", "Стоимость: 2 кредита");
  });

  it("lets writers edit the illustration prompt before generation", async () => {
    renderEditor();

    await waitFor(() => expect(screen.getByDisplayValue("Глава 1. Архив под лестницей")).toBeInTheDocument());

    expect(screen.getByLabelText("Промпт для иллюстрации")).toHaveValue(
      'Иллюстрация к главе "Глава 1. Архив под лестницей" истории "После полуночи снег не тает"',
    );
  });

  it("runs logic check and renders the verdict", async () => {
    const user = userEvent.setup();

    renderEditor("story-1", "chapter-2");

    await waitFor(() => expect(screen.getByDisplayValue("Глава 2. Сухой снег")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "Проверить логику" }));

    await waitFor(() => expect(screen.getByText(/Логических нестыковок не найдено/i)).toBeInTheDocument(), {
      timeout: 4_000,
    });
  });

  it("does not allow paid logic or canon checks when they would not run meaningfully", async () => {
    renderEditor();

    await waitFor(() => expect(screen.getByDisplayValue("Глава 1. Архив под лестницей")).toBeInTheDocument());

    expect(screen.getByRole("button", { name: "Проверить логику" })).toBeDisabled();
    expect(screen.getByText(/Проверка логики доступна со второй главы/i)).toBeInTheDocument();
    expect(screen.queryByText(/кредиты не списываются/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Проверить канон" })).toBeDisabled();
    expect(screen.getByText(/доступна только для историй с выбранным фандомом/i)).toBeInTheDocument();
  });

  it("deletes the current chapter and navigates back to the selected workshop story", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);

    renderEditor();

    await waitFor(() => expect(screen.getByDisplayValue("Глава 1. Архив под лестницей")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "Удалить главу" }));
    const dialog = await screen.findByRole("dialog", { name: "Удалить главу?" });

    expect(confirm).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Удалить главу" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/write?story=after-midnight-the-snow-does-not-melt#active-story"));
    const response = await fetch("http://localhost/chapters/chapter-1");
    expect(response.status).toBe(404);
  });
});
