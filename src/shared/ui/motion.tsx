"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type Ref } from "react";

import { cn } from "@/shared/lib/utils";
import { gsap, useGsapFlipList, useGsapPresence, useReducedMotion } from "@/shared/lib/gsap-motion";

export type AsyncJobStatusValue = "idle" | "queued" | "processing" | "completed" | "failed";
type MotionListItemStyle = CSSProperties & { "--plotty-motion-index": number };

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
  useGsapFlipList(internalListRef, listKey);

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
      data-gsap-flip-list="true"
      data-motion-key={listKey}
    >
      {items.map((item, index) => (
        <div
          key={getKey(item)}
          className={cn("plotty-motion-list-item", itemClassName)}
          data-gsap-flip-id={getKey(item)}
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
  useGsapPresence(panelRef, [activeKey, panelKey]);

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

  useLayoutEffect(() => {
    const node = panelRef.current;

    if (!node || !shouldRender) {
      return;
    }

    if (reducedMotion || process.env.NODE_ENV === "test") {
      if (!open) {
        setShouldRender(false);
      }

      return;
    }

    gsap.killTweensOf(node);

    if (open) {
      const targetHeight = node.scrollHeight;
      const tween = gsap.fromTo(
        node,
        { height: 0, opacity: 0, overflow: "hidden", y: -6 },
        {
          clearProps: "height,overflow,opacity,transform",
          duration: 0.32,
          ease: "power3.out",
          height: targetHeight,
          opacity: 1,
          y: 0,
        },
      );

      return () => {
        tween.kill();
      };
    }

    const startHeight = node.scrollHeight;
    const tween = gsap.fromTo(
      node,
      { height: startHeight, opacity: 1, overflow: "hidden", y: 0 },
      {
        duration: 0.24,
        ease: "power2.inOut",
        height: 0,
        opacity: 0,
        y: -6,
        onComplete: () => setShouldRender(false),
      },
    );

    return () => {
      tween.kill();
    };
  }, [open, reducedMotion, shouldRender]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      ref={panelRef}
      className={cn("overflow-hidden", className)}
      aria-hidden={!open}
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
  const statusRef = useRef<HTMLDivElement | null>(null);
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

  useEffect(() => {
    const node = statusRef.current;

    if (!node || status === "idle" || process.env.NODE_ENV === "test") {
      return;
    }

    const tween = status === "failed"
      ? gsap.fromTo(node, { x: -4 }, { clearProps: "transform", duration: 0.34, ease: "elastic.out(1, 0.45)", x: 0 })
      : gsap.fromTo(node, { opacity: 0, y: 6 }, { opacity: 1, clearProps: "opacity,transform", duration: 0.28, ease: "power3.out", y: 0 });

    return () => {
      tween.kill();
    };
  }, [status]);

  if (status === "idle") {
    return null;
  }

  return (
    <div
      ref={statusRef}
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
