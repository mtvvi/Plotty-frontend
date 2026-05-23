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
    expect(document.querySelector("[data-gsap-intro='auth-form']")).not.toBeNull();
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

  it("lets users reveal and hide password fields", async () => {
    const user = userEvent.setup();

    renderAuthScreen();

    await screen.findByRole("heading", { name: "Создать аккаунт" });
    const password = screen.getByLabelText("Пароль");
    const confirmPassword = screen.getByLabelText("Подтверждение пароля");

    expect(password).toHaveAttribute("type", "password");
    expect(confirmPassword).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "Показать пароль" }));
    await user.click(screen.getByRole("button", { name: "Показать подтверждение пароля" }));

    expect(password).toHaveAttribute("type", "text");
    expect(confirmPassword).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: "Скрыть пароль" }));

    expect(password).toHaveAttribute("type", "password");
  });

  it("validates register password before submitting to the backend", async () => {
    const user = userEvent.setup();
    const registerHandler = vi.fn();
    server.use(
      http.post("*/register", () => {
        registerHandler();

        return HttpResponse.json({ user: null }, { status: 201 });
      }),
    );

    renderAuthScreen();

    await screen.findByRole("heading", { name: "Создать аккаунт" });
    await user.type(screen.getByLabelText("Email"), "writer@plotty.test");
    await user.type(screen.getByLabelText("Пароль"), "short");
    await user.type(screen.getByLabelText("Подтверждение пароля"), "different");
    await user.click(screen.getByRole("button", { name: "Зарегистрироваться" }));

    expect(screen.getByText("Пароль должен быть не короче 8 символов.")).toBeInTheDocument();
    expect(screen.getByText("Пароли не совпадают.")).toBeInTheDocument();
    expect(registerHandler).not.toHaveBeenCalled();
  });

  it("maps backend detail arrays onto Russian auth field errors", async () => {
    const user = userEvent.setup();
    server.use(
      http.post("*/register", () =>
        HttpResponse.json(
          {
            detail: [{ loc: ["body", "confirm_password"], msg: "Passwords do not match" }],
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
      expect(screen.getByText("Пароли не совпадают.")).toBeInTheDocument();
    });
  });

  it("maps backend register error codes onto Russian field errors", async () => {
    const user = userEvent.setup();
    server.use(
      http.post("*/register", () =>
        HttpResponse.json(
          {
            errors: ["email_invalid", "password_too_short"],
          },
          { status: 422 },
        ),
      ),
    );

    renderAuthScreen();

    await screen.findByRole("heading", { name: "Создать аккаунт" });
    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.type(screen.getByLabelText("Пароль"), "password123");
    await user.type(screen.getByLabelText("Подтверждение пароля"), "password123");
    await user.click(screen.getByRole("button", { name: "Зарегистрироваться" }));

    await waitFor(() => {
      expect(screen.getByText("Введите корректный email.")).toBeInTheDocument();
      expect(screen.getByText("Пароль должен быть не короче 8 символов.")).toBeInTheDocument();
    });
  });

  it("maps object register error codes even when the backend omits field names", async () => {
    const user = userEvent.setup();
    server.use(
      http.post("*/register", () =>
        HttpResponse.json(
          {
            errors: [{ code: "email_invalid" }, { code: "password_mismatch" }],
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
      expect(screen.getByText("Введите корректный email.")).toBeInTheDocument();
      expect(screen.getByText("Пароли не совпадают.")).toBeInTheDocument();
    });
  });

  it.each(["https://evil.test/steal", "//evil.test/steal", "javascript:alert(1)"])(
    "falls back to the workshop when next is unsafe: %s",
    async (next) => {
      const user = userEvent.setup();

      renderAuthScreen(`next=${encodeURIComponent(next)}`);

      await screen.findByRole("heading", { name: "Войти в Plotty" });
      await user.type(screen.getByLabelText("Email"), "writer@plotty.test");
      await user.type(screen.getByLabelText("Пароль"), "password123");
      await user.click(screen.getByRole("button", { name: "Войти" }));

      await waitFor(() => {
        expect(replace).toHaveBeenCalledWith("/write");
      });
    },
  );

  it("allows same-origin relative next URLs", async () => {
    const user = userEvent.setup();

    renderAuthScreen(`next=${encodeURIComponent("/library?x=1#section")}`);

    await screen.findByRole("heading", { name: "Войти в Plotty" });
    await user.type(screen.getByLabelText("Email"), "writer@plotty.test");
    await user.type(screen.getByLabelText("Пароль"), "password123");
    await user.click(screen.getByRole("button", { name: "Войти" }));

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/library?x=1#section");
    });
  });
});
