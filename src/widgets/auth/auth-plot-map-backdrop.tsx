"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { useQueryClient, type QueryClient, type QueryKey } from "@tanstack/react-query";

import {
  chapterWikiQueryOptions,
  storiesQueryOptions,
  storyDetailsQueryOptions,
} from "@/entities/story/api/stories-api";
import type {
  ChapterListItem,
  ChapterWiki,
  ChapterWikiEntity,
  StoriesResponse,
  StoriesQuery,
  StoryDetails,
  StoryListItem,
} from "@/entities/story/model/types";
import { getGeneratedStoryCoverUrl } from "@/entities/story/model/generated-image-cache";
import { isUnoptimizedImageUrl, sanitizeImageUrl } from "@/shared/lib/safe-url";
import { pluralizeRu } from "@/shared/lib/utils";

type PlotMapStorySeed = {
  id: string;
  slug: string;
  title: string;
  updatedAt: string;
  imageUrl: string;
  chaptersCount: number;
  fandom?: string;
  labels: WikiLabelSeed[];
};

type AuthPlotMapCacheSnapshot = {
  savedAt: number;
  stories: PlotMapStorySeed[];
};

type WikiLabelSeed = {
  kind: "Персонаж" | "Локация" | "Предмет" | "Фандом" | "Тег" | "Описание";
  name: string;
  detail?: string;
};

type Depth = 0 | 1 | 2;

