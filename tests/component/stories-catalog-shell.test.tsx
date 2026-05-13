import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { StoriesCatalogShell } from "@/widgets/stories/stories-catalog-shell";

let currentSearchParams = new URLSearchParams();
const replace = vi.fn((href: string) => {
  const url = new URL(href, "http://localhost");
  currentSearchParams = new URLSearchParams(url.search);
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => currentSearchParams,
}));

function renderCatalogShell() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <StoriesCatalogShell />
    </QueryClientProvider>,
  );
}

describe("StoriesCatalogShell", () => {
  beforeEach(() => {
    currentSearchParams = new URLSearchParams();
    replace.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("applies desktop tag filter changes immediately", async () => {
    const user = userEvent.setup();
    renderCatalogShell();

    expect(screen.queryByText("Поиск и выдача")).not.toBeInTheDocument();
    expect(screen.queryByText(/Поиск живёт только здесь/i)).not.toBeInTheDocument();

    await waitFor(() => expect(screen.getByRole("button", { name: "Драма" })).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Драма" }));

    expect(replace).toHaveBeenCalledWith("/?tag=drama", { scroll: false });
  });

  it("applies desktop fandom picker changes immediately", async () => {
    const user = userEvent.setup();
    renderCatalogShell();

    await waitFor(() => expect(screen.getByRole("button", { name: "Фандом" })).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Фандом" }));
    await user.click(screen.getByRole("option", { name: "Ведьмак" }));

    expect(replace).toHaveBeenCalledWith("/?tag=witcher", { scroll: false });
  });

  it("keeps multi-select tag groups visible after selecting one fandom", async () => {
    const user = userEvent.setup();
    renderCatalogShell();

    await waitFor(() => expect(screen.getByRole("button", { name: "Фандом" })).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Фандом" }));
    await user.click(screen.getByRole("option", { name: "Гарри Поттер" }));

    expect(screen.getByText("Рейтинг")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Драма" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Насилие" })).toBeInTheDocument();
  });

  it("keeps search draft local until apply", async () => {
    const user = userEvent.setup();
    renderCatalogShell();

    const desktopSearch = screen.getByLabelText("Поиск по названию истории");

    await user.type(desktopSearch, "архив");

    expect(desktopSearch).toHaveFocus();
    expect(replace).not.toHaveBeenCalled();

    await waitFor(
      () => expect(replace).toHaveBeenLastCalledWith("/?q=%D0%B0%D1%80%D1%85%D0%B8%D0%B2", { scroll: false }),
      { timeout: 1000 },
    );
  });

  it("supports multi-select for rating pills on desktop", async () => {
    const user = userEvent.setup();

    const view = renderCatalogShell();

    await waitFor(() => expect(screen.getByRole("button", { name: "PG-13" })).toBeInTheDocument());

    const ratingGroup = screen.getByText("Рейтинг").closest("section");

    expect(ratingGroup).not.toBeNull();

    await user.click(within(ratingGroup as HTMLElement).getByRole("button", { name: "R" }));

    expect(replace).toHaveBeenLastCalledWith("/?tag=r", { scroll: false });

    view.rerender(
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: { queries: { retry: false } },
          })
        }
      >
        <StoriesCatalogShell />
      </QueryClientProvider>,
    );
    const updatedRatingGroup = screen.getByText("Рейтинг").closest("section");

    expect(updatedRatingGroup).not.toBeNull();

    await waitFor(() =>
      expect(within(updatedRatingGroup as HTMLElement).getByRole("button", { name: "PG-13" })).toBeInTheDocument(),
    );
    await user.click(within(updatedRatingGroup as HTMLElement).getByRole("button", { name: "PG-13" }));

    expect(replace).toHaveBeenLastCalledWith("/?tag=r&tag=pg-13", { scroll: false });
  });

  it("applies mobile filter changes immediately", async () => {
    const user = userEvent.setup();
    renderCatalogShell();

    await user.click(screen.getByRole("button", { name: "Открыть фильтры" }));

    const dialog = await screen.findByRole("dialog", { name: "Фильтры" });
    await user.click(within(dialog).getByRole("button", { name: "Драма" }));
    await user.click(within(dialog).getByRole("button", { name: "Закрыть" }));

    expect(replace).toHaveBeenCalledWith("/?tag=drama", { scroll: false });
  });

  it("does not render apply buttons for filters", async () => {
    renderCatalogShell();

    await waitFor(() => expect(screen.getByRole("button", { name: "Драма" })).toBeInTheDocument());

    expect(screen.queryByRole("button", { name: "Применить" })).not.toBeInTheDocument();
  });
});
