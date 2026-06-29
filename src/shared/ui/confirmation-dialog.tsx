"use client";

import { type ReactNode, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

import { Button, type ButtonVariant } from "@/shared/ui/button";

export interface ConfirmationDialogProps {
  cancelLabel?: ReactNode;
  confirmLabel: ReactNode;
  confirmVariant?: ButtonVariant;
  description: ReactNode;
  isConfirming?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
  title: ReactNode;
}

export function ConfirmationDialog({
  cancelLabel = "Отмена",
  confirmLabel,
  confirmVariant = "destructive",
  description,
  isConfirming = false,
  onCancel,
  onConfirm,
  open,
  title,
}: ConfirmationDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    previouslyFocusedRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    window.setTimeout(() => confirmButtonRef.current?.focus({ preventScroll: true }), 0);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isConfirming) {
        onCancel();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      previouslyFocusedRef.current?.focus({ preventScroll: true });
    };
  }, [isConfirming, onCancel, open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  function handleCancel() {
    if (!isConfirming) {
      onCancel();
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4 py-6">
      <button
        type="button"
        aria-label="Закрыть подтверждение"
        onClick={handleCancel}
        className="absolute inset-0 bg-[rgba(31,26,22,0.46)]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative z-10 w-full max-w-md rounded-[var(--plotty-radius-lg)] border border-[var(--plotty-line)] bg-[var(--plotty-surface-strong)] p-5 shadow-[var(--plotty-shadow)]"
      >
        <div className="space-y-2">
          <h2 id={titleId} className="plotty-section-title">
            {title}
          </h2>
          <p id={descriptionId} className="text-sm leading-6 text-[var(--plotty-muted)]">
            {description}
          </p>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={handleCancel} disabled={isConfirming}>
            {cancelLabel}
          </Button>
          <Button
            ref={confirmButtonRef}
            type="button"
            variant={confirmVariant}
            onClick={onConfirm}
            isLoading={isConfirming}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
