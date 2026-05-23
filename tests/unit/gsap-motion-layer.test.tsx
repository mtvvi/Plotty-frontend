import { renderHook, act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getGsapMotionPlugins, registerPlottyGsapPlugins, useReducedMotion } from "@/shared/lib/gsap-motion";

function installMatchMedia(matches: boolean) {
  let listener: ((event: MediaQueryListEvent) => void) | null = null;

  vi.stubGlobal("matchMedia", (query: string) => ({
    addEventListener: (_type: string, callback: (event: MediaQueryListEvent) => void) => {
      listener = callback;
    },
    matches,
    media: query,
    removeEventListener: () => {
      listener = null;
    },
  }));

  return {
    setMatches(nextMatches: boolean) {
      act(() => {
        listener?.({ matches: nextMatches } as MediaQueryListEvent);
      });
    },
  };
}

describe("GSAP motion layer", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("registers the Plotty GSAP plugin set once and exposes available plugins", () => {
    registerPlottyGsapPlugins();
    registerPlottyGsapPlugins();

    expect(getGsapMotionPlugins()).toMatchObject({
      draggable: true,
      flip: true,
      scrollTrigger: true,
      splitText: true,
    });
  });

  it("tracks prefers-reduced-motion so decorative timelines can opt out", () => {
    const media = installMatchMedia(true);
    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(true);

    media.setMatches(false);

    expect(result.current).toBe(false);
  });
});
