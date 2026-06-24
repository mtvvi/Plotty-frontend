import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RouteProgressBar } from "@/shared/ui/route-progress-bar";

let currentPathname = "/";
let currentSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  usePathname: () => currentPathname,
  useSearchParams: () => currentSearchParams,
}));

describe("RouteProgressBar", () => {
  beforeEach(() => {
    currentPathname = "/";
    currentSearchParams = new URLSearchParams();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows progress for internal page changes and hides after the route commits", async () => {
    const { rerender } = render(
      <>
        <a href="/library" onClick={(event) => event.preventDefault()}>Моя полка</a>
        <RouteProgressBar />
      </>,
    );

    const progress = document.querySelector(".plotty-route-progress");

    expect(progress).toHaveAttribute("data-state", "idle");

    fireEvent.click(document.querySelector("a") as HTMLAnchorElement, { button: 0 });

    expect(progress).toHaveAttribute("data-state", "loading");

    currentPathname = "/library";
    rerender(
      <>
        <a href="/library" onClick={(event) => event.preventDefault()}>Моя полка</a>
        <RouteProgressBar />
      </>,
    );

    expect(progress).toHaveAttribute("data-state", "finishing");

    act(() => {
      vi.advanceTimersByTime(320);
    });

    expect(progress).toHaveAttribute("data-state", "idle");
  });

  it("does not leave progress loading for no-op browser history events", () => {
    render(<RouteProgressBar />);

    const progress = document.querySelector(".plotty-route-progress");

    expect(progress).toHaveAttribute("data-state", "idle");

    fireEvent.popState(window);

    expect(progress).toHaveAttribute("data-state", "idle");
  });
});