type ChapterTileLayout = {
  id: string;
  x: number;
  y: number;
  depth: Depth;
  rotate: number;
  size: "sm" | "md" | "lg";
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
  sourceDepth: Depth;
  targetDepth: Depth;
  kind?: "chapter";
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

type DriftPoint = {
  x: number;
  y: number;
};

const STORY_TILE_LIMIT = 6;
const LABELS_PER_STORY_LIMIT = 3;
const AUTH_PLOT_MAP_CACHE_KEY = "plotty.authPlotMap.v3";
const AUTH_PLOT_MAP_CACHE_TTL_MS = 2 * 60 * 60 * 1000;
const AUTH_PLOT_MAP_QUERY: StoriesQuery = {
  tags: [],
  q: "",
  page: 1,
  pageSize: 32,
  sort: "updated-desc",
};
const CORE_TAG_CATEGORIES = new Set(["directionality", "rating", "completion", "size", "warning"]);
const WIKI_ENTITY_LIMITS = {
  characters: 5,
  locations: 4,
  items: 4,
} as const;
const DEPTHS = [0, 1, 2] as const;
const LAYER_DRIFT_BY_DEPTH: Record<Depth, number> = {
  0: 5,
  1: -8,
  2: 12,
};
const LINE_POSITION_PRECISION = 3;
const DRIFT_EASE = 0.18;
const storedLabelKinds = new Set<WikiLabelSeed["kind"]>(["Персонаж", "Локация", "Предмет", "Фандом", "Тег", "Описание"]);

const storyTileLayouts: ChapterTileLayout[] = [
  { id: "story-left-top", x: 12, y: 24, depth: 2, rotate: -3.2, size: "lg" },
  { id: "story-right-top", x: 88, y: 24, depth: 1, rotate: 2.4, size: "md" },
  { id: "story-right-bottom", x: 88, y: 77, depth: 2, rotate: -2.1, size: "lg" },
  { id: "story-left-bottom", x: 12, y: 77, depth: 1, rotate: 2.1, size: "md" },
  { id: "story-left-mid", x: 22, y: 51, depth: 0, rotate: -1.7, size: "sm" },
  { id: "story-right-mid", x: 78, y: 51, depth: 0, rotate: 1.6, size: "md" },
];

const graphLabelLayouts: WikiLabelLayout[] = [
  { id: "left-top", x: 24, y: 17, depth: 2, rotate: 1.3, side: "right" },
  { id: "right-top", x: 76, y: 17, depth: 1, rotate: -1.2, side: "left" },
  { id: "left-upper", x: 24, y: 39, depth: 1, rotate: -1.5, side: "right" },
  { id: "right-upper", x: 76, y: 39, depth: 2, rotate: 1.4, side: "left" },
  { id: "left-lower", x: 24, y: 63, depth: 2, rotate: 1.5, side: "right" },
  { id: "right-lower", x: 76, y: 63, depth: 2, rotate: 1.8, side: "left" },
  { id: "left-bottom", x: 24, y: 92, depth: 0, rotate: -1.1, side: "right" },
  { id: "right-bottom", x: 76, y: 92, depth: 1, rotate: 1.2, side: "left" },
  { id: "left-edge-top", x: 7, y: 48, depth: 0, rotate: 1.1, side: "right" },
  { id: "right-edge-top", x: 93, y: 48, depth: 0, rotate: -1.3, side: "left" },
  { id: "left-edge-bottom", x: 9, y: 91, depth: 0, rotate: 0.9, side: "right" },
  { id: "right-edge-bottom", x: 91, y: 91, depth: 1, rotate: -1.1, side: "left" },
];

export function AuthPlotMapBackdrop() {
  const queryClient = useQueryClient();
  const [enrichedStories, setEnrichedStories] = useState<PlotMapStorySeed[]>([]);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const layerRefs = useRef<Array<HTMLDivElement | null>>([]);
  const lineRefs = useRef<Array<SVGLineElement | null>>([]);
  const driftFrameRef = useRef<number | null>(null);
  const currentDriftRef = useRef<Record<Depth, DriftPoint>>(createZeroDrift());
  const targetDriftRef = useRef<Record<Depth, DriftPoint>>(createZeroDrift());
  const enrichmentRequestRef = useRef<Promise<PlotMapStorySeed[]> | null>(null);
  const cachedStories = useMemo(() => readCachedStorySeeds(queryClient), [queryClient]);
  const graphStories = useMemo(
    () => mergeStorySeeds([...enrichedStories, ...cachedStories]).slice(0, STORY_TILE_LIMIT),
    [cachedStories, enrichedStories],
  );
  const chapterGraph = useMemo(() => buildChapterGraph(graphStories), [graphStories]);

  useEffect(() => {
    if (process.env.NODE_ENV === "test" || typeof window === "undefined") {
      return;
    }

    const desktopQuery = window.matchMedia("(min-width: 1024px)");

    if (!desktopQuery.matches) {
      return;
    }

    const freshStories = readStoredPlotMapStories();

    if (freshStories.length) {
      setEnrichedStories(freshStories);
      return;
    }

    const staleStories = readStoredPlotMapStories({ allowStale: true });

    if (staleStories.length) {
      setEnrichedStories(staleStories);
    }

    let cancelled = false;
    const cancelRefresh = scheduleAuthPlotMapRefresh(() => {
      if (cancelled) {
        return;
      }

      const request = enrichmentRequestRef.current ?? fetchAuthPlotMapStories(queryClient);

      enrichmentRequestRef.current = request;

      request
        .then((stories) => {
          if (cancelled || !stories.length) {
            return;
          }

          setEnrichedStories(stories);
          writeStoredPlotMapStories(stories);
        })
        .catch(() => {
          if (enrichmentRequestRef.current === request) {
            enrichmentRequestRef.current = null;
          }
        });
    });

    return () => {
      cancelled = true;
      cancelRefresh();
    };
  }, [queryClient]);

  useEffect(() => {
    lineRefs.current.length = chapterGraph.lines.length;
    applyPlotMapDrift({
      drifts: currentDriftRef.current,
      layerRefs: layerRefs.current,
      lineRefs: lineRefs.current,
      rootElement: rootRef.current,
    });
  }, [chapterGraph.lines.length]);

  useEffect(() => {
    const rootElement = rootRef.current;

    if (rootElement === null || process.env.NODE_ENV === "test" || typeof window === "undefined") {
      return;
    }

    const motionRoot = rootElement;
    const desktopQuery = window.matchMedia("(min-width: 1024px)");

    if (!desktopQuery.matches) {
      return;
    }

    const layers = layerRefs.current;
    const lines = lineRefs.current;

    function animateDrift() {
      driftFrameRef.current = null;

      const current = currentDriftRef.current;
      const target = targetDriftRef.current;
      let isSettled = true;

      DEPTHS.forEach((depth) => {
        const nextX = current[depth].x + (target[depth].x - current[depth].x) * DRIFT_EASE;
        const nextY = current[depth].y + (target[depth].y - current[depth].y) * DRIFT_EASE;

        if (Math.abs(nextX - target[depth].x) > 0.02 || Math.abs(nextY - target[depth].y) > 0.02) {
          isSettled = false;
        }

        current[depth] = {
          x: isSettled ? target[depth].x : nextX,
          y: isSettled ? target[depth].y : nextY,
        };
      });

      applyPlotMapDrift({
        drifts: current,
        layerRefs: layers,
        lineRefs: lines,
        rootElement: motionRoot,
      });

      if (!isSettled) {
        driftFrameRef.current = window.requestAnimationFrame(animateDrift);
      }
    }

    function startDriftAnimation() {
      if (driftFrameRef.current === null) {
        driftFrameRef.current = window.requestAnimationFrame(animateDrift);
      }
    }

    function setTargetDrift(drifts: Record<Depth, DriftPoint>) {
      targetDriftRef.current = drifts;
      startDriftAnimation();
    }

    function resetMotion() {
      setTargetDrift(createZeroDrift());
    }

    function handlePointerMove(event: PointerEvent) {
      const rect = motionRoot.getBoundingClientRect();
      const isNearRoot =
        event.clientX >= rect.left - 120 &&
        event.clientX <= rect.right + 120 &&
        event.clientY >= rect.top - 120 &&
        event.clientY <= rect.bottom + 120;

      if (!isNearRoot || !rect.width || !rect.height) {
        resetMotion();
        return;
      }

      const normalizedX = (event.clientX - rect.left) / rect.width - 0.5;
      const normalizedY = (event.clientY - rect.top) / rect.height - 0.5;

      setTargetDrift(getDepthDrifts(normalizedX, normalizedY));
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("blur", resetMotion);

    return () => {
      if (driftFrameRef.current !== null) {
        window.cancelAnimationFrame(driftFrameRef.current);
        driftFrameRef.current = null;
      }

      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("blur", resetMotion);
      currentDriftRef.current = createZeroDrift();
      targetDriftRef.current = createZeroDrift();
      applyPlotMapDrift({
        drifts: currentDriftRef.current,
        layerRefs: layers,
        lineRefs: lines,
        rootElement: motionRoot,
      });
    };
  }, [chapterGraph.lines.length]);

  return (
    <div ref={rootRef} className="plotty-auth-plot-map" aria-hidden="true">
      <svg
        className="plotty-auth-plot-map-lines"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {chapterGraph.lines.map((line, index) => (
          <line
            key={line.id}
            ref={(node) => {
              lineRefs.current[index] = node;
            }}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            className="plotty-auth-plot-map-line"
            data-base-x1={line.x1}
            data-base-y1={line.y1}
            data-base-x2={line.x2}
            data-base-y2={line.y2}
            data-depth={line.depth}
            data-kind={line.kind ?? "chapter"}
            data-source-depth={line.sourceDepth}
            data-target-depth={line.targetDepth}
          />
        ))}
      </svg>

      {[0, 1, 2].map((depth) => (
        <div
          key={`layer-${depth}`}
          ref={(node) => {
            layerRefs.current[depth] = node;
          }}
          className="plotty-auth-plot-map-layer"
          data-depth={depth}
        >
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
    </div>
  );
}

function createZeroDrift(): Record<Depth, DriftPoint> {
  return {
    0: { x: 0, y: 0 },
    1: { x: 0, y: 0 },
    2: { x: 0, y: 0 },
  };
}

function getDepthDrifts(normalizedX: number, normalizedY: number): Record<Depth, DriftPoint> {
  return DEPTHS.reduce(
    (drifts, depth) => {
      const drift = LAYER_DRIFT_BY_DEPTH[depth];

      drifts[depth] = {
        x: normalizedX * drift,
        y: normalizedY * drift * 0.62,
      };

      return drifts;
    },
    createZeroDrift(),
  );
}

function applyPlotMapDrift({
  drifts,
  layerRefs,
  lineRefs,
  rootElement,
}: {
  drifts: Record<Depth, DriftPoint>;
  layerRefs: Array<HTMLDivElement | null>;
  lineRefs: Array<SVGLineElement | null>;
  rootElement: HTMLDivElement | null;
}) {
  DEPTHS.forEach((depth) => {
    const layer = layerRefs[depth];
    const drift = drifts[depth];

    if (layer) {
      layer.style.transform = `translate3d(${drift.x.toFixed(2)}px, ${drift.y.toFixed(2)}px, 0)`;
    }
  });

  if (!rootElement) {
    return;
  }

  const rect = rootElement.getBoundingClientRect();

  if (!rect.width || !rect.height) {
    return;
  }

  lineRefs.forEach((line) => {
    if (!line) {
      return;
    }

    const sourceDepth = getLineDepth(line.dataset.sourceDepth);
    const targetDepth = getLineDepth(line.dataset.targetDepth);
    const sourceDrift = drifts[sourceDepth];
    const targetDrift = drifts[targetDepth];
    const sourceX = (sourceDrift.x / rect.width) * 100;
    const sourceY = (sourceDrift.y / rect.height) * 100;
    const targetX = (targetDrift.x / rect.width) * 100;
    const targetY = (targetDrift.y / rect.height) * 100;

    line.setAttribute("x1", formatLineCoordinate(getLineBaseCoordinate(line.dataset.baseX1) + sourceX));
    line.setAttribute("y1", formatLineCoordinate(getLineBaseCoordinate(line.dataset.baseY1) + sourceY));
    line.setAttribute("x2", formatLineCoordinate(getLineBaseCoordinate(line.dataset.baseX2) + targetX));
    line.setAttribute("y2", formatLineCoordinate(getLineBaseCoordinate(line.dataset.baseY2) + targetY));
  });
}

function getLineDepth(value: string | undefined): Depth {
  const depth = Number(value);

  return depth === 0 || depth === 1 || depth === 2 ? depth : 0;
}

function getLineBaseCoordinate(value: string | undefined) {
  const coordinate = Number(value);

  return Number.isFinite(coordinate) ? coordinate : 0;
}

function formatLineCoordinate(value: number) {
  return value.toFixed(LINE_POSITION_PRECISION);
}

function readCachedStorySeeds(queryClient: QueryClient): PlotMapStorySeed[] {
  const storiesById = new Map<string, StoryListItem>();
  const detailsByStoryId = readCachedStoryDetails(queryClient);
  const wikiByChapterId = readCachedChapterWikis(queryClient);

  queryClient.getQueriesData<StoriesResponse>({ queryKey: ["stories", "list"] }).forEach(([, response]) => {
    response?.items.forEach((story) => {
      if (!story.title.trim()) {
        return;
      }

      const current = storiesById.get(story.id);

      if (!current || story.updatedAt.localeCompare(current.updatedAt) > 0) {
        storiesById.set(story.id, story);
      }
    });
  });

  const seeds = selectPlotMapStoryCandidates(Array.from(storiesById.values())).flatMap((story) => {
    const details = detailsByStoryId.get(story.id);
    const wikiChapterId = details ? getSecondPublishedChapterId(details.chapters) : "";
    const wiki = wikiChapterId ? wikiByChapterId.get(wikiChapterId) : undefined;
    const seed = storyToGraphSeed(story, { details, wiki });

    return seed ? [seed] : [];
  });

  return mergeStorySeeds(seeds).slice(0, STORY_TILE_LIMIT);
}

function readCachedStoryDetails(queryClient: QueryClient) {
  const detailsByStoryId = new Map<string, StoryDetails>();

  [
    ...queryClient.getQueriesData<StoryDetails>({ queryKey: ["stories", "details"] }),
    ...queryClient.getQueriesData<StoryDetails>({ queryKey: ["stories", "details-by-id"] }),
  ].forEach(([, story]) => {
    if (story?.id) {
      detailsByStoryId.set(story.id, story);
    }
  });

  return detailsByStoryId;
}

function readCachedChapterWikis(queryClient: QueryClient) {
  const wikiByChapterId = new Map<string, ChapterWiki>();

  queryClient.getQueriesData<ChapterWiki>({ queryKey: ["stories", "chapter-wiki"] }).forEach(([queryKey, wiki]) => {
    const chapterId = getChapterIdFromQueryKey(queryKey);

    if (chapterId && wiki) {
      wikiByChapterId.set(chapterId, wiki);
    }
  });

  return wikiByChapterId;
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

function scheduleAuthPlotMapRefresh(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  let hasRun = false;
  const run = () => {
    if (hasRun) {
      return;
    }

    hasRun = true;
    callback();
  };
  const requestIdleCallback = window.requestIdleCallback;
  const cancelIdleCallback = window.cancelIdleCallback;

  if (requestIdleCallback && cancelIdleCallback) {
    const idleId = requestIdleCallback(run, { timeout: 1200 });

    return () => cancelIdleCallback(idleId);
  }

  const timeoutId = window.setTimeout(run, 250);

  return () => window.clearTimeout(timeoutId);
}

function selectPlotMapStoryCandidates(stories: StoryListItem[]) {
  const coveredStories = stories.filter((story) => story.title.trim() && getStoryImageUrl(story));
  const eligibleStories = coveredStories.filter((story) => story.chaptersCount >= 2);
  const selected = selectDiverseStories(eligibleStories);

  if (selected.length >= STORY_TILE_LIMIT) {
    return selected;
  }

  const selectedIds = new Set(selected.map((story) => story.id));

  for (const story of coveredStories) {
    if (selectedIds.has(story.id)) {
      continue;
    }

    selected.push(story);
    selectedIds.add(story.id);

    if (selected.length >= STORY_TILE_LIMIT) {
      break;
    }
  }

  return selected;
}

function selectDiverseStories(stories: StoryListItem[]) {
  const selected: StoryListItem[] = [];
  const selectedIds = new Set<string>();
  const usedFandoms = new Set<string>();

  for (const story of stories) {
    const fandom = getStoryFandom(story);

    if (!fandom || usedFandoms.has(fandom)) {
      continue;
    }

    selected.push(story);
    selectedIds.add(story.id);
    usedFandoms.add(fandom);

    if (selected.length >= STORY_TILE_LIMIT) {
      return selected;
    }
  }

  for (const story of stories) {
    if (selectedIds.has(story.id)) {
      continue;
    }

    selected.push(story);

    if (selected.length >= STORY_TILE_LIMIT) {
      break;
    }
  }

  return selected;
}

function getStoryImageUrl(story: StoryListItem, details?: StoryDetails) {
  return sanitizeImageUrl(story.coverImageUrl ?? details?.coverImageUrl ?? getGeneratedStoryCoverUrl(story.slug));
}

function getStoryFandom(story: Pick<StoryListItem, "fandom" | "tags">) {
  return story.fandom ?? getTagName(story.tags, "directionality");
}

function getTagName(tags: StoryListItem["tags"], category: string) {
  return tags.find((tag) => tag.category === category)?.name;
}

async function fetchAuthPlotMapStories(queryClient: QueryClient): Promise<PlotMapStorySeed[]> {
  const response = await queryClient.fetchQuery({
    ...storiesQueryOptions(AUTH_PLOT_MAP_QUERY),
    staleTime: AUTH_PLOT_MAP_CACHE_TTL_MS,
    gcTime: AUTH_PLOT_MAP_CACHE_TTL_MS * 2,
  });
  const candidates = selectPlotMapStoryCandidates(response.items);

  const detailEntries = await Promise.all(
    candidates.map(async (story) => ({
      story,
      details: story.slug
        ? await queryClient
            .fetchQuery({
              ...storyDetailsQueryOptions(story.slug),
              staleTime: AUTH_PLOT_MAP_CACHE_TTL_MS,
              gcTime: AUTH_PLOT_MAP_CACHE_TTL_MS * 2,
            })
            .catch(() => undefined)
        : undefined,
    })),
  );

  const wikiEntries = await Promise.all(
    detailEntries.map(async ({ details }) => {
      const wikiChapterId = details ? getSecondPublishedChapterId(details.chapters) : "";

      if (!wikiChapterId) {
        return undefined;
      }

      return queryClient
        .fetchQuery({
          ...chapterWikiQueryOptions(wikiChapterId),
          staleTime: AUTH_PLOT_MAP_CACHE_TTL_MS,
          gcTime: AUTH_PLOT_MAP_CACHE_TTL_MS * 2,
        })
        .catch(() => undefined);
    }),
  );

  const seeds = detailEntries.flatMap(({ story, details }, index) => {
    const seed = storyToGraphSeed(story, { details, wiki: wikiEntries[index] });

    return seed ? [seed] : [];
  });

  return mergeStorySeeds(seeds).slice(0, STORY_TILE_LIMIT);
}

function storyToGraphSeed(
  story: StoryListItem,
  options: { details?: StoryDetails; wiki?: ChapterWiki } = {},
): PlotMapStorySeed | null {
  const details = options.details;
  const title = (details?.title ?? story.title).trim();
  const imageUrl = getStoryImageUrl(story, details);

  if (!story.id || !title || !imageUrl) {
    return null;
  }

  const tags = details?.tags?.length ? details.tags : story.tags;
  const fandom = details?.fandom ?? story.fandom ?? getTagName(tags, "directionality");
  const labels = buildStoryLabels({
    fandom,
    tags,
    wiki: options.wiki,
    description: details?.description ?? story.description ?? details?.aiHint ?? story.aiHint,
  });

  return {
    id: story.id,
    slug: story.slug,
    title,
    updatedAt: details?.updatedAt ?? story.updatedAt,
    imageUrl,
    chaptersCount: details?.chapters.length ?? story.chaptersCount,
    fandom,
    labels,
  };
}

function mergeStorySeeds(stories: PlotMapStorySeed[]) {
  const storiesById = new Map<string, PlotMapStorySeed>();

  stories.forEach((story) => {
    const current = storiesById.get(story.id);

    if (!current) {
      storiesById.set(story.id, story);
      return;
    }

    storiesById.set(story.id, {
      ...current,
      ...story,
      imageUrl: story.imageUrl || current.imageUrl,
      labels: story.labels.length ? story.labels : current.labels,
    });
  });

  return Array.from(storiesById.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function getSecondPublishedChapterId(chapters: ChapterListItem[]) {
  let publishedCount = 0;

  for (const chapter of chapters) {
    if ((chapter.status ?? "published") !== "published") {
      continue;
    }

    publishedCount += 1;

    if (publishedCount === 2) {
      return chapter.id;
    }
  }

  return "";
}

function readStoredPlotMapStories(options: { allowStale?: boolean } = {}): PlotMapStorySeed[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawSnapshot = window.localStorage.getItem(AUTH_PLOT_MAP_CACHE_KEY);

    if (!rawSnapshot) {
      return [];
    }

    const snapshot = JSON.parse(rawSnapshot) as Partial<AuthPlotMapCacheSnapshot>;
    const savedAt = typeof snapshot.savedAt === "number" ? snapshot.savedAt : 0;

    if (!options.allowStale && Date.now() - savedAt > AUTH_PLOT_MAP_CACHE_TTL_MS) {
      return [];
    }

    if (!Array.isArray(snapshot.stories)) {
      return [];
    }

    return mergeStorySeeds(snapshot.stories.flatMap((story) => normalizeStoredStorySeed(story))).slice(0, STORY_TILE_LIMIT);
  } catch {
    return [];
  }
}

function writeStoredPlotMapStories(stories: PlotMapStorySeed[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const snapshot: AuthPlotMapCacheSnapshot = {
      savedAt: Date.now(),
      stories: stories.slice(0, STORY_TILE_LIMIT),
    };

    window.localStorage.setItem(AUTH_PLOT_MAP_CACHE_KEY, JSON.stringify(snapshot));
  } catch {
    // Decorative cache only; storage failures should not affect auth.
  }
}

function normalizeStoredStorySeed(value: unknown): PlotMapStorySeed[] {
  if (!value || typeof value !== "object") {
    return [];
  }

  const record = value as Record<string, unknown>;
  const id = getStoredString(record.id);
  const title = getStoredString(record.title);
  const updatedAt = getStoredString(record.updatedAt);
  const imageUrl = sanitizeImageUrl(getStoredString(record.imageUrl));

  if (!id || !title || !updatedAt || !imageUrl) {
    return [];
  }

  return [
    {
      id,
      slug: getStoredString(record.slug) || id,
      title,
      updatedAt,
      imageUrl,
      chaptersCount: getStoredNumber(record.chaptersCount),
      fandom: getStoredOptionalString(record.fandom),
      labels: normalizeStoredLabels(record.labels),
    },
  ];
}

function normalizeStoredLabels(value: unknown): WikiLabelSeed[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((label) => {
    if (!isRecord(label)) {
      return [];
    }

    const kind = getStoredString(label.kind);
    const name = getStoredString(label.name);

    if (!name || !isStoredLabelKind(kind)) {
      return [];
    }

    return [
      {
        kind,
        name,
        detail: getStoredOptionalString(label.detail),
      },
    ];
  });
}

function isStoredLabelKind(value: string): value is WikiLabelSeed["kind"] {
  return storedLabelKinds.has(value as WikiLabelSeed["kind"]);
}

function getStoredString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getStoredOptionalString(value: unknown) {
  const text = getStoredString(value);

  return text || undefined;
}

function getStoredNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function buildChapterGraph(stories: PlotMapStorySeed[]): ChapterGraph {
  const tiles: ChapterGraphTile[] = [];
  const labels: ChapterGraphLabel[] = [];
  const lines: PlotMapLine[] = [];
  const tileLabelEntries: Array<{ tileId: string; layout: ChapterTileLayout; labels: WikiLabelSeed[] }> = [];
  const labelsByKey = new Map<string, ChapterGraphLabel>();
  const connectionCounts = new Map<string, number>();

  stories.forEach((story, index) => {
    const layout = storyTileLayouts[index];

    if (!layout) {
      return;
    }

    const tileId = `${story.id}-tile`;

    tiles.push({
      id: tileId,
      title: story.title,
      meta: getStoryMeta(story),
      imageUrl: story.imageUrl,
      layout,
    });

    tileLabelEntries.push({
      tileId,
      layout,
      labels: storyToLabels(story),
    });
  });

  function connectLabel(
    { tileId, layout }: { tileId: string; layout: ChapterTileLayout },
    label: WikiLabelSeed,
  ) {
    const key = getLabelKey(label);
    let graphLabel = labelsByKey.get(key);

    if (!graphLabel) {
      const labelLayout = graphLabelLayouts[labels.length];

      if (!labelLayout) {
        return false;
      }

      graphLabel = {
        ...label,
        id: `label-${labels.length}-${makeStableId(key)}`,
        layout: labelLayout,
      };
      labelsByKey.set(key, graphLabel);
      labels.push(graphLabel);
    }

    const anchor = getTileLineAnchor(layout, graphLabel.layout);

    connectionCounts.set(graphLabel.id, (connectionCounts.get(graphLabel.id) ?? 0) + 1);
    lines.push({
      id: `${tileId}-line-${graphLabel.id}`,
      x1: anchor.x,
      y1: anchor.y,
      x2: graphLabel.layout.x,
      y2: graphLabel.layout.y,
      depth: graphLabel.layout.depth,
      sourceDepth: layout.depth,
      targetDepth: graphLabel.layout.depth,
      kind: "chapter",
    });

    return true;
  }

  tileLabelEntries.forEach((entry) => {
    const fandomLabel = entry.labels.find((label) => label.kind === "Фандом");

    if (fandomLabel) {
      connectLabel(entry, fandomLabel);
    }
  });

  tileLabelEntries.forEach((entry) => {
    let connectedForStory = entry.labels.some((label) => label.kind === "Фандом") ? 1 : 0;

    for (const label of entry.labels) {
      if (label.kind === "Фандом" || connectedForStory >= LABELS_PER_STORY_LIMIT) {
        continue;
      }

      if (connectLabel(entry, label)) {
        connectedForStory += 1;
      }
    }
  });

  labels.forEach((label) => {
    const connectionCount = connectionCounts.get(label.id) ?? 0;

    if (connectionCount > 1 && !label.detail) {
      label.detail = `${connectionCount} ${pluralizeRu(connectionCount, ["связь", "связи", "связей"])}`;
    }
  });

  return { tiles, labels, lines };
}

function buildStoryLabels({
  fandom,
  tags,
  wiki,
  description,
}: {
  fandom?: string;
  tags: StoryListItem["tags"];
  wiki?: ChapterWiki;
  description?: string;
}): WikiLabelSeed[] {
  const labels: WikiLabelSeed[] = [];

  if (fandom) {
    labels.push({ kind: "Фандом", name: fandom });
  }

  wikiToLabels(wiki).forEach((label) => labels.push(label));

  tags
    .filter((tag) => !CORE_TAG_CATEGORIES.has(tag.category ?? ""))
    .forEach((tag) => {
      labels.push({
        kind: "Тег",
        name: tag.name,
        detail: getTagCategoryLabel(tag.category),
      });
    });

  const descriptionLabel = truncateLabelText(description ?? "", 96);

  if (descriptionLabel) {
    labels.push({
      kind: "Описание",
      name: descriptionLabel,
    });
  }

  const seen = new Set<string>();

  return labels.filter((label) => {
    const key = getLabelKey(label);

    if (!label.name.trim() || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function wikiToLabels(wiki?: ChapterWiki): WikiLabelSeed[] {
  if (!wiki) {
    return [];
  }

  return [
    ...normalizeWikiEntities("Персонаж", wiki.characters).slice(0, WIKI_ENTITY_LIMITS.characters),
    ...normalizeWikiEntities("Локация", wiki.locations).slice(0, WIKI_ENTITY_LIMITS.locations),
    ...normalizeWikiEntities("Предмет", wiki.items).slice(0, WIKI_ENTITY_LIMITS.items),
  ];
}

function storyToLabels(story: PlotMapStorySeed): WikiLabelSeed[] {
  return story.labels;
}

function getStoryMeta(story: PlotMapStorySeed) {
  return story.chaptersCount > 0
    ? `${story.chaptersCount} ${pluralizeRu(story.chaptersCount, ["глава", "главы", "глав"])}`
    : "";
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

function getLabelKey(label: WikiLabelSeed) {
  return `${label.kind}:${label.name.trim().toLowerCase()}`;
}

function makeStableId(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "label";
}

function getTileLineAnchor(tileLayout: ChapterTileLayout, labelLayout: WikiLabelLayout) {
  const horizontalOffset = tileLayout.size === "lg" ? 5 : 4;
  const verticalOffset = labelLayout.y < tileLayout.y ? -3.5 : labelLayout.y > tileLayout.y ? 3.5 : 0;
  const x = tileLayout.x + (labelLayout.x < tileLayout.x ? -horizontalOffset : horizontalOffset);
  const y = tileLayout.y + verticalOffset;

  return {
    x: Math.min(100, Math.max(0, x)),
    y: Math.min(100, Math.max(0, y)),
  };
}

function truncateLabelText(value: string, maxLength: number) {
  const text = value.trim().replace(/\s+/g, " ");

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

function getTagCategoryLabel(category?: string) {
  if (category === "genre") {
    return "Жанр";
  }

  return category;
}
