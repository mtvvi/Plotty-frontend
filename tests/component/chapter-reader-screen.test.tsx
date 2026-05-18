import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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
});
