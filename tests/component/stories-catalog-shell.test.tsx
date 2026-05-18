import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { server } from "@/mocks/server";
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

function makeStoryResponseItem(index: number) {
  return {
    id: `story-${index}`,
    slug: `story-${index}`,
    title: `История ${index}`,
    tags: [],
    chaptersCount: 1,
    status: "published",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: `2026-01-${String((index % 28) + 1).padStart(2, "0")}T00:00:00.000Z`,
  };
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

  it("filters fandom options by text inside the fandom picker", async () => {
    const user = userEvent.setup();
    renderCatalogShell();

    await waitFor(() => expect(screen.getByRole("button", { name: "Фандом" })).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Фандом" }));
    await user.type(screen.getByLabelText("Поиск по фандомам"), "ведь");

    expect(screen.getByRole("option", { name: "Ведьмак" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Гарри Поттер" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Очистить поиск фандомов" }));

    expect(screen.getByRole("option", { name: "Гарри Поттер" })).toBeInTheDocument();
  });

  it("clears selected genre and warning groups independently", async () => {
    const user = userEvent.setup();
    currentSearchParams = new URLSearchParams("tag=drama&tag=violence");

    const firstView = renderCatalogShell();

    await waitFor(() => expect(screen.getByRole("button", { name: "Драма" })).toBeInTheDocument());

    const genreGroup = screen.getByText("Жанры").closest("section");
    const warningGroup = screen.getByText("Предупреждения").closest("section");

    expect(genreGroup).not.toBeNull();
    expect(warningGroup).not.toBeNull();

    await user.click(within(genreGroup as HTMLElement).getByRole("button", { name: "Очистить" }));
    expect(replace).toHaveBeenLastCalledWith("/?tag=violence", { scroll: false });

    firstView.unmount();
    currentSearchParams = new URLSearchParams("tag=drama&tag=violence");
    replace.mockClear();
    renderCatalogShell();

    await waitFor(() => expect(screen.getByRole("button", { name: "Насилие" })).toBeInTheDocument());
    const nextWarningGroup = screen.getByText("Предупреждения").closest("section");

    expect(nextWarningGroup).not.toBeNull();
    await user.click(within(nextWarningGroup as HTMLElement).getByRole("button", { name: "Очистить" }));
    expect(replace).toHaveBeenLastCalledWith("/?tag=drama", { scroll: false });
  });

  it("offers a local popularity sort without sending an unsupported API sort", async () => {
    const user = userEvent.setup();
    renderCatalogShell();

    await waitFor(() => expect(screen.getByRole("button", { name: "Сортировка" })).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Сортировка" }));
    await user.click(screen.getByRole("option", { name: "Популярное" }));

    expect(screen.getByRole("button", { name: "Сортировка" })).toHaveTextContent("Популярное");
    expect(replace).toHaveBeenLastCalledWith("/", { scroll: false });
  });

  it("does not render the duplicate small catalog search in page actions", async () => {
    renderCatalogShell();

    await waitFor(() => expect(screen.getByRole("button", { name: "Сортировка" })).toBeInTheDocument());

    expect(screen.queryByLabelText("Поиск в каталоге")).not.toBeInTheDocument();
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

  it("renders catalog pagination and navigates to the next page", async () => {
    const user = userEvent.setup();

    server.use(
      http.get("*/stories", ({ request }) => {
        const url = new URL(request.url);
        const page = Number(url.searchParams.get("page") ?? 1);
        const pageSize = Number(url.searchParams.get("pageSize") ?? 20);
        const start = (page - 1) * pageSize;

        return HttpResponse.json({
          items: Array.from({ length: pageSize }, (_, index) => makeStoryResponseItem(start + index + 1)),
          pagination: {
            page,
            pageSize,
            total: 42,
          },
        });
      }),
    );

    renderCatalogShell();

    expect(await screen.findByRole("navigation", { name: "Пагинация каталога" })).toBeInTheDocument();
    expect(screen.getByText("1-20 из 42")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Следующая страница" }));

    expect(replace).toHaveBeenLastCalledWith("/?page=2", { scroll: false });
  });
});
