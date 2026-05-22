import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import { AuthProvider } from "@/entities/auth/model/auth-context";
import { loginMockUser } from "@/mocks/data/auth";
import { server } from "@/mocks/server";
import { PublicProfileScreen, profileAvatarPlaceholderSrc } from "@/widgets/profile/public-profile-screen";

let currentSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/users/writer",
  useSearchParams: () => currentSearchParams,
}));

function renderPublicProfile(username = "writer") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PublicProfileScreen username={username} />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe("PublicProfileScreen", () => {
  it("edits profile text fields inline instead of opening a full edit form", async () => {
    const user = userEvent.setup();
    currentSearchParams = new URLSearchParams();
    loginMockUser({ email: "writer@plotty.test", password: "password123" });
    let profilePatchPayload: unknown;

    server.use(
      http.patch("*/profile", async ({ request }) => {
        profilePatchPayload = await request.json();

        return HttpResponse.json({
          user: {
            id: 1,
            email: "writer@plotty.test",
            username: "writer_new",
            avatar_url: null,
            bio: "Автор и читатель Plotty.",
            created_at: "2026-03-01T10:00:00.000Z",
            updated_at: "2026-05-19T10:00:00.000Z",
          },
        });
      }),
    );

    renderPublicProfile();

    const heading = await screen.findByRole("heading", { name: "writer" });
    const summaryFrame = heading.closest("[data-profile-summary-frame='true']");

    expect(summaryFrame).not.toBeNull();
    const summary = summaryFrame as HTMLElement;
    expect(summary).toHaveClass("p-0");
    expect(screen.queryByRole("button", { name: "Редактировать" })).not.toBeInTheDocument();
    expect(screen.queryByText("Мой профиль")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Загрузить аватар" })).toHaveClass("h-full", "w-full", "lg:aspect-square", "lg:w-auto", "lg:min-h-full");
    expect(within(summary).getByAltText("Аватар writer")).toHaveAttribute("src", profileAvatarPlaceholderSrc);
    expect(within(summary).getByAltText("Аватар writer")).toHaveClass("aspect-square", "w-full", "lg:w-auto", "lg:min-h-80");
    expect(summary).toHaveClass("h-full", "lg:min-h-80");
    expect(summary.firstElementChild).toHaveClass("h-full", "lg:grid-cols-[auto_minmax(0,1fr)_auto]");

    await user.click(screen.getByRole("button", { name: "Редактировать ник" }));

    const usernameInput = await screen.findByLabelText("Ник");
    expect(usernameInput).toHaveClass("plotty-profile-username-input");
    await user.clear(usernameInput);
    await user.type(usernameInput, "writer_new");
    await user.tab();

    await waitFor(() => expect(profilePatchPayload).toMatchObject({ username: "writer_new" }));
    expect(screen.getByRole("heading", { name: "writer" }).closest("[data-profile-summary-frame='true']")).toBe(
      summaryFrame,
    );
    expect(screen.queryByLabelText("Аватар")).not.toBeInTheDocument();
  });

  it("opens the bio field inline and keeps the avatar change affordance visible", async () => {
    const user = userEvent.setup();
    currentSearchParams = new URLSearchParams();
    loginMockUser({ email: "writer@plotty.test", password: "password123" });

    renderPublicProfile();

    await screen.findByRole("heading", { name: "writer" });

    expect(screen.queryByText("Нажмите, чтобы сменить фото")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Загрузить аватар" }).querySelector("[data-avatar-mobile-plus='true']")).toHaveClass(
      "bg-[rgba(195,79,50,0.82)]",
      "sm:hidden",
    );

    await user.click(screen.getByRole("button", { name: "Редактировать описание" }));

    const bioInput = await screen.findByLabelText("Описание");

    expect(bioInput).toHaveClass("h-24", "max-h-24", "resize-none", "overflow-auto");
  });

  it("shows a retryable works error instead of an empty works state", async () => {
    currentSearchParams = new URLSearchParams();
    server.use(http.get("*/users/:username/stories", () => HttpResponse.json({ error: "works unavailable" }, { status: 500 })));

    renderPublicProfile();

    expect(await screen.findByText("Работы недоступны")).toBeInTheDocument();
    expect(screen.queryByText("Работ пока нет")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Повторить" })).toBeInTheDocument();
  });

  it("shows a retryable collections error instead of an empty collections state", async () => {
    currentSearchParams = new URLSearchParams("tab=collections");
    server.use(http.get("*/users/:username/collections", () => HttpResponse.json({ error: "collections unavailable" }, { status: 500 })));

    renderPublicProfile();

    expect(await screen.findByText("Подборки недоступны")).toBeInTheDocument();
    expect(screen.queryByText("Публичных подборок пока нет")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Повторить" })).toBeInTheDocument();
  });

  it("shows AI credits only on the viewer's own profile", async () => {
    currentSearchParams = new URLSearchParams();
    loginMockUser({ email: "writer@plotty.test", password: "password123" });

    renderPublicProfile("writer");

    expect(await screen.findByText("AI-кредиты")).toBeInTheDocument();
    expect(screen.getByText("50 кредитов")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /пополнить баланс/i })).toHaveAttribute("href", "/credits");
  });

  it("does not show AI credits on another user's public profile", async () => {
    currentSearchParams = new URLSearchParams();
    loginMockUser({ email: "writer@plotty.test", password: "password123" });

    renderPublicProfile("reader_one");

    await screen.findByRole("heading", { name: "reader_one" });
    expect(screen.queryByText("AI-кредиты")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /пополнить баланс/i })).not.toBeInTheDocument();
  });
});
