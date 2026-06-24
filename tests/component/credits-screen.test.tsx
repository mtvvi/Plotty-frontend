import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import { AuthProvider } from "@/entities/auth/model/auth-context";
import { loginMockUser } from "@/mocks/data/auth";
import { server } from "@/mocks/server";
import { CreditsScreen } from "@/widgets/credits/credits-screen";

vi.mock("next/navigation", () => ({
  usePathname: () => "/credits",
  useRouter: () => ({ back: vi.fn(), push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

function renderCreditsScreen() {
  loginMockUser({ email: "writer@plotty.test", password: "password123" });

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CreditsScreen />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe("CreditsScreen", () => {
  it("defers transaction history requests until the history tab is opened", async () => {
    const user = userEvent.setup();
    let transactionsRequests = 0;

    server.use(
      http.get("*/credits/transactions", () => {
        transactionsRequests += 1;

        return HttpResponse.json([]);
      }),
    );

    renderCreditsScreen();

    await screen.findByRole("button", { name: "Пакеты" });
    await waitFor(() => expect(screen.getAllByRole("button", { name: "Купить" }).length).toBeGreaterThan(0));
    expect(transactionsRequests).toBe(0);

    await user.click(screen.getByRole("button", { name: "История" }));

    await waitFor(() => expect(transactionsRequests).toBe(1));
  });
});
