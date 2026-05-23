import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import { server } from "@/mocks/server";
import { ChapterReaderScreen } from "@/widgets/stories/chapter-reader-screen";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn() }),
  usePathname: () => "/stories/after-midnight-the-snow-does-not-melt/chapters/1",
  useSearchParams: () => new URLSearchParams(),
}));

function renderChapterReader() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ChapterReaderScreen slug="after-midnight-the-snow-does-not-melt" number="1" />
    </QueryClientProvider>,
  );
}

describe("ChapterReaderScreen", () => {
  it("prevents long comments from overflowing their card", async () => {
    renderChapterReader();

    await waitFor(() => expect(screen.getByText("Комментарии к главе")).toBeInTheDocument());

    expect(document.querySelector("[data-gsap-reader-progress='true']")).not.toBeNull();
    expect(screen.getByText(/Очень хорошо держится ритм/i)).toHaveClass("break-words", "whitespace-pre-wrap");
  });

  it("shows a retryable comments error instead of the empty comments state", async () => {
    server.use(http.get("*/chapters/:chapterId/comments", () => HttpResponse.json({ error: "comments unavailable" }, { status: 500 })));

    renderChapterReader();

    await waitFor(() => expect(screen.getByText("Комментарии недоступны")).toBeInTheDocument());

    expect(screen.queryByText("Комментариев пока нет")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Повторить" })).toBeInTheDocument();
  });

  it("uses theme-aware surfaces for the chapter wiki drawer", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("*/chapters/:chapterId/wiki", () =>
        HttpResponse.json({
          characters: [{ name: "Санса Старк", state: "Первокурсница школы чародейства и волшебства Хогвартс." }],
          locations: [],
          items: [],
        }),
      ),
    );

    renderChapterReader();

    await user.click(await screen.findByRole("button", { name: "Справочник" }));
    await screen.findByRole("heading", { name: "Персонажи" });

    expect(document.querySelector(".plotty-motion-drawer")).toHaveClass(
      "bg-[var(--plotty-surface-strong)]",
      "border-[var(--plotty-line)]",
    );
    expect(screen.getByText("Санса Старк").parentElement).toHaveClass(
      "bg-[var(--plotty-surface-soft)]",
      "border-[var(--plotty-line)]",
    );
  });
});
