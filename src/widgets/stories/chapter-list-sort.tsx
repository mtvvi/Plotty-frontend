"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { ArrowDownUp } from "lucide-react";

import type { ChapterListItem } from "@/entities/story/model/types";
import { Button } from "@/shared/ui/button";

export type ChapterSortDirection = "asc" | "desc";

export function useScrollableChapters<TElement extends HTMLElement>(
  dependencies: readonly unknown[],
): {
  isScrollable: boolean;
  scrollRef: RefObject<TElement | null>;
} {
  const scrollRef = useRef<TElement | null>(null);
  const [isScrollable, setIsScrollable] = useState(false);

  useEffect(() => {
    const node = scrollRef.current;

    if (!node) {
      setIsScrollable(false);
      return undefined;
    }

    const listNode = node;

    function updateScrollableState() {
      setIsScrollable(listNode.scrollHeight > listNode.clientHeight + 1);
    }

    updateScrollableState();

    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateScrollableState);
    resizeObserver?.observe(listNode);
    window.addEventListener("resize", updateScrollableState);

    const frameId = window.requestAnimationFrame(updateScrollableState);

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateScrollableState);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return { isScrollable, scrollRef };
}

export function sortChaptersForDisplay<TChapter extends Pick<ChapterListItem, "id" | "number" | "updatedAt">>(
  chapters: TChapter[],
  direction: ChapterSortDirection,
) {
  const sortedChapters = [...chapters].sort((left, right) => {
    const leftNumber = left.number ?? Number.MAX_SAFE_INTEGER;
    const rightNumber = right.number ?? Number.MAX_SAFE_INTEGER;

    if (leftNumber !== rightNumber) {
      return leftNumber - rightNumber;
    }

    const updatedDelta = new Date(left.updatedAt).getTime() - new Date(right.updatedAt).getTime();

    if (updatedDelta !== 0) {
      return updatedDelta;
    }

    return left.id.localeCompare(right.id);
  });

  return direction === "asc" ? sortedChapters : sortedChapters.reverse();
}

export function ChapterSortButton({
  chapterCount,
  direction,
  onToggle,
}: {
  chapterCount: number;
  direction: ChapterSortDirection;
  onToggle: () => void;
}) {
  const nextDirectionLabel = direction === "asc" ? "последние первыми" : "первые первыми";
  const currentDirectionLabel = getChapterSortRangeLabel(direction, chapterCount);

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      className="plotty-chapter-sort-button shrink-0 font-sans"
      aria-label={`Порядок глав: ${currentDirectionLabel}. Показать ${nextDirectionLabel}.`}
      title={`Показать ${nextDirectionLabel}`}
      onClick={onToggle}
    >
      <ArrowDownUp className="size-4" aria-hidden="true" />
    </Button>
  );
}

function getChapterSortRangeLabel(direction: ChapterSortDirection, chapterCount: number) {
  const first = direction === "asc" ? 1 : chapterCount;
  const last = direction === "asc" ? chapterCount : 1;

  return `${first} → ${last}`;
}
