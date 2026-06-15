"use client";

import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import Image from "next/image";
import { useQueryClient, type QueryClient, type QueryKey } from "@tanstack/react-query";

import type {
  ChapterDetails,
  ChapterWiki,
  ChapterWikiEntity,
  StoriesResponse,
  StoryDetails,
  StoryListItem,
} from "@/entities/story/model/types";
import { gsap, registerPlottyGsapPlugins, useReducedMotion } from "@/shared/lib/gsap-motion";
import { isUnoptimizedImageUrl, sanitizeImageUrl } from "@/shared/lib/safe-url";
import { pluralizeRu } from "@/shared/lib/utils";

type CachedChapterSeed = {
  id: string;
  title: string;
  updatedAt: string;
  imageUrl: string;
  number?: number;
  storyTitle?: string;
  wordCount?: number;
  wiki?: ChapterWiki;
  labels?: WikiLabelSeed[];
  metaOverride?: string;
};

type CachedChapterStoryMeta = {
  storyTitle?: string;
  number?: number;
};

type WikiLabelSeed = {
  kind: "Персонаж" | "Локация" | "Предмет" | "Фандом" | "Тег" | "Рейтинг" | "Размер";
  name: string;
  detail?: string;
};

type Depth = 0 | 1 | 2;

type DecorativeNode = {
  id: string;
  x: number;
  y: number;
  depth: Depth;
  size: number;
  tone: "muted" | "warm" | "accent";
};

type ChapterTileLayout = {
  id: string;
  x: number;
  y: number;
  depth: Depth;
  rotate: number;
  size: "md" | "lg";
};

type WikiLabelLayout = {
  id: string;
  x: number;
  y: number;
  depth: Depth;
  rotate: number;
  side: "left" | "right";
};

type PlotMapLine = {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  depth: Depth;
  kind?: "chapter" | "ambient";
};

type ChapterGraphTile = {
  id: string;
  title: string;
  meta: string;
  imageUrl: string;
  layout: ChapterTileLayout;
};

type ChapterGraphLabel = WikiLabelSeed & {
  id: string;
  tileId: string;
  layout: WikiLabelLayout;
};

type ChapterGraph = {
  tiles: ChapterGraphTile[];
  labels: ChapterGraphLabel[];
  lines: PlotMapLine[];
};

type PlotMapStyle = CSSProperties & {
  "--plot-map-x"?: string;
  "--plot-map-y"?: string;
  "--plot-map-size"?: string;
  "--plot-map-delay"?: string;
  "--plot-map-rotate"?: string;
};

const CHAPTER_TILE_LIMIT = 3;
const WIKI_LABELS_PER_TILE = 2;
const LAYER_DRIFT = [5, -8, 12, 4] as const;

const chapterTileLayouts: ChapterTileLayout[] = [
  { id: "chapter-left", x: 9, y: 33, depth: 2, rotate: -3.4, size: "lg" },
  { id: "chapter-right-top", x: 88, y: 25, depth: 1, rotate: 2.6, size: "md" },
  { id: "chapter-right-bottom", x: 80, y: 73, depth: 2, rotate: -2.1, size: "lg" },
];

const wikiLabelLayouts: WikiLabelLayout[][] = [
  [
    { id: "left-a", x: 22, y: 22, depth: 2, rotate: 1.4, side: "right" },
    { id: "left-b", x: 23, y: 51, depth: 1, rotate: -1.8, side: "right" },
  ],
  [
    { id: "right-top-a", x: 73, y: 18, depth: 1, rotate: -1.3, side: "left" },
    { id: "right-top-b", x: 74, y: 39, depth: 2, rotate: 1.8, side: "left" },
  ],
  [
    { id: "right-bottom-a", x: 70, y: 62, depth: 1, rotate: -1.2, side: "left" },
    { id: "right-bottom-b", x: 71, y: 85, depth: 2, rotate: 2.2, side: "left" },
  ],
];

