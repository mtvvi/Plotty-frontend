"use client";

import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

const sheetExitMs = 260;
type SheetMotionState = "open" | "closing" | "closed";

export function Sheet({
  children,
  className,
  closeLabel = "Close",
  labelledBy,
  onClose,
  open,
  title,
}: {
  children: ReactNode;
  className?: string;
  closeLabel?: string;
  labelledBy?: string;
  onClose: () => void;
  open: boolean;
  title?: ReactNode;
}) {
  const generatedTitleId = useId();
  const titleId = labelledBy ?? generatedTitleId;
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(() =>
    typeof document === "undefined" ? null : document.body,
  );
  const [isMounted, setIsMounted] = useState(open);
  const [motionState, setMotionState] = useState<SheetMotionState>(open ? "open" : "closed");
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!portalRoot) {
      setPortalRoot(document.body);
    }
  }, [portalRoot]);

  useEffect(() => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    if (open) {
      setIsMounted(true);
      setMotionState("open");
      return;
    }

    if (!isMounted) {
      setMotionState("closed");
      return;
    }

    setMotionState("closing");
    closeTimeoutRef.current = window.setTimeout(() => {
      setIsMounted(false);
      setMotionState("closed");
      closeTimeoutRef.current = null;
    }, sheetExitMs);

    return () => {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
    };
  }, [isMounted, open]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isMounted) {
      return;
    }

    const scrollY = window.scrollY;
    previouslyFocusedRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const previousOverflow = document.body.style.overflow;
    const previousPosition = document.body.style.position;
    const previousTop = document.body.style.top;
    const previousWidth = document.body.style.width;

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.position = previousPosition;
      document.body.style.top = previousTop;
      document.body.style.width = previousWidth;
      if (scrollY > 0) {
        window.scrollTo(0, scrollY);
      }
      window.removeEventListener("keydown", handleEscape);
      previouslyFocusedRef.current?.focus({ preventScroll: true });
    };
  }, [isMounted, onClose]);

  if (!isMounted) {
    return null;
  }

  if (!portalRoot) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label={closeLabel}
        onClick={onClose}
        data-state={motionState}
        className="plotty-mobile-sheet-overlay absolute inset-0 bg-[rgba(31,26,22,0.46)]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        data-state={motionState}
        className={cn(
          "plotty-mobile-sheet-panel absolute inset-x-0 bottom-0 max-h-[86vh] overflow-y-auto overscroll-contain rounded-t-[var(--plotty-radius-xl)] border border-[var(--plotty-line)] bg-[var(--plotty-surface-strong)] px-5 pt-5 pb-[calc(6.75rem+env(safe-area-inset-bottom))] shadow-[var(--plotty-shadow)]",
          className,
        )}
      >
        {(title || closeLabel) ? (
          <div className="mb-4 flex items-center justify-between gap-3">
            {title ? (
              <h2 id={titleId} className="plotty-section-title">
                {title}
              </h2>
            ) : (
              <span />
            )}
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              {closeLabel}
            </Button>
          </div>
        ) : null}
        {children}
      </div>
    </div>,
    portalRoot,
  );
}
