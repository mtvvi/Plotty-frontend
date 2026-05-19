import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import { AuthProvider } from "@/entities/auth/model/auth-context";
import { loginMockUser } from "@/mocks/data/auth";
import { server } from "@/mocks/server";
import { ReaderLibraryScreen } from "@/widgets/library/reader-library-screen";

vi.mock("next/navigation", () => ({
  usePathname: () => "/library",
  useRouter: () => ({ back: vi.fn(), push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

function renderLibraryScreen() {
  loginMockUser({ email: "writer@plotty.test", password: "password123" });

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ReaderLibraryScreen />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe("ReaderLibraryScreen", () => {
  it("stretches shelf status filters across the tile with an animated active indicator", async () => {
    renderLibraryScreen();

    const allTab = await screen.findByRole("button", { name: "Все" });
    const statusTabs = allTab.parentElement;

    expect(statusTabs).toHaveClass("plotty-segmented");
    expect(statusTabs).toHaveClass("grid-cols-3");
    expect(statusTabs).toHaveClass("sm:grid-cols-6");
    expect(statusTabs).not.toHaveClass("plotty-segmented-mobile-grid");
    expect(statusTabs).not.toHaveClass("overflow-x-auto");
    expect(statusTabs?.querySelector(".plotty-tab-indicator")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Прочитано" })).toBeInTheDocument();
  });

  it("shows a retryable shelf error instead of an empty shelf", async () => {
    server.use(http.get("*/me/library/shelf", () => HttpResponse.json({ error: "shelf unavailable" }, { status: 500 })));

    renderLibraryScreen();

    expect(await screen.findByText("Полка недоступна")).toBeInTheDocument();
    expect(screen.queryByText("Здесь пока пусто")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Повторить" })).toBeInTheDocument();
  });
});
