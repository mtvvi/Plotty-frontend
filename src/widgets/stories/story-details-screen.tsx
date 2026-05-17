"use client";

import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, CalendarDays, Heart, List, MessageCircle, Tag, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/entities/auth/model/auth-context";
import {
  chapterDetailsQueryOptions,
  chaptersViewedQueryOptions,
  storyDetailsQueryOptions,
} from "@/entities/story/api/stories-api";
import { useStoryLikeMutation } from "@/entities/story/api/story-like-hooks";
import { publicChaptersForReader } from "@/entities/story/model/story-query";
import { isAuthError } from "@/shared/api/fetch-json";
import { STORY_ANNOTATION_PLACEHOLDER } from "@/shared/config/story-annotation";
import { routes } from "@/shared/config/routes";
import { Button, ButtonLink } from "@/shared/ui/button";
import { Chip } from "@/shared/ui/chip";
import { EmptyState } from "@/shared/ui/empty-state";
import { SegmentedControl, TabButton } from "@/shared/ui/tabs";
import { PlottyAppMenu, PlottyPageShell, PlottySectionCard } from "@/widgets/layout/plotty-page-shell";

import { StoryCoverPreview } from "./story-cover-preview";
import { StoryCollectionControl } from "./story-collection-control";
import { StoryShelfControl } from "./story-shelf-control";

type MobileStorySection = "description" | "chapters" | "info";

const storyTitleMinFontRem = 2.65;
const titleSoftHyphen = "\u00AD";

let titleMeasureCanvas: HTMLCanvasElement | null = null;

type AdaptiveStoryTitleState = {
  sourceTitle: string;
  renderedTitle: string;
  fontSizePx?: number;
  hyphenated: boolean;
};

