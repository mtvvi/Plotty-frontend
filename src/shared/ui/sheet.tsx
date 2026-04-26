"use client";

import { type ReactNode, useEffect, useId, useRef } from "react";

import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

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
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    previouslyFocusedRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => closeButtonRef.current?.focus(), 0);

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
      previouslyFocusedRef.current?.focus();
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label={closeLabel}
        onClick={onClose}
        className="absolute inset-0 bg-[rgba(31,26,22,0.4)] backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={cn(
          "absolute inset-x-0 bottom-0 max-h-[86vh] overflow-y-auto rounded-t-[var(--plotty-radius-xl)] border border-[var(--plotty-line)] bg-[rgba(251,247,242,0.98)] p-5 shadow-[var(--plotty-shadow)] backdrop-blur-xl",
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
            <Button ref={closeButtonRef} type="button" variant="secondary" size="sm" onClick={onClose}>
              {closeLabel}
            </Button>
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}
