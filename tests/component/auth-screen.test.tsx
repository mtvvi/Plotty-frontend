import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AuthProvider } from "@/entities/auth/model/auth-context";
import { server } from "@/mocks/server";
import { AuthScreen } from "@/widgets/auth/auth-screen";

const replace = vi.fn();
const refresh = vi.fn();
let currentSearchParams = new URLSearchParams("mode=register");

vi.mock("next/navigation", () => ({
  usePathname: () => "/auth",
  useRouter: () => ({ back: vi.fn(), push: vi.fn(), replace, refresh }),
  useSearchParams: () => currentSearchParams,
}));

function renderAuthScreen(search = "mode=register") {
  currentSearchParams = new URLSearchParams(search);
  replace.mockClear();
  refresh.mockClear();

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthScreen />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe("AuthScreen", () => {
  it("shows friendly register copy for empty backend 400 responses", async () => {
    const user = userEvent.setup();
    server.use(http.post("*/register", () => new HttpResponse(null, { status: 400 })));

    renderAuthScreen();

    await screen.findByRole("heading", { name: "Создать аккаунт" });
    await user.type(screen.getByLabelText("Email"), "shaker@shaker.global.game");
    await user.type(screen.getByLabelText("Пароль"), "password123");
    await user.type(screen.getByLabelText("Подтверждение пароля"), "password123");
    await user.click(screen.getByRole("button", { name: "Зарегистрироваться" }));

    await waitFor(() => {
      expect(screen.getByText("Не удалось создать аккаунт. Проверьте данные и попробуйте ещё раз.")).toBeInTheDocument();
    });
    expect(screen.queryByText("Request failed: 400")).not.toBeInTheDocument();
  });

  it("maps lower-case backend auth field errors onto the matching fields", async () => {
    const user = userEvent.setup();
    server.use(
      http.post("*/register", () =>
        HttpResponse.json(
          {
            errors: [{ field: "email", message: "Email уже занят" }],
          },
          { status: 422 },
        ),
      ),
    );

    renderAuthScreen();

    await screen.findByRole("heading", { name: "Создать аккаунт" });
    await user.type(screen.getByLabelText("Email"), "writer@plotty.test");
    await user.type(screen.getByLabelText("Пароль"), "password123");
    await user.type(screen.getByLabelText("Подтверждение пароля"), "password123");
    await user.click(screen.getByRole("button", { name: "Зарегистрироваться" }));

    await waitFor(() => {
      expect(screen.getByText("Email уже занят")).toBeInTheDocument();
    });
  });
});