export function StoryDetailsScreen({ slug }: { slug: string }) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [activeMobileSection, setActiveMobileSection] = useState<MobileStorySection>("description");
  const storyQuery = useQuery(storyDetailsQueryOptions(slug));
  const readerChapters = useMemo(
    () => (storyQuery.data ? publicChaptersForReader(storyQuery.data.chapters) : []),
    [storyQuery.data],
  );
  const firstChapter = readerChapters[0] ?? null;
  const firstChapterQuery = useQuery({
    ...chapterDetailsQueryOptions(firstChapter?.id ?? ""),
    enabled: Boolean(firstChapter?.id && !storyQuery.data?.coverImageUrl),
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
  const likeMutation = useStoryLikeMutation({
    storyId: storyQuery.data?.id ?? "",
    likesCount: storyQuery.data?.likesCount,
    viewerHasLiked: Boolean(storyQuery.data?.viewerHasLiked),
  });

  if (storyQuery.isLoading) {
    return (
      <PlottyPageShell
        pageTitle="История загружается"
        pageDescription="Собираем метаданные истории и список глав."
        menuContent={({ closeMenu }) => <PlottyAppMenu onNavigate={closeMenu} />}
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
        menuContent={({ closeMenu }) => <PlottyAppMenu onNavigate={closeMenu} />}
      >
        <EmptyState title="История не найдена" description="Вернитесь в каталог и выберите другую историю." />
      </PlottyPageShell>
    );
  }

  const story = storyQuery.data;
  const storyDescription = story.aiHint?.trim() ? story.aiHint : STORY_ANNOTATION_PLACEHOLDER;
  const displayCoverImage = story.coverImageUrl ?? firstChapterQuery.data?.imageUrl;
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

  return (
    <PlottyPageShell suppressPageIntro showMobileBack mobileBackHref={routes.home} menuContent={({ closeMenu }) => <PlottyAppMenu onNavigate={closeMenu} />}>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <main className="min-w-0 space-y-5">
          <PlottySectionCard className="overflow-hidden p-0">
            <div className="grid lg:grid-cols-[minmax(18rem,28rem)_minmax(0,1fr)]">
              <StoryCoverPreview
                title={story.title}
                imageUrl={displayCoverImage}
                className="self-start rounded-[var(--plotty-radius-lg)] border-0 border-b border-[var(--plotty-line)] lg:border-b-0 lg:border-r"
              />

              <div className="space-y-5 p-5 sm:p-6 lg:p-8">
                <div className="w-full min-w-0 space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--plotty-muted)]">
                    {story.author?.username ? (
                      <Link href={routes.user(story.author.username)} className="inline-flex items-center gap-1.5 font-semibold hover:text-[var(--plotty-accent)]">
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
                      <Chip key={tag.id} tone={tag.category === "warning" ? "gold" : "default"}>
                        {tag.name}
                      </Chip>
                    ))}
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
                  {firstChapter ? (
                    <ButtonLink
                      href={routes.chapter(story.slug, firstChapter.number ?? 1)}
                      variant="primary"
                      size="lg"
                      className="max-sm:min-h-12 max-sm:px-3 max-sm:text-sm"
                    >
                      <BookOpen className="size-5" aria-hidden="true" />
                      Читать
                    </ButtonLink>
                  ) : null}
                  {firstChapter ? (
                    <ButtonLink
                      href={`${routes.chapter(story.slug, firstChapter.number ?? 1)}#comments`}
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
                    className="max-sm:col-span-2 max-sm:min-h-12 max-sm:px-3 max-sm:text-sm"
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

                <div className="hidden space-y-2 border-t border-[var(--plotty-line)] pt-4 lg:block">
                  <h2 className="plotty-label">Аннотация</h2>
                  <p className="plotty-body max-w-4xl text-[var(--plotty-ink-soft)]">{storyDescription}</p>
                </div>
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

          <PlottySectionCard id="story-content" title="Аннотация" className={activeMobileSection === "description" ? "lg:hidden" : "hidden"}>
            <p className="plotty-body text-[var(--plotty-ink-soft)]">{storyDescription}</p>
          </PlottySectionCard>

          <PlottySectionCard
            id="chapters"
            title="Главы"
            description={`${readerChapters.length} ${getChapterLabel(readerChapters.length)}`}
            className={activeMobileSection === "chapters" ? undefined : "max-lg:hidden"}
          >
            {readerChapters.length ? (
              <div className="divide-y divide-[var(--plotty-line)] overflow-hidden rounded-[var(--plotty-radius-md)] border border-[var(--plotty-line)] bg-[rgba(255,253,249,0.62)]">
                {readerChapters.map((chapter) => {
                  const viewed = viewedByChapterId.get(chapter.id);

                  return (
                    <div key={chapter.id} className="grid gap-3 px-4 py-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
                      <span className="plotty-card-title text-[1.35rem]">{chapter.number ?? "—"}.</span>
                      <div className="min-w-0">
                        <Link
                          href={routes.chapter(story.slug, chapter.number ?? 1)}
                          className="plotty-card-title text-[1.18rem] hover:text-[var(--plotty-accent)]"
                        >
                          {chapter.title}
                        </Link>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-[var(--plotty-muted)]">
                          <span>{new Date(chapter.updatedAt).toLocaleDateString("ru-RU")}</span>
                          {isAuthenticated ? (
                            <span className={viewed ? "text-[var(--plotty-olive)]" : "text-[var(--plotty-accent)]"}>
                              {viewed ? "Прочитано" : "Новая"}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <ButtonLink href={routes.chapter(story.slug, chapter.number ?? 1)} variant="secondary" size="sm">
                        Читать
                      </ButtonLink>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState title="У истории пока нет глав" description="Загляните позже или выберите другую историю из каталога." />
            )}
          </PlottySectionCard>
        </main>

        <aside className="space-y-4">
          <PlottySectionCard id="story-info" title="О истории" variant="sidebar" className={activeMobileSection === "info" ? undefined : "max-lg:hidden"}>
            <div className="grid gap-3 text-sm">
              <InfoRow icon={<Tag className="size-4" />} label="Фандом" value={story.fandom ?? "Не указан"} />
              <InfoRow icon={<BookOpen className="size-4" />} label="Рейтинг" value={story.ratingLabel ?? "Не указан"} />
              <InfoRow icon={<CalendarDays className="size-4" />} label="Статус" value={story.statusLabel ?? "Не указан"} />
              <InfoRow icon={<List className="size-4" />} label="Размер" value={story.sizeLabel ?? "Не указан"} />
            </div>
          </PlottySectionCard>

          {isAuthenticated ? (
            <PlottySectionCard title="Моя полка" variant="sidebar" className="max-lg:hidden">
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
    <div className="grid grid-cols-[1.25rem_1fr] gap-x-3 gap-y-0.5">
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
