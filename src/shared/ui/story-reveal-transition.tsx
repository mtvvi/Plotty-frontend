"use client";

import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from "react";
import Link, { type LinkProps } from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { sanitizeImageUrl } from "@/shared/lib/safe-url";
import { useGsapIntro } from "@/shared/lib/gsap-motion";
import { buttonClassName, type ButtonSize, type ButtonVariant } from "@/shared/ui/button";

type RevealRequest = {
  coverUrl?: string;
  href: string;
  title?: string;
};

type StoryRevealContextValue = {
  startReveal: (request: RevealRequest) => void;
};

const StoryRevealContext = createContext<StoryRevealContextValue | null>(null);
const revealDurationMs = 760;
const revealCleanupDelayMs = revealDurationMs + 180;
const revealFallbackCleanupDelayMs = 6_000;

function usePrefersReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      return;
    }

    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);

    update();
    query.addEventListener("change", update);

    return () => query.removeEventListener("change", update);
  }, []);

  return reducedMotion;
}

export function StoryRevealProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const reducedMotion = usePrefersReducedMotion();
  const [activeReveal, setActiveReveal] = useState<RevealRequest | null>(null);
  const [revealTargetPathname, setRevealTargetPathname] = useState<string | null>(null);
  const [revealMinimumElapsed, setRevealMinimumElapsed] = useState(false);
  const minimumTimerRef = useRef<number | null>(null);
  const fallbackTimerRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (minimumTimerRef.current !== null) {
      window.clearTimeout(minimumTimerRef.current);
      minimumTimerRef.current = null;
    }

    if (fallbackTimerRef.current !== null) {
      window.clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const finishReveal = useCallback(() => {
    clearTimers();
    setActiveReveal(null);
    setRevealTargetPathname(null);
    setRevealMinimumElapsed(false);
  }, [clearTimers]);

  useEffect(() => {
    if (!activeReveal || !revealMinimumElapsed || !revealTargetPathname) {
      return;
    }

    if (pathname === revealTargetPathname) {
      finishReveal();
    }
  }, [activeReveal, finishReveal, pathname, revealMinimumElapsed, revealTargetPathname]);

  const startReveal = useCallback(
    (request: RevealRequest) => {
      clearTimers();
      setRevealMinimumElapsed(false);

      if (reducedMotion) {
        router.push(request.href);
        return;
      }

      setActiveReveal(request);
      setRevealTargetPathname(resolveRevealPathname(request.href));
      router.push(request.href);
      minimumTimerRef.current = window.setTimeout(() => setRevealMinimumElapsed(true), revealCleanupDelayMs);
      fallbackTimerRef.current = window.setTimeout(finishReveal, revealFallbackCleanupDelayMs);
    },
    [clearTimers, finishReveal, reducedMotion, router],
  );

  const value = useMemo(() => ({ startReveal }), [startReveal]);

  return (
    <StoryRevealContext.Provider value={value}>
      {children}
      {activeReveal ? <StoryRevealOverlay reveal={activeReveal} /> : null}
    </StoryRevealContext.Provider>
  );
}

function resolveRevealPathname(href: string) {
  try {
    return new URL(href, window.location.href).pathname;
  } catch {
    return href.split(/[?#]/, 1)[0] || "/";
  }
}

function StoryRevealOverlay({ reveal }: { reveal: RevealRequest }) {
  const safeCoverUrl = sanitizeImageUrl(reveal.coverUrl);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  useGsapIntro(overlayRef, [reveal.href], {
    selector: "[data-gsap-intro-item='story-reveal']",
    stagger: 0.06,
    y: 18,
  });

  return (
    <div ref={overlayRef} className="plotty-story-reveal-overlay" data-gsap-intro="story-reveal" aria-hidden="true">
      <div className="plotty-story-reveal-book" data-gsap-intro-item="story-reveal">
        <div className="plotty-story-reveal-cover">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {safeCoverUrl ? <img src={safeCoverUrl} alt="" /> : null}
          <div className="plotty-story-reveal-cover-vignette" />
          {reveal.title ? <div className="plotty-story-reveal-cover-title">{reveal.title}</div> : null}
        </div>
      </div>
    </div>
  );
}

type StoryRevealButtonLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    fullWidth?: boolean;
    revealCoverUrl?: string | null;
    revealTitle?: string;
    size?: ButtonSize;
    variant?: ButtonVariant;
  };

export const StoryRevealButtonLink = forwardRef<HTMLAnchorElement, StoryRevealButtonLinkProps>(
  function StoryRevealButtonLink(
    {
      children,
      className,
      fullWidth,
      href,
      onClick,
      revealCoverUrl,
      revealTitle,
      size = "md",
      target,
      variant = "secondary",
      ...props
    },
    ref,
  ) {
    const revealContext = useContext(StoryRevealContext);
    const hrefString = typeof href === "string" ? href : "";

    function handleClick(event: MouseEvent<HTMLAnchorElement>) {
      onClick?.(event);

      if (
        event.defaultPrevented ||
        !revealContext ||
        !hrefString ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.shiftKey ||
        target === "_blank" ||
        props.download
      ) {
        return;
      }

      event.preventDefault();
      revealContext.startReveal({
        coverUrl: revealCoverUrl ?? undefined,
        href: hrefString,
        title: revealTitle,
      });
    }

    return (
      <Link
        ref={ref}
        href={href}
        target={target}
        data-plotty-button="true"
        data-variant={variant}
        className={buttonClassName({ variant, size, fullWidth, className })}
        onClick={handleClick}
        {...props}
      >
        {children}
      </Link>
    );
  },
);

type StoryRevealLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    revealCoverUrl?: string | null;
    revealTitle?: string;
  };

export const StoryRevealLink = forwardRef<HTMLAnchorElement, StoryRevealLinkProps>(
  function StoryRevealLink({ href, onClick, revealCoverUrl, revealTitle, target, ...props }, ref) {
    const revealContext = useContext(StoryRevealContext);
    const hrefString = typeof href === "string" ? href : "";

    function handleClick(event: MouseEvent<HTMLAnchorElement>) {
      onClick?.(event);

      if (
        event.defaultPrevented ||
        !revealContext ||
        !hrefString ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.shiftKey ||
        target === "_blank" ||
        props.download
      ) {
        return;
      }

      event.preventDefault();
      revealContext.startReveal({
        coverUrl: revealCoverUrl ?? undefined,
        href: hrefString,
        title: revealTitle,
      });
    }

    return <Link ref={ref} href={href} target={target} onClick={handleClick} {...props} />;
  },
);
