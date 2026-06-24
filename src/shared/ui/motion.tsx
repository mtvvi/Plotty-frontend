"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type Ref } from "react";

import { useReducedMotion } from "@/shared/lib/motion-preferences";
import { cn } from "@/shared/lib/utils";

export type AsyncJobStatusValue = "idle" | "queued" | "processing" | "completed" | "failed";
type MotionListItemStyle = CSSProperties & { "--plotty-motion-index": number };
const disclosureExitDurationMs = 240;

export function AnimatedList<TItem>({
  items,
  getKey,
  renderItem,
  className,
  itemClassName,
  listRef,
  ariaLive,
}: {
  items: TItem[];
  getKey: (item: TItem) => string;
  renderItem: (item: TItem, index: number) => ReactNode;
  className?: string;
  itemClassName?: string;
  listRef?: Ref<HTMLDivElement>;
  ariaLive?: "off" | "polite" | "assertive";
}) {
  const listKey = useMemo(() => items.map(getKey).join("|"), [getKey, items]);
  const internalListRef = useRef<HTMLDivElement | null>(null);

  function setListNode(node: HTMLDivElement | null) {
    internalListRef.current = node;

    if (typeof listRef === "function") {
      listRef(node);
      return;
    }

    if (listRef && "current" in listRef) {
      listRef.current = node;
    }
  }

  return (
    <div
      ref={setListNode}
      className={cn("plotty-motion-list", className)}
      aria-live={ariaLive}
      data-motion-list="true"
      data-motion-key={listKey}
    >
      {items.map((item, index) => (
        <div
          key={getKey(item)}
          className={cn("plotty-motion-list-item", itemClassName)}
          data-motion-list-item="true"
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
  const panelRef = useRef<HTMLDivElement | null>(null);

  if (!keepMounted && !isActive) {
    return null;
  }

  return (
    <div
      ref={panelRef}
      key={panelKey}
      className={cn("plotty-motion-tab-panel", className)}
      data-active={isActive ? "true" : "false"}
      data-gsap-presence="tab-panel"
      hidden={keepMounted && !isActive}
    >
      {children}
    </div>
  );
}

export function AnimatedDisclosurePanel({
  open,
  children,
  className,
}: {
  open: boolean;
  children: ReactNode;
  className?: string;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const reducedMotion = useReducedMotion();
  const [shouldRender, setShouldRender] = useState(open);

  useEffect(() => {
    if (open) {
      setShouldRender(true);
    }
  }, [open]);

  useEffect(() => {
    if (!shouldRender) {
      return;
    }

    if (!open) {
      if (reducedMotion || process.env.NODE_ENV === "test") {
        if (!open) {
          setShouldRender(false);
        }

        return;
      }

      const timeoutId = window.setTimeout(() => setShouldRender(false), disclosureExitDurationMs);

      return () => window.clearTimeout(timeoutId);
    }

    return undefined;
  }, [open, reducedMotion, shouldRender]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      ref={panelRef}
      className={cn("plotty-motion-disclosure-panel overflow-hidden", className)}
      aria-hidden={!open}
      data-state={open ? "open" : "closing"}
      data-gsap-disclosure-panel="true"
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
      {isBusy ? <span className="plotty-async-status-icon" aria-hidden="true" /> : null}
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
