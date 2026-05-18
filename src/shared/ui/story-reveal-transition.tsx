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
import { useRouter } from "next/navigation";

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
  const reducedMotion = usePrefersReducedMotion();
  const [activeReveal, setActiveReveal] = useState<RevealRequest | null>(null);
  const navigationTimerRef = useRef<number | null>(null);
  const cleanupTimerRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (navigationTimerRef.current !== null) {
      window.clearTimeout(navigationTimerRef.current);
      navigationTimerRef.current = null;
    }

    if (cleanupTimerRef.current !== null) {
      window.clearTimeout(cleanupTimerRef.current);
      cleanupTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const startReveal = useCallback(
    (request: RevealRequest) => {
      clearTimers();

      if (reducedMotion) {
        router.push(request.href);
        return;
      }

      setActiveReveal(request);
      navigationTimerRef.current = window.setTimeout(() => {
        router.push(request.href);
        cleanupTimerRef.current = window.setTimeout(() => setActiveReveal(null), 180);
      }, revealDurationMs);
    },
    [clearTimers, reducedMotion, router],
  );

  const value = useMemo(() => ({ startReveal }), [startReveal]);

  return (
    <StoryRevealContext.Provider value={value}>
      {children}
      {activeReveal ? <StoryRevealOverlay reveal={activeReveal} /> : null}
    </StoryRevealContext.Provider>
  );
}

function StoryRevealOverlay({ reveal }: { reveal: RevealRequest }) {
  return (
    <div className="plotty-story-reveal-overlay" aria-hidden="true">
      <div className="plotty-story-reveal-book">
        <div className="plotty-story-reveal-cover">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {reveal.coverUrl ? <img src={reveal.coverUrl} alt="" /> : null}
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
