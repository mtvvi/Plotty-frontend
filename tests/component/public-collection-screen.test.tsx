import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthProvider } from "@/entities/auth/model/auth-context";
import { loginMockUser } from "@/mocks/data/auth";
import { server } from "@/mocks/server";
import { PublicCollectionScreen } from "@/widgets/profile/public-collection-screen";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn(), push, replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/users/writer/collections/collection-1",
  useSearchParams: () => new URLSearchParams(),
}));

function renderPublicCollection() {
  loginMockUser({ email: "writer@plotty.test", password: "password123" });

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PublicCollectionScreen username="writer" collectionId="collection-1" />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe("PublicCollectionScreen", () => {
  afterEach(() => {
    push.mockReset();
    vi.restoreAllMocks();
  });

  it("confirms public collection deletion with an in-app dialog", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);

    renderPublicCollection();

    await user.click(await screen.findByRole("button", { name: "Удалить" }));
    const dialog = await screen.findByRole("dialog", { name: "Удалить подборку?" });

    expect(confirm).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Отмена" }));

    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Удалить подборку?" })).not.toBeInTheDocument());
    expect(push).not.toHaveBeenCalled();
  });

  it("shows feedback when copying the public collection link is unavailable", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });

    renderPublicCollection();

    await user.click(await screen.findByRole("button", { name: "Ссылка" }));

    await waitFor(() => expect(screen.getByText("Не удалось скопировать ссылку")).toBeInTheDocument());
  });

  it("marks the edit panel as a CSS presence surface", async () => {
    const user = userEvent.setup();

    renderPublicCollection();

    await user.click(await screen.findByRole("button", { name: "Изменить" }));

    expect(document.querySelector("[data-presence='collection-edit']")).not.toBeNull();
  });

  it("hydrates story card shelf and collection state on initial render", async () => {
    renderPublicCollection();

    expect(await screen.findByRole("button", { name: "Читаю" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "В 1 подборке" })).not.toHaveLength(0);
  });

  it("hides owner controls when the returned collection belongs to another user id", async () => {
    server.use(
      http.get("*/users/:username/collections/:collectionId", () =>
        HttpResponse.json({
          collection: {
            id: "collection-1",
            userId: 999,
            title: "Чужая подборка",
            description: null,
            createdAt: "2026-05-01T10:00:00.000Z",
            updatedAt: "2026-05-01T10:00:00.000Z",
            stories: [],
          },
        }),
      ),
    );

    renderPublicCollection();

    expect(await screen.findByRole("heading", { name: "Чужая подборка" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Изменить" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Удалить" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Убрать из подборки" })).not.toBeInTheDocument();
  });
});
