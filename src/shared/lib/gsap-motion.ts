"use client";

import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { Draggable } from "gsap/Draggable";
import { Flip } from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

import { getPrefersReducedMotion, useReducedMotion } from "./motion-preferences";

type GsapTarget = gsap.TweenTarget;
type GsapTimeline = gsap.core.Timeline;

let pluginsRegistered = false;

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
const isTestEnvironment = process.env.NODE_ENV === "test";

export { Draggable, Flip, ScrollTrigger, SplitText, gsap, useGSAP };
export { getPrefersReducedMotion, useReducedMotion };

export function registerPlottyGsapPlugins() {
  if (pluginsRegistered) {
    return;
  }

  ensureMatchMediaForGsap();
  gsap.registerPlugin(useGSAP, Flip, Draggable, SplitText);

  if (!isTestEnvironment && typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
    gsap.registerPlugin(ScrollTrigger);
  }
  pluginsRegistered = true;
}

function ensureMatchMediaForGsap() {
  if (typeof window === "undefined" || typeof window.matchMedia === "function") {
    return;
  }

  window.matchMedia = (query: string) =>
    ({
      addEventListener: () => undefined,
      addListener: () => undefined,
      dispatchEvent: () => false,
      matches: false,
      media: query,
      onchange: null,
      removeEventListener: () => undefined,
      removeListener: () => undefined,
    }) as MediaQueryList;
}

export function getGsapMotionPlugins() {
  registerPlottyGsapPlugins();

  return {
    draggable: Boolean(Draggable),
    flip: Boolean(Flip),
    scrollTrigger: Boolean(ScrollTrigger),
    splitText: Boolean(SplitText),
  };
}

export function animateGsapPresence(target: GsapTarget, options?: { y?: number; duration?: number; delay?: number }) {
  registerPlottyGsapPlugins();

  return gsap.fromTo(
    target,
    {
      clipPath: "inset(0 0 10% 0 round 18px)",
      opacity: 0,
      y: options?.y ?? 10,
    },
    {
      clipPath: "inset(0 0 0% 0 round 18px)",
      clearProps: "clipPath,transform,opacity",
      delay: options?.delay ?? 0,
      duration: options?.duration ?? 0.34,
      ease: "power3.out",
      y: 0,
      opacity: 1,
    },
  );
}

export function useGsapPresence<TElement extends HTMLElement>(
  ref: RefObject<TElement | null>,
  deps: unknown[],
  options?: { y?: number; duration?: number; delay?: number },
) {
  const reducedMotion = useReducedMotion();

  useIsomorphicLayoutEffect(() => {
    const node = ref.current;

    if (!node || reducedMotion || isTestEnvironment) {
      return;
    }

    const tween = animateGsapPresence(node, options);

    return () => {
      tween.kill();
    };
  }, [reducedMotion, ref, ...deps]);
}

export function useGsapIntro<TElement extends HTMLElement>(
  ref: RefObject<TElement | null>,
  deps: unknown[] = [],
  options?: { selector?: string; y?: number; stagger?: number; duration?: number },
) {
  const reducedMotion = useReducedMotion();

  useIsomorphicLayoutEffect(() => {
    const node = ref.current;

    if (!node || reducedMotion || isTestEnvironment) {
      return;
    }

    registerPlottyGsapPlugins();

    const targets = options?.selector
      ? Array.from(node.querySelectorAll<HTMLElement>(options.selector))
      : [node];
    const timeline = gsap.timeline();

    timeline.fromTo(
      targets,
      { opacity: 0, y: options?.y ?? 12 },
      {
        clearProps: "transform,opacity",
        duration: options?.duration ?? 0.38,
        ease: "power3.out",
        stagger: options?.stagger ?? 0.045,
        y: 0,
        opacity: 1,
      },
    );

    return () => {
      timeline.kill();
    };
  }, [reducedMotion, ref, ...deps]);
}

export function useGsapFlipList<TElement extends HTMLElement>(
  ref: RefObject<TElement | null>,
  key: string,
  options?: { selector?: string; stagger?: number; duration?: number },
) {
  const reducedMotion = useReducedMotion();
  const previousStateRef = useRef<Flip.FlipState | null>(null);
  const timelineRef = useRef<GsapTimeline | null>(null);

  useIsomorphicLayoutEffect(() => {
    const node = ref.current;

    if (!node) {
      previousStateRef.current = null;
      return;
    }

    const selector = options?.selector ?? "[data-gsap-flip-id]";
    const targets = Array.from(node.querySelectorAll<HTMLElement>(selector));

    timelineRef.current?.kill();

    if (reducedMotion || isTestEnvironment) {
      previousStateRef.current = null;
      return;
    }

    registerPlottyGsapPlugins();

    if (previousStateRef.current && targets.length) {
      timelineRef.current = Flip.from(previousStateRef.current, {
        absolute: false,
        duration: options?.duration ?? 0.42,
        ease: "power3.out",
        nested: true,
        prune: true,
        stagger: options?.stagger ?? 0.025,
      });
    } else if (targets.length) {
      timelineRef.current = gsap.timeline().fromTo(
        targets,
        { opacity: 0, y: 14, scale: 0.985 },
        {
          clearProps: "transform,opacity",
          duration: options?.duration ?? 0.36,
          ease: "power3.out",
          stagger: options?.stagger ?? 0.035,
          y: 0,
          opacity: 1,
          scale: 1,
        },
      );
    }

    previousStateRef.current = targets.length ? Flip.getState(targets) : null;

    return () => {
      timelineRef.current?.kill();
      timelineRef.current = null;
    };
  }, [key, options?.duration, options?.selector, options?.stagger, reducedMotion, ref]);
}

export function useGsapCounter<TElement extends HTMLElement>(
  ref: RefObject<TElement | null>,
  value: number | null,
  formatter: (value: number) => string,
) {
  const reducedMotion = useReducedMotion();

  useIsomorphicLayoutEffect(() => {
    const node = ref.current;

    if (!node || value === null) {
      return;
    }

    if (reducedMotion || isTestEnvironment) {
      node.textContent = formatter(value);
      return;
    }

    registerPlottyGsapPlugins();

    const state = { value: 0 };
    const tween = gsap.to(state, {
      duration: 0.72,
      ease: "power3.out",
      onUpdate: () => {
        node.textContent = formatter(Math.round(state.value));
      },
      value,
    });

    return () => {
      tween.kill();
    };
  }, [formatter, reducedMotion, ref, value]);
}