const decorativeNodes: DecorativeNode[] = [
  { id: "d1", x: 8, y: 15, depth: 0, size: 4, tone: "muted" },
  { id: "d2", x: 18, y: 39, depth: 1, size: 5, tone: "warm" },
  { id: "d3", x: 31, y: 18, depth: 2, size: 3, tone: "accent" },
  { id: "d4", x: 37, y: 53, depth: 0, size: 4, tone: "muted" },
  { id: "d5", x: 11, y: 82, depth: 2, size: 3, tone: "warm" },
  { id: "d6", x: 33, y: 81, depth: 1, size: 4, tone: "muted" },
  { id: "d7", x: 43, y: 28, depth: 0, size: 3, tone: "muted" },
  { id: "d8", x: 47, y: 75, depth: 2, size: 5, tone: "warm" },
  { id: "d9", x: 55, y: 16, depth: 1, size: 3, tone: "muted" },
  { id: "d10", x: 58, y: 61, depth: 0, size: 4, tone: "muted" },
  { id: "d11", x: 68, y: 14, depth: 2, size: 4, tone: "warm" },
  { id: "d12", x: 72, y: 49, depth: 0, size: 3, tone: "muted" },
  { id: "d13", x: 82, y: 12, depth: 1, size: 5, tone: "muted" },
  { id: "d14", x: 92, y: 29, depth: 2, size: 3, tone: "accent" },
  { id: "d15", x: 72, y: 78, depth: 1, size: 4, tone: "warm" },
  { id: "d16", x: 94, y: 82, depth: 0, size: 4, tone: "muted" },
  { id: "d17", x: 7, y: 54, depth: 2, size: 3, tone: "muted" },
  { id: "d18", x: 20, y: 9, depth: 1, size: 4, tone: "warm" },
  { id: "d19", x: 89, y: 44, depth: 0, size: 3, tone: "muted" },
  { id: "d20", x: 64, y: 37, depth: 2, size: 4, tone: "accent" },
  { id: "d21", x: 28, y: 58, depth: 1, size: 3, tone: "muted" },
  { id: "d22", x: 53, y: 89, depth: 0, size: 4, tone: "warm" },
  { id: "d23", x: 81, y: 88, depth: 2, size: 3, tone: "muted" },
  { id: "d24", x: 16, y: 63, depth: 0, size: 4, tone: "accent" },
];

const ambientLines: PlotMapLine[] = [
  { id: "a1", x1: 8, y1: 15, x2: 31, y2: 18, depth: 0, kind: "ambient" },
  { id: "a2", x1: 18, y1: 39, x2: 37, y2: 53, depth: 1, kind: "ambient" },
  { id: "a3", x1: 37, y1: 53, x2: 47, y2: 75, depth: 1, kind: "ambient" },
  { id: "a4", x1: 47, y1: 75, x2: 72, y2: 78, depth: 2, kind: "ambient" },
  { id: "a5", x1: 55, y1: 16, x2: 82, y2: 12, depth: 1, kind: "ambient" },
  { id: "a6", x1: 64, y1: 37, x2: 92, y2: 29, depth: 2, kind: "ambient" },
  { id: "a7", x1: 72, y1: 49, x2: 89, y2: 44, depth: 0, kind: "ambient" },
  { id: "a8", x1: 72, y1: 78, x2: 94, y2: 82, depth: 1, kind: "ambient" },
  { id: "a9", x1: 11, y1: 82, x2: 33, y2: 81, depth: 2, kind: "ambient" },
  { id: "a10", x1: 7, y1: 54, x2: 16, y2: 63, depth: 2, kind: "ambient" },
  { id: "a11", x1: 43, y1: 28, x2: 58, y2: 61, depth: 0, kind: "ambient" },
  { id: "a12", x1: 53, y1: 89, x2: 81, y2: 88, depth: 0, kind: "ambient" },
];

