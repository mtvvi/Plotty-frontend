import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAuth } from "@/entities/auth/model/auth-context";
import { AuthStatus } from "@/widgets/auth/auth-status";
import { profileAvatarPlaceholderSrc } from "@/widgets/profile/profile-avatar-placeholder";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ back: vi.fn(), push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/entities/auth/model/auth-context", () => ({
  useAuth: vi.fn(),
}));

function renderAuthStatus() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthStatus variant="compact" />
    </QueryClientProvider>,
  );
}

describe("AuthStatus", () => {
  it("keeps the compact email line-height roomy enough for descenders", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 1,
        email: "ilya@gmail.com",
        username: "ilyaa",
        avatarUrl: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      isAuthenticated: true,
      isLoading: false,
      isError: false,
    });

    renderAuthStatus();

    expect(screen.getByText("ilya@gmail.com")).toHaveClass("leading-[1.35]");
    expect(screen.getByAltText("Аватар ilyaa")).toHaveAttribute("src", profileAvatarPlaceholderSrc);
  });
});
