import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { loginMockUser } from "@/mocks/data/auth";
import { ProfileCollectionsManager } from "@/widgets/profile/profile-collections-manager";

function renderCollectionsManager() {
  loginMockUser({ email: "writer@plotty.test", password: "password123" });

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <ProfileCollectionsManager username="writer" />
    </QueryClientProvider>,
  );
}

describe("ProfileCollectionsManager", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("confirms collection deletion with an in-app dialog from the profile manager", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);

    renderCollectionsManager();

    await user.click(await screen.findByLabelText("Действия с подборкой"));
    await user.click(screen.getByRole("button", { name: "Удалить" }));
    const dialog = await screen.findByRole("dialog", { name: "Удалить подборку?" });

    expect(confirm).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Отмена" }));

    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Удалить подборку?" })).not.toBeInTheDocument());
    expect(await screen.findByText(/Фанфики по Гарри Поттеру/i)).toBeInTheDocument();
  });
});