export function AuthPlotMapBackdrop() {
  const queryClient = useQueryClient();
  const reducedMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const layerRefs = useRef<Array<HTMLDivElement | SVGSVGElement | null>>([]);
  const frameRef = useRef<number | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const chapterGraph = useMemo(() => buildChapterGraph(readCachedChapters(queryClient)), [queryClient]);
  const renderedLines = chapterGraph.lines.length ? chapterGraph.lines : ambientLines;

  useEffect(() => {
    const rootElement = rootRef.current;

    if (rootElement === null || reducedMotion || process.env.NODE_ENV === "test") {
      return;
    }

    const motionRoot: HTMLDivElement = rootElement;
    const desktopQuery = window.matchMedia("(min-width: 1024px)");

    if (!desktopQuery.matches) {
      return;
    }

    registerPlottyGsapPlugins();

    const layerTweens = layerRefs.current.map((layer) =>
      layer
        ? {
            x: gsap.quickTo(layer, "x", { duration: 0.42, ease: "power3.out" }),
            y: gsap.quickTo(layer, "y", { duration: 0.42, ease: "power3.out" }),
          }
        : null,
    );

    function resetMotion() {
      layerTweens.forEach((tween) => {
        tween?.x(0);
        tween?.y(0);
      });
    }

    function updateMotion() {
      frameRef.current = null;

      const rect = motionRoot.getBoundingClientRect();
      const pointerX = pointerRef.current.x;
      const pointerY = pointerRef.current.y;
      const isNearRoot =
        pointerX >= rect.left - 120 &&
        pointerX <= rect.right + 120 &&
        pointerY >= rect.top - 120 &&
        pointerY <= rect.bottom + 120;

      if (!isNearRoot || !rect.width || !rect.height) {
        resetMotion();
        return;
      }

      const normalizedX = (pointerX - rect.left) / rect.width - 0.5;
      const normalizedY = (pointerY - rect.top) / rect.height - 0.5;

      layerTweens.forEach((tween, index) => {
        const drift = LAYER_DRIFT[index % LAYER_DRIFT.length];

        tween?.x(normalizedX * drift);
        tween?.y(normalizedY * drift * 0.62);
      });
    }

    function scheduleMotion(event: PointerEvent) {
      pointerRef.current.x = event.clientX;
      pointerRef.current.y = event.clientY;

      if (frameRef.current === null) {
        frameRef.current = window.requestAnimationFrame(updateMotion);
      }
    }

    function handleWindowBlur() {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }

      resetMotion();
    }

    window.addEventListener("pointermove", scheduleMotion, { passive: true });
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }

      window.removeEventListener("pointermove", scheduleMotion);
      window.removeEventListener("blur", handleWindowBlur);
      resetMotion();
    };
  }, [reducedMotion]);

  return (
    <div ref={rootRef} className="plotty-auth-plot-map" aria-hidden="true">
      {[0, 1, 2].map((depth) => (
        <div
          key={`layer-${depth}`}
          ref={(node) => {
            layerRefs.current[depth] = node;
          }}
          className="plotty-auth-plot-map-layer"
          data-depth={depth}
        >
          {decorativeNodes
            .filter((node) => node.depth === depth)
            .map((node, index) => (
              <span
                key={node.id}
                className="plotty-auth-plot-map-dot"
                data-tone={node.tone}
                style={
                  {
                    "--plot-map-x": `${node.x}%`,
                    "--plot-map-y": `${node.y}%`,
                    "--plot-map-size": `${node.size}px`,
                    "--plot-map-delay": `${index * 120}ms`,
                  } as PlotMapStyle
                }
              />
            ))}

          {chapterGraph.tiles
            .filter((tile) => tile.layout.depth === depth)
            .map((tile) => (
              <span
                key={tile.id}
                className="plotty-auth-plot-map-story-tile"
                data-kind="chapter"
                data-size={tile.layout.size}
                style={
                  {
                    "--plot-map-x": `${tile.layout.x}%`,
                    "--plot-map-y": `${tile.layout.y}%`,
                    "--plot-map-rotate": `${tile.layout.rotate}deg`,
                  } as PlotMapStyle
                }
              >
                <span className="plotty-auth-plot-map-story-tile-media">
                  <Image
                    src={tile.imageUrl}
                    alt=""
                    fill
                    sizes="10rem"
                    loading="lazy"
                    draggable={false}
                    unoptimized={isUnoptimizedImageUrl(tile.imageUrl)}
                  />
                </span>
                <span className="plotty-auth-plot-map-story-tile-caption">
                  <span>{tile.title}</span>
                  <span>{tile.meta}</span>
                </span>
              </span>
            ))}

          {chapterGraph.labels
            .filter((label) => label.layout.depth === depth)
            .map((label) => (
              <span
                key={label.id}
                className="plotty-auth-plot-map-info-label"
                data-kind={label.kind}
                data-side={label.layout.side}
                style={
                  {
                    "--plot-map-x": `${label.layout.x}%`,
                    "--plot-map-y": `${label.layout.y}%`,
                    "--plot-map-rotate": `${label.layout.rotate}deg`,
                  } as PlotMapStyle
                }
              >
                <span className="plotty-auth-plot-map-info-kind">{label.kind}</span>
                <span className="plotty-auth-plot-map-info-name">{label.name}</span>
                {label.detail ? <span className="plotty-auth-plot-map-info-detail">{label.detail}</span> : null}
              </span>
            ))}
        </div>
      ))}

      <svg
        ref={(node) => {
          layerRefs.current[3] = node;
        }}
        className="plotty-auth-plot-map-lines"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {renderedLines.map((line) => (
          <line
            key={line.id}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            className="plotty-auth-plot-map-line"
            data-depth={line.depth}
            data-kind={line.kind ?? "ambient"}
          />
        ))}
      </svg>
    </div>
  );
}

