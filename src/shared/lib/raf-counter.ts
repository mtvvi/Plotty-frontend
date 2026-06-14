"use client";

import { useEffect, type RefObject } from "react";

import { getPrefersReducedMotion } from "./motion-preferences";

export function useRafCounter(
  ref: RefObject<HTMLElement | null>,
  value: number | null | undefined,
  formatter: (value: number) => string,
  options?: { durationMs?: number },
) {
  useEffect(() => {
    const node = ref.current;

    if (!node || typeof value !== "number" || !Number.isFinite(value)) {
      return;
    }

    const targetValue = value;
    const durationMs = options?.durationMs ?? 520;
    const currentValue = Number.parseFloat(node.dataset.rafCounterValue ?? "");
    const startValue = Number.isFinite(currentValue) ? currentValue : targetValue;

    function write(nextValue: number) {
      if (!node) {
        return;
      }

      const roundedValue = Math.round(nextValue);
      node.textContent = formatter(roundedValue);
      node.dataset.rafCounterValue = String(roundedValue);
    }

    if (getPrefersReducedMotion() || durationMs <= 0 || startValue === targetValue) {
      write(targetValue);
      return;
    }

    const startedAt = window.performance.now();
    let frameId = 0;

    function tick(now: number) {
      const progress = Math.min(1, (now - startedAt) / durationMs);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const nextValue = startValue + (targetValue - startValue) * easedProgress;

      write(nextValue);

      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick);
      }
    }

    frameId = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(frameId);
  }, [formatter, options?.durationMs, ref, value]);
}
