"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type ProgressState = "idle" | "loading" | "finishing";

const routeProgressStart = 0.08;
const routeProgressSlowCap = 0.94;
const routeProgressFinishMs = 260;
const routeProgressSafetyMs = 60000;

function isModifiedClick(event: MouseEvent) {
  return event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0;
}

function isSameDocumentNavigation(url: URL) {
  return url.pathname === window.location.pathname && url.search === window.location.search;
}

function getWindowRouteKey() {
  return `${window.location.pathname}?${new URLSearchParams(window.location.search).toString()}`;
}

function getAnchorFromEvent(event: MouseEvent) {
  const target = event.target;

  return target instanceof Element ? target.closest<HTMLAnchorElement>("a[href]") : null;
}

function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - value, 3);
}

function easeOutQuad(value: number) {
  return 1 - (1 - value) * (1 - value);
}

function clampProgress(value: number) {
  return Math.min(routeProgressSlowCap, Math.max(routeProgressStart, value));
}

function getTrickleProgress(elapsedMs: number) {
  if (elapsedMs < 1200) {
    return routeProgressStart + 0.34 * easeOutCubic(elapsedMs / 1200);
  }

  if (elapsedMs < 5000) {
    return 0.42 + 0.36 * easeOutQuad((elapsedMs - 1200) / 3800);
  }

  return 0.78 + 0.16 * (1 - Math.exp(-(elapsedMs - 5000) / 7000));
}

export function RouteProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const previousRouteKeyRef = useRef(routeKey);
  const barRef = useRef<HTMLDivElement | null>(null);
  const idleTimeoutRef = useRef<number | null>(null);
  const safetyTimeoutRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const [state, setState] = useState<ProgressState>("idle");

  const setProgress = useCallback((value: number) => {
    barRef.current?.style.setProperty("--plotty-route-progress-value", value.toFixed(4));
  }, []);

  const clearTimers = useCallback(() => {
    if (idleTimeoutRef.current !== null) {
      window.clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = null;
    }

    if (safetyTimeoutRef.current !== null) {
      window.clearTimeout(safetyTimeoutRef.current);
      safetyTimeoutRef.current = null;
    }

    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const finish = useCallback(() => {
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    setProgress(1);
    setState((current) => (current === "idle" ? current : "finishing"));

    if (idleTimeoutRef.current !== null) {
      window.clearTimeout(idleTimeoutRef.current);
    }

    idleTimeoutRef.current = window.setTimeout(() => {
      setState("idle");
      idleTimeoutRef.current = null;
      setProgress(0);
    }, routeProgressFinishMs);
  }, [setProgress]);

  const start = useCallback(() => {
    clearTimers();
    startedAtRef.current = window.performance.now();
    setProgress(routeProgressStart);
    setState("loading");

    function tick(now: number) {
      const elapsedMs = now - startedAtRef.current;

      setProgress(clampProgress(getTrickleProgress(elapsedMs)));
      frameRef.current = window.requestAnimationFrame(tick);
    }

    frameRef.current = window.requestAnimationFrame(tick);
    safetyTimeoutRef.current = window.setTimeout(finish, routeProgressSafetyMs);
  }, [clearTimers, finish, setProgress]);

  useEffect(() => {
    const previousRouteKey = previousRouteKeyRef.current;

    if (previousRouteKey === routeKey) {
      return;
    }

    previousRouteKeyRef.current = routeKey;
    finish();
  }, [finish, routeKey]);

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (event.defaultPrevented || isModifiedClick(event)) {
        return;
      }

      const anchor = getAnchorFromEvent(event);

      if (!anchor || (anchor.target && anchor.target !== "_self") || anchor.hasAttribute("download")) {
        return;
      }

      let url: URL;

      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin || isSameDocumentNavigation(url)) {
        return;
      }

      start();
    }

    function handlePopState() {
      const nextRouteKey = getWindowRouteKey();

      if (nextRouteKey === previousRouteKeyRef.current) {
        finish();
        return;
      }

      start();
    }

    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted) {
        finish();
      }
    }

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("click", handleDocumentClick, true);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("click", handleDocumentClick, true);
      clearTimers();
    };
  }, [clearTimers, finish, start]);

  return (
    <div className="plotty-route-progress" data-state={state} aria-hidden="true">
      <div ref={barRef} className="plotty-route-progress-bar" />
    </div>
  );
}