function readCachedChapters(queryClient: QueryClient): CachedChapterSeed[] {
  if (process.env.NEXT_PUBLIC_API_MOCKING === "enabled") {
    return [];
  }

  const wikiByChapterId = new Map<string, ChapterWiki>();
  const chaptersById = new Map<string, Omit<CachedChapterSeed, "imageUrl"> & { imageUrl?: string }>();
  const storyMetaByChapterId = readCachedChapterStoryMeta(queryClient);

  queryClient.getQueriesData<ChapterWiki>({ queryKey: ["stories", "chapter-wiki"] }).forEach(([queryKey, wiki]) => {
    const chapterId = getChapterIdFromQueryKey(queryKey);

    if (chapterId && wiki) {
      wikiByChapterId.set(chapterId, wiki);
    }
  });

  const chapterEntries = [
    ...queryClient.getQueriesData<ChapterDetails>({ queryKey: ["stories", "chapter"] }),
    ...queryClient.getQueriesData<ChapterDetails>({ queryKey: ["stories", "chapter-editor"] }),
  ];

  chapterEntries.forEach(([queryKey, chapter]) => {
    addCachedChapter(chaptersById, chapter, getChapterIdFromQueryKey(queryKey));
  });

  const chapters: CachedChapterSeed[] = [];

  chaptersById.forEach((chapter) => {
    if (!chapter.imageUrl || !chapter.title.trim()) {
      return;
    }

    const storyMeta = storyMetaByChapterId.get(chapter.id);

    chapters.push({
      ...chapter,
      imageUrl: chapter.imageUrl,
      number: chapter.number ?? storyMeta?.number,
      storyTitle: chapter.storyTitle ?? storyMeta?.storyTitle,
      wiki: chapter.wiki ?? wikiByChapterId.get(chapter.id),
    });
  });

  const chapterStoryTitles = new Set(chapters.map((chapter) => chapter.storyTitle).filter(Boolean));

  readCachedStoryListTiles(queryClient).forEach((storyTile) => {
    if (chapterStoryTitles.has(storyTile.title)) {
      return;
    }

    chapters.push(storyTile);
    chapterStoryTitles.add(storyTile.title);
  });

  return chapters.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, CHAPTER_TILE_LIMIT);
}

function readCachedStoryListTiles(queryClient: QueryClient): CachedChapterSeed[] {
  const storiesById = new Map<string, StoryListItem>();

  queryClient.getQueriesData<StoriesResponse>({ queryKey: ["stories", "list"] }).forEach(([, response]) => {
    response?.items.forEach((story) => {
      const imageUrl = sanitizeImageUrl(story.coverImageUrl);

      if (!imageUrl || !story.title.trim()) {
        return;
      }

      const current = storiesById.get(story.id);

      if (!current || story.updatedAt.localeCompare(current.updatedAt) > 0) {
        storiesById.set(story.id, story);
      }
    });
  });

  return Array.from(storiesById.values())
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((story) => ({
      id: `story-cover-${story.id}`,
      title: story.title.trim(),
      updatedAt: story.updatedAt,
      imageUrl: sanitizeImageUrl(story.coverImageUrl) ?? "",
      labels: storyToLabels(story),
      metaOverride: getStoryCoverMeta(story),
    }))
    .filter((story) => story.imageUrl);
}

function readCachedChapterStoryMeta(queryClient: QueryClient) {
  const metadata = new Map<string, CachedChapterStoryMeta>();
  const storyEntries = [
    ...queryClient.getQueriesData<StoryDetails>({ queryKey: ["stories", "details"] }),
    ...queryClient.getQueriesData<StoryDetails>({ queryKey: ["stories", "details-by-id"] }),
  ];

  storyEntries.forEach(([, story]) => {
    story?.chapters.forEach((chapter, index) => {
      metadata.set(chapter.id, {
        storyTitle: story.title,
        number: chapter.number ?? index + 1,
      });
    });
  });

  return metadata;
}

function addCachedChapter(
  chaptersById: Map<string, Omit<CachedChapterSeed, "imageUrl"> & { imageUrl?: string }>,
  chapter: ChapterDetails | undefined,
  fallbackId: string,
) {
  if (!chapter) {
    return;
  }

  const id = chapter.id || fallbackId;
  const title = (chapter.draftTitle ?? chapter.title).trim();
  const imageUrl = sanitizeImageUrl(chapter.imageUrl);

  if (!id || !title) {
    return;
  }

  const current = chaptersById.get(id);

  chaptersById.set(id, {
    id,
    title,
    updatedAt: chapter.updatedAt,
    imageUrl: imageUrl ?? current?.imageUrl,
    number: chapter.number ?? current?.number,
    storyTitle: chapter.storyTitle ?? current?.storyTitle,
    wordCount: chapter.wordCount ?? current?.wordCount,
    wiki: current?.wiki,
  });
}

