"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { BookOpen, CalendarDays, Heart, List, MessageCircle, Tag, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { useAuth } from "@/entities/auth/model/auth-context";
import {
  chapterDetailsQueryOptions,
  chaptersViewedQueryOptions,
  storyDetailsQueryOptions,
} from "@/entities/story/api/stories-api";
import { useStoryLikeMutation } from "@/entities/story/api/story-like-hooks";
import { getGeneratedStoryCoverUrl } from "@/entities/story/model/generated-image-cache";
import { publicChaptersForReader } from "@/entities/story/model/story-query";
import type { StoriesResponse } from "@/entities/story/model/types";
import { isAuthError } from "@/shared/api/fetch-json";
import { STORY_ANNOTATION_PLACEHOLDER } from "@/shared/config/story-annotation";
import { routes } from "@/shared/config/routes";
import { cn } from "@/shared/lib/utils";
import { Button, ButtonLink } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { AnimatedList, AnimatedTabPanel } from "@/shared/ui/motion";
import { StoryRevealButtonLink, StoryRevealLink } from "@/shared/ui/story-reveal-transition";
import { SegmentedControl, TabButton } from "@/shared/ui/tabs";
import { PlottyPageShell, PlottySectionCard } from "@/widgets/layout/plotty-page-shell";

import {
  ChapterSortButton,
  sortChaptersForDisplay,
  type ChapterSortDirection,
} from "./chapter-list-sort";
import { StoryCoverPreview, storyCoverPlaceholderSrc } from "./story-cover-preview";
import { StoryCollectionControl } from "./story-collection-control";
import { StoryTagLinkChip } from "./story-tag-link";
import { StoryShelfControl } from "./story-shelf-control";

type MobileStorySection = "description" | "chapters" | "info";

const storyTitleMinFontRem = 2.65;
const titleSoftHyphen = "­";

let titleMeasureCanvas: HTMLCanvasElement | null = null;

type AdaptiveStoryTitleState = {
  sourceTitle: string;
  renderedTitle: string;
  fontSizePx?: number;
  hyphenated: boolean;
};

