import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";

import { cn } from "@/shared/lib/utils";
import { fieldClassName } from "@/shared/ui/field";

export interface HighlightRange<TData = unknown> {
  id?: string;
  startOffset: number;
  endOffset: number;
  tone?: "warning" | "danger";
  data?: TData;
}

interface HighlightedTextareaProps<TData = unknown> extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  activeHighlightId?: string;
  activeHighlightScrollKey?: number;
  highlightRanges?: HighlightRange<TData>[];
  onActiveHighlightAnchorChange?: (range: HighlightRange<TData>, anchorRect: DOMRect) => void;
  onHighlightClick?: (range: HighlightRange<TData>, anchorRect: DOMRect) => void;
}

export function HighlightedTextarea<TData = unknown>({
  activeHighlightId,
  activeHighlightScrollKey = 0,
  className,
  highlightRanges = [],
  onActiveHighlightAnchorChange,
  onHighlightClick,
  onScroll,
  style,
  value,
  ...props
}: HighlightedTextareaProps<TData>) {
  const highlightLayerRef = useRef<HTMLDivElement>(null);
  const hitLayerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightNodeRefs = useRef(new Map<string, HTMLElement>());
  const text = typeof value === "string" ? value : String(value ?? "");
  const normalizedRanges = useMemo(() => normalizeRanges(text, highlightRanges), [highlightRanges, text]);
  const rangeById = useMemo(() => {
    const map = new Map<string, HighlightRange<TData>>();

    normalizedRanges.forEach((range, index) => {
      map.set(getRangeId(range, index), range);
    });

    return map;
  }, [normalizedRanges]);
  const hasHighlights = normalizedRanges.length > 0;
  const mirrorStyle: CSSProperties = {
    scrollbarGutter: "stable",
    ...style,
  };
  const textareaStyle: CSSProperties = {
    ...style,
    scrollbarGutter: "stable",
  };

  const syncMirrorScroll = useCallback((scrollTop: number, scrollLeft: number) => {
    [highlightLayerRef.current, hitLayerRef.current].forEach((layer) => {
      if (!layer) {
        return;
      }

      layer.scrollTop = scrollTop;
      layer.scrollLeft = scrollLeft;
    });
  }, []);

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
    textarea.scrollTop = nextScrollTop;
    syncMirrorScroll(textarea.scrollTop, textarea.scrollLeft);

    window.requestAnimationFrame(() => {
      onActiveHighlightAnchorChange?.(range, node.getBoundingClientRect());
    });
  }, [activeHighlightId, activeHighlightScrollKey, onActiveHighlightAnchorChange, rangeById, syncMirrorScroll]);

  return (
    <div className="relative">
      {hasHighlights ? (
        <div
          ref={highlightLayerRef}
          className={cn(mirrorClassName, className)}
          style={mirrorStyle}
        >
          {buildHighlightMarkup(text, normalizedRanges)}
        </div>
      ) : null}
      <textarea
        ref={textareaRef}
        className={cn(
          fieldClassName("relative z-10 min-h-36 px-4 py-3 leading-7"),
          className,
          hasHighlights ? "!bg-transparent" : "",
        )}
        style={textareaStyle}
        value={value}
        onScroll={(event) => {
          syncMirrorScroll(event.currentTarget.scrollTop, event.currentTarget.scrollLeft);
          onScroll?.(event);
        }}
        {...props}
      />
      {hasHighlights ? (
        <div
          ref={hitLayerRef}
          className={cn(mirrorClassName, "z-20 pointer-events-none", className)}
          style={mirrorStyle}
        >
          {buildHitLayerMarkup(text, normalizedRanges, {
            activeHighlightId,
            onHighlightClick,
            setNode: (id, node) => {
              if (node) {
                highlightNodeRefs.current.set(id, node);
                return;
              }

              highlightNodeRefs.current.delete(id);
            },
          })}
        </div>
      ) : null}
    </div>
  );
}

const mirrorClassName = fieldClassName(
  "plotty-highlighted-textarea-mirror absolute inset-0 min-h-36 whitespace-pre-wrap break-words px-4 py-3 leading-7 text-transparent overflow-auto border-transparent !bg-transparent shadow-none",
);

function buildHighlightMarkup<TData>(text: string, ranges: HighlightRange<TData>[]) {
  if (!ranges.length) {
    return text || " ";
  }

  return buildRangeMarkup(text, ranges, (range, index, value) => (
    <mark
      key={`${range.startOffset}-${range.endOffset}-${index}`}
      className={cn(
        "rounded-[4px] text-transparent",
        range.tone === "danger" ? "bg-[var(--plotty-danger-soft)]" : "bg-[var(--plotty-accent-soft)]",
      )}
    >
      {value}
    </mark>
  ));
}

function buildHitLayerMarkup<TData>(
  text: string,
  ranges: HighlightRange<TData>[],
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
  return buildRangeMarkup(text, ranges, (range, index, value) => {
    const rangeId = getRangeId(range, index);

    function open(event: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>) {
      event.preventDefault();
      event.stopPropagation();
      onHighlightClick?.(range, event.currentTarget.getBoundingClientRect());
    }

    return (
      <button
        key={`${range.startOffset}-${range.endOffset}-${index}`}
        ref={(node) => setNode(rangeId, node)}
        type="button"
        aria-label={`Ошибка: ${value}`}
        className={cn(
          "pointer-events-auto inline rounded-[4px] border-0 bg-transparent p-0 text-transparent outline-none focus-visible:ring-2 focus-visible:ring-[var(--plotty-accent)] focus-visible:ring-offset-1",
          activeHighlightId === rangeId ? "ring-2 ring-[var(--plotty-accent)] ring-offset-1" : "",
        )}
        style={{ font: "inherit", letterSpacing: "inherit", lineHeight: "inherit" }}
        onMouseDown={open}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            open(event);
          }
        }}
      >
        {value}
      </button>
    );
  });
}

function buildRangeMarkup<TData>(
  text: string,
  ranges: HighlightRange<TData>[],
  renderRange: (range: HighlightRange<TData>, index: number, value: string) => ReactNode,
) {
  const parts: ReactNode[] = [];
  let cursor = 0;

  ranges.forEach((range, index) => {
    if (range.startOffset > cursor) {
      parts.push(
        <span key={`text-${cursor}-${range.startOffset}`} aria-hidden="true">
          {text.slice(cursor, range.startOffset)}
        </span>,
      );
    }

    parts.push(renderRange(range, index, text.slice(range.startOffset, range.endOffset)));
    cursor = range.endOffset;
  });

  if (cursor < text.length) {
    parts.push(
      <span key={`text-${cursor}-${text.length}`} aria-hidden="true">
        {text.slice(cursor)}
      </span>,
    );
  }

  return parts.length ? parts : " ";
}

function normalizeRanges<TData>(text: string, ranges: HighlightRange<TData>[]) {
  const textLength = text.length;
  const normalized: HighlightRange<TData>[] = [];

  ranges
    .map((range) => ({
      ...range,
      startOffset: Math.max(0, Math.min(range.startOffset, textLength)),
      endOffset: Math.max(0, Math.min(range.endOffset, textLength)),
    }))
    .filter((range) => range.endOffset > range.startOffset)
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
