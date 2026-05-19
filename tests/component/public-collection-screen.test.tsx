import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthProvider } from "@/entities/auth/model/auth-context";
import { loginMockUser } from "@/mocks/data/auth";
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

  it("requires confirmation before deleting a public collection", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);

    renderPublicCollection();

    await user.click(await screen.findByRole("button", { name: "Удалить" }));

    expect(confirm).toHaveBeenCalledWith("Удалить подборку?");
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
});
