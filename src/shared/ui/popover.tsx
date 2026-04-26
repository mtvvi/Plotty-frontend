"use client";

import {
  type HTMLAttributes,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/shared/lib/utils";

export interface PopoverPosition {
  left: number;
  top: number;
  width: number;
}

export function usePopover({
  minWidth,
  gutter = 6,
}: {
  minWidth?: number;
  gutter?: number;
} = {}) {
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<PopoverPosition>({ left: 0, top: 0, width: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setOpen((current) => !current);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    previouslyFocusedRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;

      if (!triggerRef.current?.contains(target) && !contentRef.current?.contains(target)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
      previouslyFocusedRef.current?.focus();
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    function syncPosition() {
      const rect = triggerRef.current?.getBoundingClientRect();

      if (!rect) {
        return;
      }

      const viewportPadding = 12;
      const width = minWidth
        ? Math.min(Math.max(rect.width, minWidth), window.innerWidth - viewportPadding * 2)
        : rect.width;

      setPosition({
        left: Math.min(Math.max(viewportPadding, rect.left), window.innerWidth - width - viewportPadding),
        top: rect.bottom + gutter,
        width,
      });
    }

    syncPosition();
    window.addEventListener("resize", syncPosition);
    window.addEventListener("scroll", syncPosition, true);

    return () => {
      window.removeEventListener("resize", syncPosition);
      window.removeEventListener("scroll", syncPosition, true);
    };
  }, [gutter, minWidth, open]);

  return {
    close,
    contentRef,
    mounted,
    open,
    position,
    setOpen,
    toggle,
    triggerRef,
  };
}

export function PopoverContent({
  children,
  className,
  contentRef,
  open,
  position,
  ...props
}: {
  children: ReactNode;
  className?: string;
  contentRef: RefObject<HTMLDivElement | null>;
  open: boolean;
  position: PopoverPosition;
} & HTMLAttributes<HTMLDivElement>) {
  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      ref={contentRef}
      className={cn(
        "z-[100] border border-[var(--plotty-line)] bg-[rgba(251,247,242,0.98)] shadow-[var(--plotty-shadow-soft)] backdrop-blur-xl",
        className,
      )}
      style={{
        position: "fixed",
        left: position.left,
        top: position.top,
        width: position.width,
      }}
      {...props}
    >
      {children}
    </div>,
    document.body,
  );
}
