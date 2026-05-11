import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";

import { cn } from "@/shared/lib/utils";
import { fieldClassName } from "@/shared/ui/field";

export interface HighlightRange<TData = unknown> {
  id?: string;
  startOffset: number;
  endOffset: number;
  expectedText?: string;
  tone?: "warning" | "danger";
  data?: TData;
}

interface HighlightedTextareaProps<TData = unknown> extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  activeHighlightId?: string;
  activeHighlightScrollKey?: number;
  highlightRanges?: HighlightRange<TData>[];
  onActiveHighlightAnchorChange?: (range: HighlightRange<TData>, anchorRect: DOMRect) => void;
  onActiveHighlightHidden?: () => void;
  onHighlightClick?: (range: HighlightRange<TData>, anchorRect: DOMRect) => void;
  onHighlightViewportScroll?: () => void;
}

interface MirrorMetrics {
  height: number;
  left: number;
  scrollHeight: number;
  scrollWidth: number;
  top: number;
  width: number;
}

type NormalizedHighlightRange<TData> = HighlightRange<TData> & {
  id: string;
};

const useSafeLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function HighlightedTextarea<TData = unknown>({
  activeHighlightId,
  activeHighlightScrollKey = 0,
  className,
  highlightRanges = [],
  onActiveHighlightAnchorChange,
  onActiveHighlightHidden,
  onHighlightClick,
  onHighlightViewportScroll,
  onScroll,
  style,
  value,
  ...props
}: HighlightedTextareaProps<TData>) {
  const highlightContentRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightNodeRefs = useRef(new Map<string, HTMLElement>());
  const programmaticScrollRef = useRef(false);
  const text = normalizeEditorText(typeof value === "string" ? value : String(value ?? ""));
  const [metrics, setMetrics] = useState<MirrorMetrics | null>(null);
  const [mirrorTextStyle, setMirrorTextStyle] = useState<CSSProperties>({});
  const normalizedRanges = useMemo(() => normalizeRanges(text, highlightRanges), [highlightRanges, text]);
  const rangeById = useMemo(() => {
    const map = new Map<string, NormalizedHighlightRange<TData>>();

    normalizedRanges.forEach((range) => {
      map.set(range.id, range);
    });

    return map;
  }, [normalizedRanges]);
  const hasHighlights = normalizedRanges.length > 0;
  const textareaStyle: CSSProperties = {
    ...style,
    scrollbarGutter: "stable",
  };

  const syncMirrorScroll = useCallback((scrollTop: number, scrollLeft: number) => {
    if (highlightContentRef.current) {
      highlightContentRef.current.style.transform = `translate(${-scrollLeft}px, ${-scrollTop}px)`;
    }
  }, []);

  const updateMirrorMeasurements = useCallback(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    const computed = window.getComputedStyle(textarea);
    const nextMetrics: MirrorMetrics = {
      height: textarea.clientHeight,
      left: textarea.offsetLeft + textarea.clientLeft,
      scrollHeight: Math.max(textarea.scrollHeight, textarea.clientHeight),
      scrollWidth: Math.max(textarea.scrollWidth, textarea.clientWidth),
      top: textarea.offsetTop + textarea.clientTop,
      width: textarea.clientWidth,
    };

    setMetrics((current) => (areMetricsEqual(current, nextMetrics) ? current : nextMetrics));
    setMirrorTextStyle({
      boxSizing: "border-box",
      fontFamily: computed.fontFamily,
      fontSize: computed.fontSize,
      fontWeight: computed.fontWeight,
      letterSpacing: computed.letterSpacing,
      lineHeight: computed.lineHeight,
      overflowWrap: computed.overflowWrap,
      paddingBottom: computed.paddingBottom,
      paddingLeft: computed.paddingLeft,
      paddingRight: computed.paddingRight,
      paddingTop: computed.paddingTop,
      tabSize: computed.tabSize,
      whiteSpace: "pre-wrap",
      wordBreak: computed.wordBreak,
    });
    syncMirrorScroll(textarea.scrollTop, textarea.scrollLeft);
  }, [syncMirrorScroll]);

  const selectTextareaRange = useCallback((range: HighlightRange<TData>) => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    try {
      textarea.focus({ preventScroll: true });
    } catch {
      textarea.focus();
    }

    textarea.setSelectionRange(range.startOffset, range.endOffset);
  }, []);

  const getHighlightViewportRect = useCallback(() => {
    const highlightLayer = highlightContentRef.current?.parentElement;

    return highlightLayer?.getBoundingClientRect() ?? textareaRef.current?.getBoundingClientRect() ?? null;
  }, []);

  const reportActiveHighlightAnchor = useCallback(() => {
    if (!activeHighlightId) {
      return;
    }

    const node = highlightNodeRefs.current.get(activeHighlightId);
    const range = rangeById.get(activeHighlightId);

    if (!node || !range) {
      onActiveHighlightHidden?.();
      return;
    }

    const nodeRect = node.getBoundingClientRect();

    if (!isRectVisibleInside(nodeRect, getHighlightViewportRect())) {
      onActiveHighlightHidden?.();
      return;
    }

    onActiveHighlightAnchorChange?.(range, nodeRect);
  }, [activeHighlightId, getHighlightViewportRect, onActiveHighlightAnchorChange, onActiveHighlightHidden, rangeById]);

  useSafeLayoutEffect(() => {
    updateMirrorMeasurements();
  }, [className, style, text, updateMirrorMeasurements]);

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    updateMirrorMeasurements();

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            updateMirrorMeasurements();
            window.requestAnimationFrame(reportActiveHighlightAnchor);
          });

    resizeObserver?.observe(textarea);
    window.addEventListener("resize", updateMirrorMeasurements);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateMirrorMeasurements);
    };
  }, [reportActiveHighlightAnchor, updateMirrorMeasurements]);

  useEffect(() => {
    if (!activeHighlightId) {
      return;
    }

    const textarea = textareaRef.current;
    const node = highlightNodeRefs.current.get(activeHighlightId);
    const range = rangeById.get(activeHighlightId);

    if (!textarea || !node || !range) {
      return;
    }

    const nextScrollTop = Math.max(0, node.offsetTop - textarea.clientHeight / 3);
    programmaticScrollRef.current = true;
    textarea.scrollTop = nextScrollTop;
    syncMirrorScroll(textarea.scrollTop, textarea.scrollLeft);
    selectTextareaRange(range);

    window.requestAnimationFrame(() => {
      programmaticScrollRef.current = false;
      updateMirrorMeasurements();
      reportActiveHighlightAnchor();
    });
  }, [
    activeHighlightId,
    activeHighlightScrollKey,
    rangeById,
    reportActiveHighlightAnchor,
    selectTextareaRange,
    syncMirrorScroll,
    updateMirrorMeasurements,
  ]);

  useEffect(() => {
    if (!activeHighlightId) {
      return;
    }

    function handleViewportChange() {
      updateMirrorMeasurements();
      window.requestAnimationFrame(reportActiveHighlightAnchor);
    }

    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [activeHighlightId, reportActiveHighlightAnchor, updateMirrorMeasurements]);

  const layerStyle: CSSProperties | undefined = metrics
    ? {
        height: metrics.height,
        left: metrics.left,
        top: metrics.top,
        width: metrics.width,
      }
    : undefined;
  const contentStyle: CSSProperties = {
    ...mirrorTextStyle,
    minHeight: metrics?.scrollHeight,
    transform: `translate(${-textareaRef.current?.scrollLeft || 0}px, ${-textareaRef.current?.scrollTop || 0}px)`,
    width: metrics?.scrollWidth,
  };

  return (
    <div className="plotty-highlighted-textarea-shell relative">
      <textarea
        ref={textareaRef}
        className={cn(textareaClassName, className)}
        spellCheck={false}
        style={textareaStyle}
        value={text}
        onScroll={(event) => {
          syncMirrorScroll(event.currentTarget.scrollTop, event.currentTarget.scrollLeft);

          if (!programmaticScrollRef.current) {
            if (activeHighlightId) {
              window.requestAnimationFrame(reportActiveHighlightAnchor);
            } else {
              onHighlightViewportScroll?.();
            }
          }

          onScroll?.(event);
        }}
        {...props}
      />
      {hasHighlights ? (
        <div
          className="plotty-highlighted-textarea-layer pointer-events-none absolute z-20 overflow-hidden"
          style={layerStyle}
        >
          <div
            ref={highlightContentRef}
            className={cn("plotty-highlighted-textarea-content text-transparent", className, "!bg-transparent shadow-none")}
            style={contentStyle}
          >
            {buildHighlightMarkup(text, normalizedRanges, {
              activeHighlightId,
              onHighlightClick: (range, anchorRect) => {
                selectTextareaRange(range);
                onHighlightClick?.(range, anchorRect);
              },
              setNode: (id, node) => {
                if (node) {
                  highlightNodeRefs.current.set(id, node);
                  return;
                }

                highlightNodeRefs.current.delete(id);
              },
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

const textareaClassName = fieldClassName(
  "relative z-10 min-h-36 resize-none overflow-auto whitespace-pre-wrap break-words px-4 py-3 leading-7 [scrollbar-gutter:stable] [tab-size:4]",
);

function buildHighlightMarkup<TData>(
  text: string,
  ranges: NormalizedHighlightRange<TData>[],
  {
    activeHighlightId,
    onHighlightClick,
    setNode,
  }: {
    activeHighlightId?: string;
    onHighlightClick?: (range: HighlightRange<TData>, anchorRect: DOMRect) => void;
    setNode: (id: string, node: HTMLElement | null) => void;
  },
) {
  return buildRangeMarkup(text, ranges, (range, value) => {
    function open(event: PointerEvent<HTMLElement> | KeyboardEvent<HTMLElement>) {
      event.preventDefault();
      event.stopPropagation();
      onHighlightClick?.(range, event.currentTarget.getBoundingClientRect());
    }

    return (
      <mark
        key={range.id}
        ref={(node) => setNode(range.id, node)}
        data-error-id={range.id}
        role="button"
        tabIndex={0}
        aria-label={`Ошибка: ${value}`}
        className={cn(
          "pointer-events-auto inline cursor-pointer rounded-[4px] border-b-2 bg-transparent text-transparent outline-none focus-visible:ring-2 focus-visible:ring-[var(--plotty-accent)] focus-visible:ring-offset-1",
          range.tone === "danger"
            ? "border-[var(--plotty-danger)] bg-[rgba(189,63,50,0.18)]"
            : "border-[var(--plotty-accent)] bg-[rgba(195,79,50,0.18)]",
          activeHighlightId === range.id ? "ring-2 ring-[var(--plotty-accent)] ring-offset-1" : "",
        )}
        style={{ font: "inherit", letterSpacing: "inherit", lineHeight: "inherit" }}
        onPointerDown={open}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            open(event);
          }
        }}
      >
        {value}
      </mark>
    );
  });
}

function buildRangeMarkup<TData>(
  text: string,
  ranges: NormalizedHighlightRange<TData>[],
  renderRange: (range: NormalizedHighlightRange<TData>, value: string) => ReactNode,
) {
  const parts: ReactNode[] = [];
  let cursor = 0;

  ranges.forEach((range) => {
    if (range.startOffset > cursor) {
      parts.push(text.slice(cursor, range.startOffset));
    }

    parts.push(renderRange(range, text.slice(range.startOffset, range.endOffset)));
    cursor = range.endOffset;
  });

  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }

  if (!parts.length) {
    return " ";
  }

  if (text.endsWith("\n")) {
    parts.push(" ");
  }

  return parts;
}

function normalizeRanges<TData>(text: string, ranges: HighlightRange<TData>[]) {
  const textLength = text.length;
  const normalized: NormalizedHighlightRange<TData>[] = [];

  ranges
    .map((range, index) => ({
      ...range,
      id: getRangeId(range, index),
    }))
    .filter((range) => Number.isFinite(range.startOffset) && Number.isFinite(range.endOffset))
    .filter((range) => range.startOffset >= 0 && range.endOffset <= textLength && range.endOffset > range.startOffset)
    .filter((range) => !range.expectedText || text.slice(range.startOffset, range.endOffset) === range.expectedText)
    .sort((a, b) => a.startOffset - b.startOffset || a.endOffset - b.endOffset)
    .forEach((range) => {
      const previous = normalized.at(-1);

      if (previous && range.startOffset < previous.endOffset) {
        return;
      }

      normalized.push(range);
    });

  return normalized;
}

function getRangeId<TData>(range: HighlightRange<TData>, index: number) {
  return range.id ?? `${range.startOffset}-${range.endOffset}-${index}`;
}

function normalizeEditorText(text: string) {
  return text.replace(/\r\n?/g, "\n");
}

function areMetricsEqual(current: MirrorMetrics | null, next: MirrorMetrics) {
  return (
    current?.height === next.height &&
    current.left === next.left &&
    current.scrollHeight === next.scrollHeight &&
    current.scrollWidth === next.scrollWidth &&
    current.top === next.top &&
    current.width === next.width
  );
}

function isRectVisibleInside(rect: DOMRect, viewportRect: DOMRect | null) {
  if (!viewportRect) {
    return false;
  }

  return (
    rect.bottom > viewportRect.top &&
    rect.top < viewportRect.bottom &&
    rect.right > viewportRect.left &&
    rect.left < viewportRect.right
  );
}
