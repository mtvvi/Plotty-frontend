import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { StoriesCatalogShell } from "@/widgets/stories/stories-catalog-shell";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

describe("StoriesCatalogShell", () => {
  it("updates the URL when a tag filter is clicked", async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <StoriesCatalogShell />
      </QueryClientProvider>,
    );

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "После полуночи снег не тает" })).toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: "драма" }));

    expect(replace).toHaveBeenCalledWith("/?tag=drama", { scroll: false });
  });

  it("updates the URL when a fandom filter is clicked", async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <StoriesCatalogShell />
      </QueryClientProvider>,
    );

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "После полуночи снег не тает" })).toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: "Ведьмак" }));

    expect(replace).toHaveBeenCalledWith("/?fandom=%D0%92%D0%B5%D0%B4%D1%8C%D0%BC%D0%B0%D0%BA", { scroll: false });
  });

  it("keeps all fixed fandom chips visible after selecting one", async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <StoriesCatalogShell />
      </QueryClientProvider>,
    );

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "После полуночи снег не тает" })).toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: "Гарри Поттер" }));

    expect(screen.getByRole("button", { name: "Гарри Поттер" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ведьмак" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Властелин Колец" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Наруто" })).toBeInTheDocument();
  });
});
