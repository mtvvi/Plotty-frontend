"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import {
  chapterDetailsQueryOptions,
  likeStory,
  patchStorySummaryCaches,
  storyDetailsQueryOptions,
  unlikeStory,
} from "@/entities/story/api/stories-api";
import { isAuthError } from "@/shared/api/fetch-json";
import { publicChaptersForReader } from "@/entities/story/model/story-query";
import { STORY_ANNOTATION_PLACEHOLDER } from "@/shared/config/story-annotation";
import { routes } from "@/shared/config/routes";
import { Button, ButtonLink } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { TabButton } from "@/shared/ui/tabs";
import { PlottyAppMenu, PlottyPageShell, PlottySectionCard } from "@/widgets/layout/plotty-page-shell";

import { StoryCoverPreview } from "./story-cover-preview";
import { StoryShelfControl } from "./story-shelf-control";
import { StoryTagChip } from "./story-tag-chip";

type StorySection = "description" | "chapters";

export function StoryDetailsScreen({ slug }: { slug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const storyQuery = useQuery(storyDetailsQueryOptions(slug));
  const [activeSection, setActiveSection] = useState<StorySection>(getInitialSection(searchParams.get("tab")));
  const readerChapters = useMemo(
    () => (storyQuery.data ? publicChaptersForReader(storyQuery.data.chapters) : []),
    [storyQuery.data],
  );
  const firstChapter = readerChapters[0] ?? null;
  const firstChapterQuery = useQuery({
    ...chapterDetailsQueryOptions(firstChapter?.id ?? ""),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
  const likeMutation = useMutation({
    mutationFn: ({ liked, storyId }: { liked: boolean; storyId: string }) => (liked ? unlikeStory(storyId) : likeStory(storyId)),
  });

  useEffect(() => {
    setActiveSection(getInitialSection(searchParams.get("tab")));
  }, [searchParams]);

  if (storyQuery.isLoading) {
    return (
      <PlottyPageShell
        pageTitle="История загружается"
        pageDescription="Собираем метаданные истории и список глав."
        menuContent={({ closeMenu }) => <PlottyAppMenu onNavigate={closeMenu} />}
      >
        <div className="h-72 rounded-[24px] bg-white/40" />
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
  const displayCoverImage = firstChapterQuery.data?.imageUrl;
  const viewerHasLiked = Boolean(story.viewerHasLiked);
  const genericTags = story.tags.filter((tag) => !["completion", "rating", "size", "directionality"].includes(tag.category ?? ""));

  async function handleToggleLike() {
    const nextLiked = !viewerHasLiked;
    const previousLikesCount = story.likesCount ?? 0;

    patchStorySummaryCaches(queryClient, story.id, {
      likesCount: Math.max(previousLikesCount + (nextLiked ? 1 : -1), 0),
      viewerHasLiked: nextLiked,
    });

    try {
      const result = await likeMutation.mutateAsync({ liked: viewerHasLiked, storyId: story.id });

      patchStorySummaryCaches(queryClient, story.id, {
        likesCount: result.likesCount,
        viewerHasLiked: result.viewerHasLiked,
      });
    } catch (error) {
      patchStorySummaryCaches(queryClient, story.id, {
        likesCount: previousLikesCount,
        viewerHasLiked,
      });

      if (isAuthError(error)) {
        router.push(routes.auth({ next: routes.story(slug) }));
      }
    }
  }

  return (
    <PlottyPageShell suppressPageIntro showMobileBack mobileBackHref={routes.home} menuContent={({ closeMenu }) => <PlottyAppMenu onNavigate={closeMenu} />}>
      <div className="space-y-4 lg:space-y-5">
        <PlottySectionCard className="overflow-hidden p-0">
          <div className="grid gap-0 xl:grid-cols-[360px_minmax(0,1fr)]">
            <StoryCoverPreview
              title={story.title}
              imageUrl={displayCoverImage}
              className="h-full border-0 border-b border-[rgba(35,33,30,0.08)] xl:border-b-0 xl:border-r"
              imageClassName="h-full"
              fullHeight
            />

            <div className="space-y-5 p-4 sm:p-5 lg:p-6 xl:p-7">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="plotty-kicker">История</div>
                  <h1 className="plotty-page-title text-[2.15rem] leading-[0.95] sm:text-[2.85rem] xl:text-[3.35rem]">
                    {story.title}
                  </h1>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[14px] text-[var(--plotty-muted)]">
                  {story.fandom ? <span>{story.fandom}</span> : null}
                  {story.author?.username ? (
                    <Link href={routes.user(story.author.username)} className="font-semibold text-[var(--plotty-accent)] hover:underline">
                      {`Автор ${story.author.username}`}
                    </Link>
                  ) : null}
                  <span>
                    {readerChapters.length} {getChapterLabel(readerChapters.length)}
                  </span>
                </div>
                <p className="plotty-meta">{`Обновлена ${new Date(story.updatedAt).toLocaleString("ru-RU")}`}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {story.statusLabel ? <StoryMetaPill accent>{story.statusLabel}</StoryMetaPill> : null}
                {story.ratingLabel ? <StoryMetaPill>{story.ratingLabel}</StoryMetaPill> : null}
                {story.sizeLabel ? <StoryMetaPill>{story.sizeLabel}</StoryMetaPill> : null}
                {genericTags.map((tag) => (
                  <StoryTagChip key={tag.id} tag={tag} />
                ))}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  {firstChapter ? (
                    <ButtonLink href={routes.chapter(story.slug, firstChapter.number ?? 1)} variant="primary">
                      Читать
                    </ButtonLink>
                  ) : null}
                  <Button type="button" variant="secondary" onClick={() => setActiveSection("chapters")} disabled={!readerChapters.length}>
                    К главам
                  </Button>
                  {readerChapters[0] ? (
                    <ButtonLink href={`${routes.chapter(story.slug, readerChapters[0].number ?? 1)}#comments`} variant="secondary">
                      Комментарии
                    </ButtonLink>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void handleToggleLike()}
                    disabled={likeMutation.isPending}
                    className={`plotty-stat transition-colors ${
                      viewerHasLiked
                        ? "!border-transparent !bg-[var(--plotty-accent)] !text-white shadow-[0_10px_22px_rgba(188,95,61,0.2)]"
                        : "!bg-white !text-[var(--plotty-ink)]"
                    }`}
                    aria-pressed={viewerHasLiked}
                    aria-label={viewerHasLiked ? "Убрать лайк" : "Поставить лайк"}
                  >
                    <StatHeartIcon filled={viewerHasLiked} />
                    <span>{formatCount(story.likesCount)}</span>
                  </button>
                  <StoryShelfControl storyId={story.id} className="min-w-[10.5rem]" />
                </div>
              </div>

              <div className="rounded-[20px] border border-[rgba(41,38,34,0.08)] bg-[var(--plotty-panel-muted)] p-4">
                <p
                  className="plotty-body text-[15px] leading-7 text-[var(--plotty-muted)]"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {storyDescription}
                </p>
              </div>
            </div>
          </div>
        </PlottySectionCard>

        <div className="plotty-segmented">
          <TabButton type="button" isActive={activeSection === "description"} onClick={() => setActiveSection("description")}>
            Описание
          </TabButton>
          <TabButton type="button" isActive={activeSection === "chapters"} onClick={() => setActiveSection("chapters")}>
            Главы
          </TabButton>
        </div>

        <PlottySectionCard id="story-content" className="space-y-5">
          {activeSection === "description" ? (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
              <div className="space-y-4">
                <p className="plotty-body max-w-4xl text-[16px] leading-8 text-[var(--plotty-ink)] lg:text-[17px]">
                  {storyDescription}
                </p>
              </div>
              <div className="space-y-3 rounded-[22px] border border-[rgba(41,38,34,0.08)] bg-[var(--plotty-panel-muted)] p-4">
                <div className="plotty-section-title">Мета истории</div>
                <div className="grid gap-2 text-sm text-[var(--plotty-muted)]">
                  <span>{`Создана ${new Date(story.createdAt).toLocaleDateString("ru-RU")}`}</span>
                  <span>{`Обновлена ${new Date(story.updatedAt).toLocaleDateString("ru-RU")}`}</span>
                  {story.author?.username ? (
                    <Link href={routes.user(story.author.username)} className="font-semibold text-[var(--plotty-accent)] hover:underline">
                      {`Автор ${story.author.username}`}
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {activeSection === "chapters" ? (
            readerChapters.length ? (
              <div className="space-y-3">
                {readerChapters.map((chapter) => (
                  <div
                    key={chapter.id}
                    className="flex flex-col gap-4 rounded-[20px] border border-[rgba(41,38,34,0.08)] bg-white/76 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[rgba(188,95,61,0.08)] text-sm font-bold text-[var(--plotty-accent)]">
                        {chapter.number ?? "—"}
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="plotty-card-title text-[1.1rem] leading-7">
                          Глава {chapter.number}. {chapter.title}
                        </div>
                        <div className="plotty-meta text-sm">
                          {`Обновлена ${new Date(chapter.updatedAt).toLocaleString("ru-RU")}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <ButtonLink href={routes.chapter(story.slug, chapter.number ?? 1)} variant="primary">
                        Читать
                      </ButtonLink>
                      <ButtonLink href={`${routes.chapter(story.slug, chapter.number ?? 1)}#comments`} variant="secondary">
                        Комментарии
                      </ButtonLink>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="У истории пока нет глав" description="Загляните позже или выберите другую историю из каталога." />
            )
          ) : null}
        </PlottySectionCard>
      </div>
    </PlottyPageShell>
  );
}

function StoryMetaPill({
  children,
  accent = false,
}: {
  children: ReactNode;
  accent?: boolean;
}) {
  return (
    <span
      className={
        accent
          ? "rounded-full bg-[rgba(188,95,61,0.08)] px-3 py-2 text-[12px] font-semibold text-[var(--plotty-accent)]"
          : "rounded-full border border-[rgba(41,38,34,0.09)] bg-white/82 px-3 py-2 text-[12px] font-semibold text-[var(--plotty-muted)]"
      }
    >
      {children}
    </span>
  );
}

function StatHeartIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill={filled ? "currentColor" : "none"} aria-hidden="true">
      <path d="M8 13.3 2.9 8.6a3.2 3.2 0 0 1 4.5-4.5L8 4.7l.6-.6a3.2 3.2 0 1 1 4.5 4.5L8 13.3Z" stroke="currentColor" strokeWidth="1.35" />
    </svg>
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

function getInitialSection(value: string | null): StorySection {
  if (value === "chapters") {
    return "chapters";
  }

  return "description";
}
