"use client";

import { useEffect, useRef, useState, type ButtonHTMLAttributes, type CSSProperties, type HTMLAttributes } from "react";

import { cn } from "@/shared/lib/utils";

interface TabButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean;
}

interface SegmentedControlProps extends HTMLAttributes<HTMLDivElement> {
  layout?: "inline" | "mobileGrid";
}

export function SegmentedControl({ children, className, layout = "inline", ...props }: SegmentedControlProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<CSSProperties>({ opacity: 0, width: 0 });
  const showIndicator = layout === "inline";

  useEffect(() => {
    if (!showIndicator) {
      return;
    }

    const container = containerRef.current;

    if (!container) {
      return;
    }

    function updateIndicator() {
      const currentContainer = containerRef.current;

      if (!currentContainer) {
        setIndicatorStyle({ opacity: 0, width: 0 });
        return;
      }

      const activeTab = currentContainer.querySelector<HTMLElement>("[data-active='true']");

      if (!activeTab) {
        setIndicatorStyle({ opacity: 0, width: 0 });
        return;
      }

      const containerRect = currentContainer.getBoundingClientRect();
      const activeRect = activeTab.getBoundingClientRect();

      setIndicatorStyle({
        opacity: 1,
        transform: `translate3d(${(activeRect.left - containerRect.left).toFixed(2)}px, 0, 0)`,
        width: `${activeRect.width.toFixed(2)}px`,
      });
    }

    updateIndicator();

    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateIndicator);
    resizeObserver?.observe(container);
    Array.from(container.children).forEach((child) => {
      if (child instanceof HTMLElement) {
        resizeObserver?.observe(child);
      }
    });
    window.addEventListener("resize", updateIndicator);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateIndicator);
    };
  }, [children, showIndicator]);

  return (
    <div
      ref={containerRef}
      className={cn("plotty-segmented", layout === "mobileGrid" && "plotty-segmented-mobile-grid", className)}
      {...props}
    >
      {showIndicator ? <span className="plotty-tab-indicator" style={indicatorStyle} aria-hidden="true" /> : null}
      {children}
    </div>
  );
}

export function TabButton({ className, isActive, ...props }: TabButtonProps) {
  return (
    <button
      className={cn(
        "plotty-tab-button relative z-10 rounded-[calc(var(--plotty-radius-md)-4px)] px-4 py-2.5 text-sm font-semibold transition-[background-color,color,box-shadow,transform] duration-[var(--motion-base)] ease-[var(--ease-out-soft)] hover:-translate-y-px active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plotty-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--plotty-paper)] disabled:pointer-events-none disabled:translate-y-0 disabled:scale-100 disabled:opacity-60",
        isActive
          ? "bg-[var(--plotty-accent)] text-white shadow-[0_8px_18px_rgba(188,95,61,0.16)]"
          : "bg-transparent text-[var(--plotty-muted)] hover:bg-white/70 hover:text-[var(--plotty-ink)]",
        className,
      )}
      data-active={isActive ? "true" : undefined}
      aria-pressed={isActive}
      {...props}
    />
  );
}
