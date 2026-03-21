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

    await user.click(screen.getByRole("button", { name: "slow burn" }));

    expect(replace).toHaveBeenCalledWith("/?tag=slow-burn", { scroll: false });
  });
});
