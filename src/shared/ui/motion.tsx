"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

export type AsyncJobStatusValue = "idle" | "queued" | "processing" | "completed" | "failed";
type MotionListItemStyle = CSSProperties & { "--plotty-motion-index": number };

export function AnimatedList<TItem>({
  items,
  getKey,
  renderItem,
  className,
  itemClassName,
  ariaLive,
}: {
  items: TItem[];
  getKey: (item: TItem) => string;
  renderItem: (item: TItem, index: number) => ReactNode;
  className?: string;
  itemClassName?: string;
  ariaLive?: "off" | "polite" | "assertive";
}) {
  const listKey = useMemo(() => items.map(getKey).join("|"), [getKey, items]);

  return (
    <div key={listKey} className={cn("plotty-motion-list", className)} aria-live={ariaLive}>
      {items.map((item, index) => (
        <div
          key={getKey(item)}
          className={cn("plotty-motion-list-item", itemClassName)}
          style={{ "--plotty-motion-index": index } as MotionListItemStyle}
        >
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}

export function AnimatedTabPanel<TKey extends string>({
  activeKey,
  panelKey,
  children,
  className,
  keepMounted = false,
}: {
  activeKey: TKey;
  panelKey: TKey;
  children: ReactNode;
  className?: string;
  keepMounted?: boolean;
}) {
  const isActive = activeKey === panelKey;

  if (!keepMounted && !isActive) {
    return null;
  }

  return (
    <div
      key={panelKey}
      className={cn("plotty-motion-tab-panel", className)}
      data-active={isActive ? "true" : "false"}
      hidden={keepMounted && !isActive}
    >
      {children}
    </div>
  );
}

export function AsyncJobStatus({
  status,
  label,
  description,
  error,
  compact = false,
  className,
}: {
  status: AsyncJobStatusValue;
  label: string;
  description?: ReactNode;
  error?: ReactNode;
  compact?: boolean;
  className?: string;
}) {
  const previousStatusRef = useRef(status);
  const [showCompletedPulse, setShowCompletedPulse] = useState(false);
  const isBusy = status === "queued" || status === "processing";
  const isFailed = status === "failed";
  const isCompleted = status === "completed";

  useEffect(() => {
    if (status === "completed" && previousStatusRef.current !== "completed") {
      setShowCompletedPulse(true);
      const timeoutId = window.setTimeout(() => setShowCompletedPulse(false), 900);

      previousStatusRef.current = status;
      return () => window.clearTimeout(timeoutId);
    }

    previousStatusRef.current = status;
    return undefined;
  }, [status]);

  if (status === "idle") {
    return null;
  }

  return (
    <div
      className={cn(
        "plotty-async-status",
        compact && "plotty-async-status-compact",
        isBusy && "plotty-async-status-busy",
        isCompleted && "plotty-async-status-completed",
        isFailed && "plotty-async-status-failed",
        showCompletedPulse && "plotty-async-status-pulse",
        className,
      )}
      role={isFailed ? "alert" : "status"}
      aria-live={isFailed ? "assertive" : "polite"}
    >
      <span className="plotty-async-status-icon" aria-hidden="true" />
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-[var(--plotty-ink)]">{label}</span>
        {description || error ? (
          <span className={cn("mt-1 block text-sm leading-5", isFailed ? "text-[var(--plotty-danger)]" : "text-[var(--plotty-muted)]")}>
            {error ?? description}
          </span>
        ) : null}
      </span>
    </div>
  );
}
