import { useState } from "react";
import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Sheet } from "@/shared/ui/sheet";

const initialScrollYDescriptor = Object.getOwnPropertyDescriptor(window, "scrollY");
const sheetExitMs = 260;

function SheetHarness() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open filters
      </button>
      <Sheet open={open} title="Filters" closeLabel="Close" onClose={() => setOpen(false)}>
        <button type="button">Bottom filter</button>
      </Sheet>
    </>
  );
}

describe("Sheet", () => {
  beforeEach(() => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
  });

  afterEach(() => {
    cleanup();

    if (initialScrollYDescriptor) {
      Object.defineProperty(window, "scrollY", initialScrollYDescriptor);
    }

    document.body.removeAttribute("style");
    vi.restoreAllMocks();
  });

  it("locks body scroll at the current page position and restores it on close", async () => {
    const user = userEvent.setup();
    const scrollTo = vi.mocked(window.scrollTo);

    Object.defineProperty(window, "scrollY", { configurable: true, value: 640 });

    render(<SheetHarness />);

    const trigger = screen.getByRole("button", { name: "Open filters" });
    await user.click(trigger);

    const dialog = await screen.findByRole("dialog", { name: "Filters" });

    expect(document.body).toHaveStyle({
      overflow: "hidden",
      position: "fixed",
      top: "-640px",
      width: "100%",
    });

    await user.click(within(dialog).getByRole("button", { name: "Close" }));

    expect(dialog).toHaveAttribute("data-state", "closing");
    await act(() => new Promise((resolve) => window.setTimeout(resolve, sheetExitMs + 20)));

    expect(scrollTo).toHaveBeenCalledWith(0, 640);
    expect(trigger).toHaveFocus();
  });

  it("leaves enough scroll room below content for the mobile bottom navigation", () => {
    render(
      <Sheet open title="Filters" closeLabel="Close" onClose={() => undefined}>
        <button type="button">Bottom filter</button>
      </Sheet>,
    );

    const dialog = screen.getByRole("dialog", { name: "Filters" });

    expect(dialog).toHaveClass("overflow-y-auto", "overscroll-contain");
    expect(dialog.className).toContain("pb-[calc(6.75rem+env(safe-area-inset-bottom))]");
  });

  it("renders outside animated page content so fixed positioning stays viewport-based", () => {
    render(
      <div data-testid="animated-page" className="plotty-page-enter">
        <Sheet open title="Filters" closeLabel="Close" onClose={() => undefined}>
          <button type="button">Bottom filter</button>
        </Sheet>
      </div>,
    );

    expect(screen.getByRole("dialog", { name: "Filters" }).closest("[data-testid='animated-page']")).toBeNull();
  });

  it("slides in from the bottom and stays mounted for the close animation", async () => {
    const user = userEvent.setup();

    render(<SheetHarness />);

    await user.click(screen.getByRole("button", { name: "Open filters" }));

    const dialog = await screen.findByRole("dialog", { name: "Filters" });

    expect(dialog).toHaveClass("plotty-mobile-sheet-panel");
    expect(dialog).toHaveAttribute("data-state", "open");

    await user.click(within(dialog).getByRole("button", { name: "Close" }));

    expect(screen.getByRole("dialog", { name: "Filters" })).toHaveAttribute("data-state", "closing");

    await act(() => new Promise((resolve) => window.setTimeout(resolve, sheetExitMs + 20)));

    expect(screen.queryByRole("dialog", { name: "Filters" })).not.toBeInTheDocument();
  });
});
