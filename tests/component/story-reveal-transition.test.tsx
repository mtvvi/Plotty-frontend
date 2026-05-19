import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { StoryRevealButtonLink, StoryRevealProvider } from "@/shared/ui/story-reveal-transition";

const push = vi.fn();
let currentPathname = "/stories/after-midnight-the-snow-does-not-melt";

vi.mock("next/navigation", () => ({
  usePathname: () => currentPathname,
  useRouter: () => ({ push }),
}));

function renderRevealLink() {
  return (
    <StoryRevealProvider>
      <StoryRevealButtonLink
        href="/stories/after-midnight-the-snow-does-not-melt/chapters/1"
        revealTitle="Chapter one"
      >
        Read
      </StoryRevealButtonLink>
    </StoryRevealProvider>
  );
}

describe("StoryRevealProvider", () => {
  afterEach(() => {
    vi.useRealTimers();
    push.mockReset();
    currentPathname = "/stories/after-midnight-the-snow-does-not-melt";
  });

  it("starts chapter navigation immediately while keeping the reveal visible until route commit", async () => {
    vi.useFakeTimers();

    const view = render(renderRevealLink());

    fireEvent.click(screen.getByRole("link", { name: "Read" }), { button: 0 });

    expect(push).toHaveBeenCalledWith("/stories/after-midnight-the-snow-does-not-melt/chapters/1");
    expect(document.querySelector(".plotty-story-reveal-overlay")).not.toBeNull();

    act(() => vi.advanceTimersByTime(940));
    expect(document.querySelector(".plotty-story-reveal-overlay")).not.toBeNull();

    await act(async () => {
      currentPathname = "/stories/after-midnight-the-snow-does-not-melt/chapters/1";
      view.rerender(renderRevealLink());
    });

    expect(document.querySelector(".plotty-story-reveal-overlay")).toBeNull();
  });
});
