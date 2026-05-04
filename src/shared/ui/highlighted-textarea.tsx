import { useRef, type ReactNode, type TextareaHTMLAttributes } from "react";

import { fieldClassName } from "@/shared/ui/field";
import { cn } from "@/shared/lib/utils";

export interface HighlightRange {
  startOffset: number;
  endOffset: number;
  tone?: "warning" | "danger";
}

interface HighlightedTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  highlightRanges?: HighlightRange[];
}

export function HighlightedTextarea({
  className,
  highlightRanges = [],
  onScroll,
  value,
  ...props
}: HighlightedTextareaProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const text = typeof value === "string" ? value : String(value ?? "");
  const highlightMarkup = buildHighlightMarkup(text, highlightRanges);

  return (
    <div className="relative">
      <div
        ref={backdropRef}
        aria-hidden="true"
        className={cn(
          fieldClassName("pointer-events-none absolute inset-0 min-h-36 whitespace-pre-wrap break-words px-4 py-3 leading-7 text-transparent"),
          className,
          "overflow-hidden border-transparent !bg-transparent shadow-none",
        )}
      >
        {highlightMarkup}
      </div>
      <textarea
        className={cn(
          fieldClassName("relative min-h-36 px-4 py-3 leading-7"),
          className,
          highlightRanges.length ? "!bg-transparent" : "",
        )}
        value={value}
        onScroll={(event) => {
          if (backdropRef.current) {
            backdropRef.current.scrollTop = event.currentTarget.scrollTop;
            backdropRef.current.scrollLeft = event.currentTarget.scrollLeft;
          }

          onScroll?.(event);
        }}
        {...props}
      />
    </div>
  );
}

function buildHighlightMarkup(text: string, ranges: HighlightRange[]) {
  const normalizedRanges = normalizeRanges(text, ranges);

  if (!normalizedRanges.length) {
    return text || " ";
  }

  const parts: ReactNode[] = [];
  let cursor = 0;

  normalizedRanges.forEach((range, index) => {
    if (range.startOffset > cursor) {
      parts.push(text.slice(cursor, range.startOffset));
    }

    parts.push(
      <mark
        key={`${range.startOffset}-${range.endOffset}-${index}`}
        className={cn(
          "rounded-[4px] text-transparent",
          range.tone === "danger" ? "bg-[var(--plotty-danger-soft)]" : "bg-[var(--plotty-accent-soft)]",
        )}
      >
        {text.slice(range.startOffset, range.endOffset)}
      </mark>,
    );
    cursor = range.endOffset;
  });

  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }

  return parts;
}

function normalizeRanges(text: string, ranges: HighlightRange[]) {
  const textLength = text.length;
  const normalized: HighlightRange[] = [];

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
        previous.endOffset = Math.max(previous.endOffset, range.endOffset);
        return;
      }

      normalized.push(range);
    });

  return normalized;
}
