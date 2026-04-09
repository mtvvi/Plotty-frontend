import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PlottyPageShell } from "@/widgets/layout/plotty-page-shell";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/write",
}));

describe("PlottyPageShell", () => {
  it("does not render the mobile back button by default", () => {
    render(
      <PlottyPageShell suppressPageIntro desktopHeaderActions={<div />}>
        <div>content</div>
      </PlottyPageShell>,
    );

    expect(screen.queryByLabelText("Назад")).not.toBeInTheDocument();
  });

  it("renders the mobile back button when requested", () => {
    render(
      <PlottyPageShell suppressPageIntro showMobileBack desktopHeaderActions={<div />}>
        <div>content</div>
      </PlottyPageShell>,
    );

    expect(screen.getByLabelText("Назад")).toBeInTheDocument();
  });
});
