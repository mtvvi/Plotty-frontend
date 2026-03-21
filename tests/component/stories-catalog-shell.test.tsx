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

    await user.click(screen.getByRole("button", { name: "Драма" }));

    expect(replace).toHaveBeenCalledWith("/?tag=drama", { scroll: false });
  });

  it("updates the URL when a fandom tag is clicked", async () => {
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

    expect(replace).toHaveBeenCalledWith("/?tag=witcher", { scroll: false });
  });

  it("keeps all tag groups visible after selecting one fandom", async () => {
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
