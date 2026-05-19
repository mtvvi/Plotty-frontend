import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
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

    expect(screen.getByText(/Очень хорошо держится ритм/i)).toHaveClass("break-words", "whitespace-pre-wrap");
  });

  it("shows a retryable comments error instead of the empty comments state", async () => {
    server.use(http.get("*/chapters/:chapterId/comments", () => HttpResponse.json({ error: "comments unavailable" }, { status: 500 })));

    renderChapterReader();

    await waitFor(() => expect(screen.getByText("Комментарии недоступны")).toBeInTheDocument());

    expect(screen.queryByText("Комментариев пока нет")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Повторить" })).toBeInTheDocument();
  });
});