export function StoryDetailsScreen({ slug }: { slug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const searchParamsString = searchParams.toString();
  const { isAuthenticated } = useAuth();
  const [activeMobileSection, setActiveMobileSection] = useState<MobileStorySection>(() =>
    getInitialMobileSection(new URLSearchParams(searchParamsString)),
  );
  const [chapterSortDirection, setChapterSortDirection] = useState<ChapterSortDirection>("asc");
  const storyQuery = useQuery(storyDetailsQueryOptions(slug));
  const readerChapters = useMemo(
    () => (storyQuery.data ? publicChaptersForReader(storyQuery.data.chapters) : []),
    [storyQuery.data],
  );
  const sortedReaderChapters = useMemo(
    () => sortChaptersForDisplay(readerChapters, chapterSortDirection),
    [chapterSortDirection, readerChapters],
  );
  const chaptersScrollRef = useRef<HTMLDivElement | null>(null);
  const firstChapter = readerChapters[0] ?? null;
  const [fallbackCoverLoadRequested, setFallbackCoverLoadRequested] = useState(false);
  const [localGeneratedCoverUrl, setLocalGeneratedCoverUrl] = useState("");
  const cachedStoryCoverImage = findCachedStoryCoverImage(queryClient, slug);
  const storyCoverImage =
    storyQuery.data?.coverImageUrl ?? cachedStoryCoverImage ?? (localGeneratedCoverUrl || undefined);
  const fallbackChapterCoverQuery = useQuery({
    ...chapterDetailsQueryOptions(firstChapter?.id ?? ""),
    enabled: Boolean(storyQuery.data && !storyCoverImage && fallbackCoverLoadRequested && firstChapter?.id),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
  const chaptersViewedQuery = useQuery({
    ...chaptersViewedQueryOptions(slug),
    enabled: Boolean(isAuthenticated && storyQuery.data && readerChapters.length),
  });
  const viewedByChapterId = useMemo(() => {
    const items = chaptersViewedQuery.data?.items ?? [];

    return new Map(items.map((item) => [item.chapterId, item.viewed]));
  }, [chaptersViewedQuery.data?.items]);
  const firstReadableChapter = useMemo(() => {
    if (!readerChapters.length) {
      return null;
    }

    if (!isAuthenticated || !chaptersViewedQuery.isSuccess) {
      return readerChapters[0];
    }

    return readerChapters.find((chapter) => viewedByChapterId.get(chapter.id) !== true) ?? readerChapters[0];
  }, [chaptersViewedQuery.isSuccess, isAuthenticated, readerChapters, viewedByChapterId]);
  const likeMutation = useStoryLikeMutation({
    storyId: storyQuery.data?.id ?? "",
    likesCount: storyQuery.data?.likesCount,
    viewerHasLiked: Boolean(storyQuery.data?.viewerHasLiked),
  });

  useLayoutEffect(() => {
    setActiveMobileSection(getInitialMobileSection(new URLSearchParams(searchParamsString)));
  }, [searchParamsString]);

  useEffect(() => {
    setLocalGeneratedCoverUrl(getGeneratedStoryCoverUrl(slug) ?? "");
  }, [slug]);

  useEffect(() => {
    setFallbackCoverLoadRequested(false);
  }, [slug]);

  useEffect(() => {
    if (!storyQuery.data || storyCoverImage || !firstChapter?.id) {
      return;
    }

    const requestIdleCallback = window.requestIdleCallback;
    const cancelIdleCallback = window.cancelIdleCallback;
    let timeoutId = 0;
    let idleId = 0;

    if (requestIdleCallback && cancelIdleCallback) {
      idleId = requestIdleCallback(() => setFallbackCoverLoadRequested(true), { timeout: 900 });

      return () => cancelIdleCallback(idleId);
    }

    timeoutId = window.setTimeout(() => setFallbackCoverLoadRequested(true), 250);

    return () => window.clearTimeout(timeoutId);
  }, [firstChapter?.id, storyCoverImage, storyQuery.data]);

  if (storyQuery.isLoading) {
    return (
      <PlottyPageShell
        pageTitle="История загружается"
        pageDescription="Собираем метаданные истории и список глав."
      >
        <div className="h-72 rounded-[var(--plotty-radius-lg)] bg-white/40" />
      </PlottyPageShell>
    );
  }

  if (storyQuery.isError || !storyQuery.data) {
    return (
      <PlottyPageShell
        pageTitle="История не найдена"
        pageDescription="Либо slug неверный, либо бэкенд не отдал данные."
      >
        <EmptyState title="История не найдена" description="Вернитесь в каталог и выберите другую историю." />
      </PlottyPageShell>
    );
  }

  const story = storyQuery.data;
  const storyDescription = story.aiHint?.trim() ? story.aiHint : STORY_ANNOTATION_PLACEHOLDER;
  const displayCoverImage = storyCoverImage ?? fallbackChapterCoverQuery.data?.imageUrl ?? undefined;
  const revealCoverImage = displayCoverImage ?? storyCoverPlaceholderSrc;
  const readChapter = firstReadableChapter ?? firstChapter;
  const viewerHasLiked = Boolean(story.viewerHasLiked);
  const genericTags = story.tags.filter((tag) => !["completion", "rating", "size", "directionality"].includes(tag.category ?? ""));

  async function handleToggleLike() {
    try {
      await likeMutation.toggleLike();
    } catch (error) {
      if (isAuthError(error)) {
        router.push(routes.auth({ next: routes.story(slug) }));
      }
    }
  }

  function selectMobileSection(section: MobileStorySection) {
    setActiveMobileSection(section);
  }

  function toggleChapterSortDirection() {
    setChapterSortDirection((current) => (current === "asc" ? "desc" : "asc"));
    window.requestAnimationFrame(() => {
      chaptersScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  return (
    <PlottyPageShell suppressPageIntro>
      <div className="plotty-story-details-layout grid gap-5 min-[1331px]:grid-cols-[minmax(0,1fr)_21rem]">
        <main className="min-w-0 space-y-5">
          <PlottySectionCard className="plotty-panel-enter overflow-hidden p-0">
            <div className="grid lg:grid-cols-[minmax(18rem,28rem)_minmax(0,1fr)]">
              <StoryCoverPreview
                title={story.title}
                imageUrl={displayCoverImage}
                isLoading={!displayCoverImage && fallbackChapterCoverQuery.isLoading}
                enableLightbox
                className="self-start rounded-[var(--plotty-radius-lg)] border-0 border-b border-[var(--plotty-line)] lg:border-b-0 lg:border-r"
              />

              <div className="space-y-5 p-5 sm:p-6 lg:p-8">
                <div className="w-full min-w-0 space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--plotty-muted)]">
                    {story.author?.username ? (
                      <Link
                        href={routes.user(story.author.username)}
                        prefetch={false}
                        className="inline-flex items-center gap-1.5 font-semibold hover:text-[var(--plotty-accent)]"
                      >
                        <UserRound className="size-4" aria-hidden="true" />
                        Автор {story.author.username}
                      </Link>
                    ) : null}
                    <span aria-hidden="true">•</span>
                    <span>{`Обновлена ${new Date(story.updatedAt).toLocaleDateString("ru-RU")}`}</span>
                    <span aria-hidden="true">•</span>
                    <span>
                      {readerChapters.length} {getChapterLabel(readerChapters.length)}
                    </span>
                  </div>
                  <AdaptiveStoryTitle title={story.title} />
                </div>

                {genericTags.length ? (
                  <div className="flex flex-wrap gap-2">
                    {genericTags.map((tag) => (
                      <StoryTagLinkChip key={tag.id} tag={tag} />
                    ))}
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {readChapter ? (
                    <StoryRevealButtonLink
                      href={routes.chapter(story.slug, readChapter.number ?? 1)}
                      variant="primary"
                      size="lg"
                      className="max-sm:min-h-12 max-sm:px-3 max-sm:text-sm"
                      revealTitle={story.title}
                      revealCoverUrl={revealCoverImage}
                    >
                      <BookOpen className="size-5" aria-hidden="true" />
                      Читать
                    </StoryRevealButtonLink>
                  ) : null}
                  {readChapter ? (
                    <ButtonLink
                      href={`${routes.chapter(story.slug, readChapter.number ?? 1)}#comments`}
                      variant="secondary"
                      className="max-sm:min-h-12 max-sm:px-3 max-sm:text-sm"
                    >
                      <MessageCircle className="size-4" aria-hidden="true" />
                      Комментарии
                    </ButtonLink>
                  ) : null}
                  <Button
                    type="button"
                    onClick={() => void handleToggleLike()}
                    disabled={likeMutation.isPending}
                    variant={viewerHasLiked ? "primary" : "secondary"}
                    aria-pressed={viewerHasLiked}
                    aria-label={viewerHasLiked ? "Убрать лайк" : "Поставить лайк"}
                    className="plotty-like-pop col-span-2 max-sm:min-h-12 max-sm:px-3 max-sm:text-sm"
                  >
                    <Heart className="size-4" fill={viewerHasLiked ? "currentColor" : "none"} aria-hidden="true" />
                    Мне нравится
                    <span className="rounded-full bg-[rgba(31,26,22,0.08)] px-2 py-0.5 text-xs">
                      {formatCount(story.likesCount)}
                    </span>
                  </Button>
                </div>

                {isAuthenticated ? (
                  <div className="grid gap-3 lg:hidden">
                    <StoryShelfControl storyId={story.id} compact className="max-w-none" />
                    <StoryCollectionControl storyId={story.id} compact className="max-w-none" />
                  </div>
                ) : null}

              </div>

              <div className="hidden space-y-2 border-t border-[var(--plotty-line)] p-5 sm:p-6 lg:col-span-2 lg:block lg:px-8 lg:pb-8 lg:pt-6">
                <h2 className="plotty-label">Аннотация</h2>
                <p className="plotty-body max-w-5xl text-[var(--plotty-ink-soft)]">{storyDescription}</p>
              </div>
            </div>
          </PlottySectionCard>

          <SegmentedControl className="lg:!hidden">
            <TabButton type="button" isActive={activeMobileSection === "description"} onClick={() => selectMobileSection("description")}>
              Описание
            </TabButton>
            <TabButton type="button" isActive={activeMobileSection === "chapters"} onClick={() => selectMobileSection("chapters")}>
              Главы
            </TabButton>
            <TabButton type="button" isActive={activeMobileSection === "info"} onClick={() => selectMobileSection("info")}>
              О истории
            </TabButton>
          </SegmentedControl>

          <AnimatedTabPanel activeKey={activeMobileSection} panelKey="description" className="lg:hidden">
            <PlottySectionCard id="story-content" title="Аннотация">
              <p className="plotty-body text-[var(--plotty-ink-soft)]">{storyDescription}</p>
            </PlottySectionCard>
          </AnimatedTabPanel>

          <PlottySectionCard
            id="chapters"
            title={
              <span className="flex items-center justify-between gap-3">
                <span>Главы</span>
                {readerChapters.length > 1 ? (
                  <ChapterSortButton
                    chapterCount={readerChapters.length}
                    direction={chapterSortDirection}
                    onToggle={toggleChapterSortDirection}
                  />
                ) : null}
              </span>
            }
            description={`${readerChapters.length} ${getChapterLabel(readerChapters.length)}`}
            className={cn(activeMobileSection === "chapters" && "plotty-motion-tab-panel", activeMobileSection === "chapters" ? undefined : "max-lg:hidden")}
          >
            {readerChapters.length ? (
              <AnimatedList
                items={sortedReaderChapters}
                getKey={(chapter) => chapter.id}
                listRef={chaptersScrollRef}
                className="plotty-scroll-panel plotty-story-details-chapter-list divide-y divide-[var(--plotty-line)] rounded-[var(--plotty-radius-md)] border border-[var(--plotty-line)] bg-[rgba(255,253,249,0.62)]"
                renderItem={(chapter) => {
                  const viewed = viewedByChapterId.get(chapter.id);

                  return (
                    <div className="plotty-lift-panel grid gap-3 px-4 py-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
                      <span className="plotty-card-title text-[1.35rem]">{chapter.number ?? "—"}.</span>
                      <div className="min-w-0">
                        <StoryRevealLink
                          href={routes.chapter(story.slug, chapter.number ?? 1)}
                          className="plotty-story-title-anchor plotty-card-title text-[1.18rem] hover:text-[var(--plotty-accent)]"
                          revealTitle={chapter.title}
                          revealCoverUrl={revealCoverImage}
                        >
                          <span className="plotty-story-title-text">{chapter.title}</span>
                        </StoryRevealLink>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-[var(--plotty-muted)]">
                          <span>{new Date(chapter.updatedAt).toLocaleDateString("ru-RU")}</span>
                          {isAuthenticated ? (
                            <span className={viewed ? "text-[var(--plotty-olive)]" : "text-[var(--plotty-accent)]"}>
                              {viewed ? "Прочитано" : "Новая"}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <StoryRevealButtonLink
                        href={routes.chapter(story.slug, chapter.number ?? 1)}
                        variant="secondary"
                        size="sm"
                        revealTitle={chapter.title}
                        revealCoverUrl={revealCoverImage}
                      >
                        Читать
                      </StoryRevealButtonLink>
                    </div>
                  );
                }}
              />
            ) : (
              <EmptyState title="У истории пока нет глав" description="Загляните позже или выберите другую историю из каталога." />
            )}
          </PlottySectionCard>
        </main>

        <aside className="plotty-stagger space-y-4">
          <PlottySectionCard id="story-info" title="О истории" variant="sidebar" className={cn("plotty-stagger-item plotty-lift-panel", activeMobileSection === "info" && "plotty-motion-tab-panel", activeMobileSection === "info" ? undefined : "max-lg:hidden")}>
            <div className="grid gap-3 text-sm">
              <InfoRow icon={<Tag className="size-4" />} label="Фандом" value={story.fandom ?? "Не указан"} />
              <InfoRow icon={<BookOpen className="size-4" />} label="Рейтинг" value={story.ratingLabel ?? "Не указан"} />
              <InfoRow icon={<CalendarDays className="size-4" />} label="Статус" value={story.statusLabel ?? "Не указан"} />
              <InfoRow icon={<List className="size-4" />} label="Размер" value={story.sizeLabel ?? "Не указан"} />
            </div>
          </PlottySectionCard>

          {isAuthenticated ? (
            <PlottySectionCard title="Моя полка" variant="sidebar" className="plotty-stagger-item plotty-lift-panel max-lg:hidden">
              <div className="space-y-3">
                <StoryShelfControl storyId={story.id} className="max-w-none" />
                <StoryCollectionControl storyId={story.id} className="max-w-none" />
              </div>
            </PlottySectionCard>
          ) : null}
        </aside>
      </div>
    </PlottyPageShell>
  );
}

function AdaptiveStoryTitle({ title }: { title: string }) {
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const [titleState, setTitleState] = useState<AdaptiveStoryTitleState>(() => createDefaultTitleState(title));
  const activeTitleState = titleState.sourceTitle === title ? titleState : createDefaultTitleState(title);

  useLayoutEffect(() => {
    const titleNode = titleRef.current;

    if (!titleNode) {
      return;
    }

    let isCancelled = false;

    function updateTitleFit() {
      const currentTitleNode = titleRef.current;

      if (isCancelled || !currentTitleNode?.isConnected) {
        return;
      }

      const nextState = measureAdaptiveTitle(currentTitleNode, title);

      if (!nextState) {
        return;
      }

      setTitleState((currentState) => {
        if (areTitleStatesEqual(currentState, nextState)) {
          return currentState;
        }

        return nextState;
      });
    }

    updateTitleFit();

    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateTitleFit);
    resizeObserver?.observe(titleNode);
    window.addEventListener("resize", updateTitleFit);

    const fontsReady = document.fonts?.ready;
    void fontsReady?.then(() => {
      updateTitleFit();
    });

    return () => {
      isCancelled = true;
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateTitleFit);
    };
  }, [title]);

  return (
    <h1
      ref={titleRef}
      className="plotty-page-title plotty-adaptive-story-title"
      data-hyphenated={activeTitleState.hyphenated ? "true" : undefined}
      aria-label={activeTitleState.hyphenated ? title : undefined}
      style={activeTitleState.fontSizePx ? { fontSize: `${activeTitleState.fontSizePx}px` } : undefined}
    >
      {activeTitleState.renderedTitle}
    </h1>
  );
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="plotty-info-row grid grid-cols-[1.25rem_1fr] gap-x-3 gap-y-0.5">
      <span className="mt-0.5 text-[var(--plotty-muted)]" aria-hidden="true">
        {icon}
      </span>
      <div className="grid grid-cols-[minmax(5rem,0.75fr)_minmax(0,1fr)] gap-3">
        <span className="text-[var(--plotty-muted)]">{label}</span>
        <span className="font-semibold text-[var(--plotty-ink)]">{value}</span>
      </div>
    </div>
  );
}

function formatCount(value?: number) {
  return (value ?? 0).toLocaleString("ru-RU");
}

function getChapterLabel(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return "глава";
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return "главы";
  }

  return "глав";
}

function getInitialMobileSection(searchParams: URLSearchParams): MobileStorySection {
  const tab = searchParams.get("tab");

  if (tab === "chapters") {
    return "chapters";
  }

  if (tab === "info") {
    return "info";
  }

  return "description";
}

function createDefaultTitleState(title: string): AdaptiveStoryTitleState {
  return {
    sourceTitle: title,
    renderedTitle: title,
    hyphenated: false,
  };
}

function measureAdaptiveTitle(titleNode: HTMLHeadingElement, title: string): AdaptiveStoryTitleState | null {
  const measureContext = getTitleMeasureContext();

  if (!measureContext) {
    return createDefaultTitleState(title);
  }

  const availableWidth = Math.floor(titleNode.getBoundingClientRect().width);

  if (availableWidth <= 0) {
    return null;
  }

  const previousInlineFontSize = titleNode.style.fontSize;
  titleNode.style.fontSize = "";

  const computedStyle = window.getComputedStyle(titleNode);
  const rootFontSizePx = parseFloat(window.getComputedStyle(document.documentElement).fontSize) || 16;
  const minFontPx = storyTitleMinFontRem * rootFontSizePx;
  const maxFontPx = Math.max(parseFloat(computedStyle.fontSize) || minFontPx, minFontPx);
  const fontStyle = computedStyle.fontStyle;
  const fontVariant = computedStyle.fontVariant;
  const fontWeight = computedStyle.fontWeight;
  const fontFamily = computedStyle.fontFamily;

  titleNode.style.fontSize = previousInlineFontSize;

  const titleWords = splitTitleWords(title);

  if (!titleWords.length || titleWordsFit(titleWords, measureContext, availableWidth, maxFontPx, fontStyle, fontVariant, fontWeight, fontFamily)) {
    return createDefaultTitleState(title);
  }

  if (!titleWordsFit(titleWords, measureContext, availableWidth, minFontPx, fontStyle, fontVariant, fontWeight, fontFamily)) {
    setTitleMeasureFont(measureContext, minFontPx, fontStyle, fontVariant, fontWeight, fontFamily);

    return {
      sourceTitle: title,
      renderedTitle: hyphenateLongTitleTokens(title, measureContext, availableWidth),
      fontSizePx: roundFontSize(minFontPx),
      hyphenated: true,
    };
  }

  let lowFontPx = minFontPx;
  let highFontPx = maxFontPx;

  for (let step = 0; step < 10; step += 1) {
    const middleFontPx = (lowFontPx + highFontPx) / 2;

    if (titleWordsFit(titleWords, measureContext, availableWidth, middleFontPx, fontStyle, fontVariant, fontWeight, fontFamily)) {
      lowFontPx = middleFontPx;
    } else {
      highFontPx = middleFontPx;
    }
  }

  return {
    sourceTitle: title,
    renderedTitle: title,
    fontSizePx: roundFontSize(lowFontPx),
    hyphenated: false,
  };
}

function getTitleMeasureContext() {
  if (typeof document === "undefined" || typeof CanvasRenderingContext2D === "undefined") {
    return null;
  }

  titleMeasureCanvas ??= document.createElement("canvas");

  return titleMeasureCanvas.getContext("2d");
}

function splitTitleWords(title: string) {
  return title.split(/\s+/).filter(Boolean);
}

function titleWordsFit(
  words: string[],
  measureContext: CanvasRenderingContext2D,
  availableWidth: number,
  fontSizePx: number,
  fontStyle: string,
  fontVariant: string,
  fontWeight: string,
  fontFamily: string,
) {
  setTitleMeasureFont(measureContext, fontSizePx, fontStyle, fontVariant, fontWeight, fontFamily);

  return words.every((word) => measureContext.measureText(word).width <= availableWidth);
}

function setTitleMeasureFont(
  measureContext: CanvasRenderingContext2D,
  fontSizePx: number,
  fontStyle: string,
  fontVariant: string,
  fontWeight: string,
  fontFamily: string,
) {
  measureContext.font = `${fontStyle || "normal"} ${fontVariant || "normal"} ${fontWeight || "400"} ${fontSizePx}px ${fontFamily}`;
}

function hyphenateLongTitleTokens(title: string, measureContext: CanvasRenderingContext2D, availableWidth: number) {
  const safeWidth = Math.max(availableWidth * 0.92, 1);

  return title
    .split(/(\s+)/)
    .map((token) => {
      if (!token.trim() || measureContext.measureText(token).width <= availableWidth || token.includes(titleSoftHyphen)) {
        return token;
      }

      return softHyphenateToken(token, measureContext, safeWidth);
    })
    .join("");
}

function softHyphenateToken(token: string, measureContext: CanvasRenderingContext2D, maxChunkWidth: number) {
  const chunks: string[] = [];
  let currentChunk = "";

  for (const character of splitGraphemes(token)) {
    const nextChunk = `${currentChunk}${character}`;

    if (currentChunk && measureContext.measureText(nextChunk).width > maxChunkWidth) {
      chunks.push(currentChunk);
      currentChunk = character;
    } else {
      currentChunk = nextChunk;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks.join(titleSoftHyphen);
}

type IntlSegmenterConstructor = new (
  locale: string,
  options: { granularity: "grapheme" },
) => {
  segment(value: string): Iterable<{ segment: string }>;
};

function splitGraphemes(value: string) {
  const Segmenter = (Intl as typeof Intl & { Segmenter?: IntlSegmenterConstructor }).Segmenter;

  if (Segmenter) {
    return Array.from(new Segmenter("ru", { granularity: "grapheme" }).segment(value), (part) => part.segment);
  }

  return Array.from(value);
}

function roundFontSize(fontSizePx: number) {
  return Math.round(fontSizePx * 100) / 100;
}

function areTitleStatesEqual(currentState: AdaptiveStoryTitleState, nextState: AdaptiveStoryTitleState) {
  const currentFontSize = currentState.fontSizePx ?? 0;
  const nextFontSize = nextState.fontSizePx ?? 0;

  return (
    currentState.sourceTitle === nextState.sourceTitle &&
    currentState.renderedTitle === nextState.renderedTitle &&
    currentState.hyphenated === nextState.hyphenated &&
    Math.abs(currentFontSize - nextFontSize) < 0.5
  );
}

function findCachedStoryCoverImage(queryClient: QueryClient, slug: string) {
  const listQueries = queryClient.getQueriesData<StoriesResponse>({ queryKey: ["stories", "list"] });

  for (const [, data] of listQueries) {
    const match = data?.items.find((story) => story.slug === slug && story.coverImageUrl);

    if (match?.coverImageUrl) {
      return match.coverImageUrl;
    }
  }

  return undefined;
}
