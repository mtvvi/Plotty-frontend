import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PlottyAppChrome, PlottyPageShell } from "@/widgets/layout/plotty-page-shell";

const navigationMock = vi.hoisted(() => ({
  pathname: "/write",
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => navigationMock.pathname,
  useSearchParams: () => new URLSearchParams(),
}));

describe("PlottyPageShell", () => {
  it("does not render the removed mobile back flow even when legacy props are passed", () => {
    const LegacyShell = PlottyPageShell as React.ComponentType<React.PropsWithChildren<Record<string, unknown>>>;

    render(
      <LegacyShell suppressPageIntro desktopHeaderActions={<div />} showMobileBack mobileBackHref="/library">
        <div>content</div>
      </LegacyShell>,
    );

    expect(screen.queryByLabelText("Назад")).not.toBeInTheDocument();
  });

  it("renders the reading shelf in the primary navigation", () => {
    render(
      <PlottyPageShell suppressPageIntro desktopHeaderActions={<div />}>
        <div>content</div>
      </PlottyPageShell>,
    );

    const primaryNav = screen.getByRole("navigation", { name: "Основная навигация" });

    expect(within(primaryNav).getByRole("link", { name: "Моя полка" })).toHaveAttribute("href", "/library");
  });

  it("marks a clicked desktop nav item active before the route pathname changes without a spinner", async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient();
    navigationMock.pathname = "/";

    render(
      <QueryClientProvider client={queryClient}>
        <PlottyAppChrome>
          <div>content</div>
        </PlottyAppChrome>
      </QueryClientProvider>,
    );

    const primaryNav = screen.getByRole("navigation", { name: "Primary navigation" });
    const workshopLink = within(primaryNav).getByRole("link", { name: "Мастерская" });

    expect(workshopLink).not.toHaveClass("text-[var(--plotty-accent)]");

    await user.click(workshopLink);

    expect(workshopLink).toHaveClass("text-[var(--plotty-accent)]");
    expect(within(workshopLink).queryByRole("status")).not.toBeInTheDocument();
  });

  it("marks a clicked mobile bottom nav item active before the route pathname changes", async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient();
    navigationMock.pathname = "/";

    render(
      <QueryClientProvider client={queryClient}>
        <PlottyAppChrome>
          <div>content</div>
        </PlottyAppChrome>
      </QueryClientProvider>,
    );

    const bottomNav = screen.getByRole("navigation", { name: "Нижняя навигация" });
    const libraryLink = within(bottomNav).getByRole("link", { name: "Моя полка" });

    expect(libraryLink).not.toHaveClass("text-[var(--plotty-accent)]");

    await user.click(libraryLink);

    expect(libraryLink).toHaveClass("text-[var(--plotty-accent)]");
    expect(libraryLink).toHaveAttribute("aria-current", "page");
  });
});