function getChapterIdFromQueryKey(queryKey: QueryKey) {
  for (let index = queryKey.length - 1; index >= 0; index -= 1) {
    const value = queryKey[index];

    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return "";
}

function buildChapterGraph(chapters: CachedChapterSeed[]): ChapterGraph {
  const tiles: ChapterGraphTile[] = [];
  const labels: ChapterGraphLabel[] = [];
  const lines: PlotMapLine[] = [];

  chapters.forEach((chapter, index) => {
    const layout = chapterTileLayouts[index];

    if (!layout) {
      return;
    }

    const tileId = `${chapter.id}-tile`;
    const tileLabels = (chapter.labels ?? wikiToLabels(chapter.wiki)).slice(0, WIKI_LABELS_PER_TILE);

    tiles.push({
      id: tileId,
      title: chapter.title,
      meta: getChapterMeta(chapter),
      imageUrl: chapter.imageUrl,
      layout,
    });

    tileLabels.forEach((label, labelIndex) => {
      const labelLayout = wikiLabelLayouts[index]?.[labelIndex];

      if (!labelLayout) {
        return;
      }

      const labelId = `${tileId}-${labelLayout.id}`;

      labels.push({
        ...label,
        id: labelId,
        tileId,
        layout: labelLayout,
      });
      lines.push({
        id: `${tileId}-line-${labelLayout.id}`,
        x1: layout.x,
        y1: layout.y,
        x2: labelLayout.x,
        y2: labelLayout.y,
        depth: labelLayout.depth,
        kind: "chapter",
      });
    });
  });

  return { tiles, labels, lines };
}

function wikiToLabels(wiki?: ChapterWiki): WikiLabelSeed[] {
  if (!wiki) {
    return [];
  }

  return [
    ...normalizeWikiEntities("Персонаж", wiki.characters),
    ...normalizeWikiEntities("Локация", wiki.locations),
    ...normalizeWikiEntities("Предмет", wiki.items),
  ];
}

function storyToLabels(story: StoryListItem): WikiLabelSeed[] {
  const labels: WikiLabelSeed[] = [];

  if (story.fandom) {
    labels.push({ kind: "Фандом", name: story.fandom });
  }

  if (story.ratingLabel) {
    labels.push({ kind: "Рейтинг", name: story.ratingLabel });
  }

  if (story.sizeLabel) {
    labels.push({ kind: "Размер", name: story.sizeLabel });
  }

  story.tags.forEach((tag) => {
    labels.push({
      kind: "Тег",
      name: tag.name,
      detail: tag.category,
    });
  });

  const seen = new Set<string>();

  return labels.filter((label) => {
    const key = `${label.kind}:${label.name}`;

    if (!label.name.trim() || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function getStoryCoverMeta(story: StoryListItem) {
  const chapterPart =
    story.chaptersCount > 0
      ? `${story.chaptersCount} ${pluralizeRu(story.chaptersCount, ["глава", "главы", "глав"])}`
      : "";

  return [story.fandom, story.ratingLabel, story.sizeLabel ?? chapterPart, story.sizeLabel ? chapterPart : ""]
    .filter(Boolean)
    .slice(0, 2)
    .join(" · ");
}

function normalizeWikiEntities(kind: WikiLabelSeed["kind"], value: unknown): WikiLabelSeed[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item: ChapterWikiEntity | unknown) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const entity = item as ChapterWikiEntity;
    const name = typeof entity.name === "string" ? entity.name.trim() : "";
    const detail =
      typeof entity.state === "string" && entity.state.trim()
        ? entity.state.trim()
        : typeof entity.description === "string" && entity.description.trim()
          ? entity.description.trim()
          : undefined;

    return name ? [{ kind, name, detail }] : [];
  });
}

function getChapterMeta(chapter: CachedChapterSeed) {
  if (chapter.metaOverride) {
    return chapter.metaOverride;
  }

  const titleAlreadyLooksNumbered = /^глава\s+\d+/i.test(chapter.title.trim());
  const chapterPart =
    titleAlreadyLooksNumbered ? "" : typeof chapter.number === "number" ? `Глава ${chapter.number}` : "Глава";
  const wordsPart =
    typeof chapter.wordCount === "number" && chapter.wordCount > 0
      ? `${chapter.wordCount} ${pluralizeRu(chapter.wordCount, ["слово", "слова", "слов"])}`
      : "";

  return [chapter.storyTitle, chapterPart || wordsPart, chapterPart ? wordsPart : ""]
    .filter(Boolean)
    .slice(0, 2)
    .join(" · ");
}
