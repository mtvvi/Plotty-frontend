"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, FileText, MoreHorizontal, PenLine, Plus, Settings } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  chapterDetailsQueryOptions,
  createChapter,
  myStoriesQueryOptions,
  storyDetailsQueryOptions,
  storyKeys,
} from "@/entities/story/api/stories-api";
import type { StoryTag } from "@/entities/story/model/types";
import { defaultStoriesQuery, readerChapterNumberForChapterId } from "@/entities/story/model/story-query";
import { useAuth } from "@/entities/auth/model/auth-context";
import { STORY_ANNOTATION_PLACEHOLDER } from "@/shared/config/story-annotation";
import { isAuthError } from "@/shared/api/fetch-json";
import { routes } from "@/shared/config/routes";
import { getStoryTagCategoryLabel, groupStoryTags } from "@/shared/config/story-tags";
import { Button, ButtonLink } from "@/shared/ui/button";
import { Chip } from "@/shared/ui/chip";
import { EmptyState } from "@/shared/ui/empty-state";
import { Surface } from "@/shared/ui/card";

import { PlottyShell, ShellCard } from "./plotty-shell";
import { StoryCoverPreview } from "./story-cover-preview";

const emptyChapterDraft = "Черновик новой главы. Откройте редактор и продолжайте писать.";

export function StoryCreateScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const requestedStorySlug = searchParams.get("story") ?? "";
  const [selectedStorySlug, setSelectedStorySlug] = useState("");
  const storiesQuery = useQuery(myStoriesQueryOptions({ ...defaultStoriesQuery, pageSize: 50 }, { userId: user?.id }));
  const selectedStoryQuery = useQuery({
    ...storyDetailsQueryOptions(selectedStorySlug),
    enabled: Boolean(selectedStorySlug),
  });
  const selectedStoryFirstChapterId = selectedStoryQuery.data?.chapters[0]?.id ?? "";
  const selectedStoryFirstChapterQuery = useQuery({
    ...chapterDetailsQueryOptions(selectedStoryFirstChapterId),
    enabled: Boolean(selectedStoryFirstChapterId && !selectedStoryQuery.data?.coverImageUrl),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
  const createChapterMutation = useMutation({
    mutationFn: ({ storyId, title }: { storyId: string; title: string }) =>
      createChapter(storyId, { title, content: emptyChapterDraft }),
  });

  useEffect(() => {
    if (!storiesQuery.data?.items.length) {
      return;
    }

    const requestedStoryExists = requestedStorySlug
      ? storiesQuery.data.items.some((story) => story.slug === requestedStorySlug)
      : false;
    const stillExists = storiesQuery.data.items.some((story) => story.slug === selectedStorySlug);

    if (!selectedStorySlug && requestedStoryExists) {
      setSelectedStorySlug(requestedStorySlug);
      return;
    }

    if (!selectedStorySlug || !stillExists) {
      setSelectedStorySlug(storiesQuery.data.items[0].slug);
    }
  }, [requestedStorySlug, selectedStorySlug, storiesQuery.data?.items]);

  const selectedStoryDisplayCover = selectedStoryQuery.data?.coverImageUrl ?? selectedStoryFirstChapterQuery.data?.imageUrl;
  const selectedStoryDescription = selectedStoryQuery.data?.aiHint?.trim() ? selectedStoryQuery.data.aiHint : STORY_ANNOTATION_PLACEHOLDER;

  async function handleCreateNextChapter() {
    if (!selectedStoryQuery.data) {
      return;
    }

    try {
      const nextNumber = (selectedStoryQuery.data.chapters.at(-1)?.number ?? 0) + 1;
      const chapter = await createChapterMutation.mutateAsync({
        storyId: selectedStoryQuery.data.id,
        title: `Глава ${nextNumber}`,
      });

      await queryClient.invalidateQueries({ queryKey: storyKeys.details(selectedStoryQuery.data.slug) });
      router.push(routes.chapterEditor(selectedStoryQuery.data.id, chapter.id));
    } catch (error) {
      if (isAuthError(error)) {
        router.push(routes.auth({ next: routes.write }));
      }
    }
  }

  return (
    <PlottyShell
      title={
        <span className="inline-flex items-end gap-2">
          Авторская мастерская
          <span className="plotty-feather">✒</span>
        </span>
      }
      description="Создавайте, редактируйте и развивайте свои истории."
      showMobileBack={false}
    >
      <div className="grid gap-5 xl:grid-cols-[24rem_minmax(0,1fr)_18rem]">
        <ShellCard title="Мои истории" variant="sidebar">
          {storiesQuery.isLoading ? (
            <div className="space-y-3">
              <div className="h-24 rounded-[var(--plotty-radius-md)] bg-white/40" />
              <div className="h-24 rounded-[var(--plotty-radius-md)] bg-white/40" />
            </div>
          ) : storiesQuery.data?.items.length ? (
            <div className="space-y-3">
              {storiesQuery.data.items.map((story) => {
                const isSelected = selectedStorySlug === story.slug;

                return (
                  <article
                    key={story.id}
                    className={`grid grid-cols-[5.5rem_minmax(0,1fr)_auto] gap-3 rounded-[var(--plotty-radius-md)] border p-2.5 transition-[background-color,border-color,box-shadow,transform] duration-150 ${
                      isSelected
                        ? "border-[rgba(195,79,50,0.22)] bg-[var(--plotty-accent-wash)] shadow-[0_12px_28px_rgba(195,79,50,0.08)]"
                        : "border-[var(--plotty-line)] bg-[rgba(255,253,249,0.68)] hover:-translate-y-[1px] hover:bg-[var(--plotty-paper-strong)]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedStorySlug(story.slug)}
                      className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plotty-accent)]"
                      aria-label={`Выбрать историю ${story.title}`}
                    >
                      <StoryCoverPreview
                        title={story.title}
                        imageUrl={story.coverImageUrl ?? undefined}
                        compact
                        className="aspect-square rounded-[12px]"
                        imageClassName="h-full"
                      />
                    </button>
                    <button type="button" onClick={() => setSelectedStorySlug(story.slug)} className="min-w-0 text-left">
                      <div className="plotty-card-title truncate text-[1.04rem] leading-5">{story.title}</div>
                      <div className="mt-1 text-xs text-[var(--plotty-muted)]">
                        Обновлена {new Date(story.updatedAt).toLocaleDateString("ru-RU")}
                      </div>
                      {story.statusLabel ? (
                        <span className="mt-2 inline-flex rounded-full bg-[var(--plotty-olive-soft)] px-2 py-1 text-[11px] font-semibold text-[var(--plotty-olive)]">
                          {story.statusLabel}
                        </span>
                      ) : null}
                    </button>
                    <ButtonLink
                      href={routes.storySettings(story.id)}
                      variant="ghost"
                      size="sm"
                      className="self-start px-2"
                      aria-label={`Настройки истории ${story.title}`}
                    >
                      <MoreHorizontal className="size-4" aria-hidden="true" />
                    </ButtonLink>
                  </article>
                );
              })}

              <ButtonLink href={routes.writeNew} variant="secondary" className="w-full border-dashed">
                <Plus className="size-4" aria-hidden="true" />
                Новая история
              </ButtonLink>
            </div>
          ) : (
            <EmptyState
              title="Историй пока нет"
              description="Создайте первую историю и начните писать."
              actionLabel="Создать историю"
              onAction={() => router.push(routes.writeNew)}
            />
          )}
        </ShellCard>

        <ShellCard title={selectedStoryQuery.data?.title ?? "Выберите историю"}>
          {selectedStoryQuery.isLoading ? (
            <div className="space-y-3">
              <div className="h-24 rounded-[var(--plotty-radius-md)] bg-white/40" />
              <div className="h-24 rounded-[var(--plotty-radius-md)] bg-white/40" />
            </div>
          ) : selectedStoryQuery.data ? (
            <div className="space-y-5">
              <div className="grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
                <StoryCoverPreview
                  title={selectedStoryQuery.data.title}
                  imageUrl={selectedStoryDisplayCover}
                  compact
                  className="h-full min-h-[18rem]"
                  imageClassName="h-full"
                  fullHeight
                />
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="plotty-kicker">Активная история</div>
                    <p className="plotty-body text-[var(--plotty-muted)]">
                      {selectedStoryDescription}
                    </p>
                  </div>

                  <StoryTagsByCategory tags={selectedStoryQuery.data.tags} />

                  <div className="flex flex-wrap gap-3">
                    <Button variant="primary" onClick={handleCreateNextChapter} disabled={createChapterMutation.isPending}>
                      <Plus className="size-4" aria-hidden="true" />
                      {createChapterMutation.isPending ? "Создаем..." : "Создать новую главу"}
                    </Button>
                    <ButtonLink href={routes.story(selectedStoryQuery.data.slug)} variant="secondary">
                      <BookOpen className="size-4" aria-hidden="true" />
                      Открыть историю
                    </ButtonLink>
                    <ButtonLink href={routes.storySettings(selectedStoryQuery.data.id)} variant="secondary">
                      <Settings className="size-4" aria-hidden="true" />
                      Настройки
                    </ButtonLink>
                  </div>
                </div>
              </div>

              <Surface variant="panel" className="space-y-3 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="plotty-section-title">Главы истории</h2>
                  <span className="plotty-meta">{selectedStoryQuery.data.chapters.length} {formatChapterCount(selectedStoryQuery.data.chapters.length)}</span>
                </div>

                {selectedStoryQuery.data.chapters.length ? (
                  <div className="divide-y divide-[var(--plotty-line)] overflow-hidden rounded-[var(--plotty-radius-md)] border border-[var(--plotty-line)] bg-[rgba(255,253,249,0.7)]">
                    {selectedStoryQuery.data.chapters.map((chapter) => (
                      <div
                        key={chapter.id}
                        className="grid gap-3 px-4 py-3 lg:grid-cols-[minmax(0,1fr)_8rem_13rem] lg:items-center"
                      >
                        <div className="min-w-0">
                          <div className="font-semibold text-[var(--plotty-ink)]">
                            {chapter.number}. {chapter.title}
                          </div>
                          <div className="mt-1 text-sm text-[var(--plotty-muted)]">
                            Обновлена {new Date(chapter.updatedAt).toLocaleDateString("ru-RU")}
                          </div>
                        </div>
                        <span className={chapter.status === "draft" ? "plotty-meta" : "text-sm font-semibold text-[var(--plotty-olive)]"}>
                          {chapter.status === "draft" ? "Черновик" : "Опубликована"}
                        </span>
                        <div className="flex flex-wrap gap-2 lg:justify-end">
                          <ButtonLink
                            href={
                              (chapter.status ?? "published") === "draft"
                                ? routes.chapterPreview(selectedStoryQuery.data.slug, chapter.id)
                                : routes.chapter(
                                    selectedStoryQuery.data.slug,
                                    readerChapterNumberForChapterId(selectedStoryQuery.data.chapters, chapter.id) ??
                                      chapter.number ??
                                      1,
                                  )
                            }
                            variant="secondary"
                            size="sm"
                          >
                            Читать
                          </ButtonLink>
                          <ButtonLink href={routes.chapterEditor(selectedStoryQuery.data.id, chapter.id)} variant="primary" size="sm">
                            Редактировать
                          </ButtonLink>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="У истории ещё нет глав"
                    description="Создайте первую главу и сразу попадёте в редактор."
                    actionLabel="Создать новую главу"
                    onAction={handleCreateNextChapter}
                  />
                )}
              </Surface>
            </div>
          ) : (
            <EmptyState title="Выберите историю" description="Слева находится список ваших историй." />
          )}
        </ShellCard>

        <ShellCard title="Действия автора" variant="sidebar">
          <div className="space-y-3">
            <ButtonLink href={routes.writeNew} variant="primary" className="w-full justify-start">
              <Plus className="size-4" aria-hidden="true" />
              Создать историю
            </ButtonLink>
            {selectedStoryQuery.data ? (
              <>
                <Button type="button" variant="secondary" className="w-full justify-start" onClick={handleCreateNextChapter} disabled={createChapterMutation.isPending}>
                  <FileText className="size-4" aria-hidden="true" />
                  Создать главу
                </Button>
                <ButtonLink href={routes.story(selectedStoryQuery.data.slug)} variant="secondary" className="w-full justify-start">
                  <BookOpen className="size-4" aria-hidden="true" />
                  Открыть историю
                </ButtonLink>
                <ButtonLink href={routes.storySettings(selectedStoryQuery.data.id)} variant="secondary" className="w-full justify-start">
                  <PenLine className="size-4" aria-hidden="true" />
                  Редактировать
                </ButtonLink>
              </>
            ) : null}
          </div>
        </ShellCard>
      </div>
    </PlottyShell>
  );
}

function StoryTagsByCategory({ tags }: { tags: StoryTag[] }) {
  const groupedTags = groupStoryTags(tags);
  const primaryGroups = ["directionality", "rating", "completion", "size"]
    .map((category) => [category, groupedTags[category] ?? []] as const)
    .filter(([, groupTags]) => groupTags.length);
  const detailGroups = ["genre", "warning"]
    .map((category) => [category, groupedTags[category] ?? []] as const)
    .filter(([, groupTags]) => groupTags.length);

  if (!primaryGroups.length && !detailGroups.length) {
    return null;
  }

  return (
    <div className="space-y-3">
      {primaryGroups.length ? (
        <div className="grid grid-cols-2 gap-3">
          {primaryGroups.map(([category, groupTags]) => (
            <TagGroup key={category} category={category} tags={groupTags} />
          ))}
        </div>
      ) : null}

      {detailGroups.map(([category, groupTags]) => (
        <TagGroup key={category} category={category} tags={groupTags} />
      ))}
    </div>
  );
}

function TagGroup({ category, tags }: { category: string; tags: StoryTag[] }) {
  return (
    <div className="space-y-1.5">
      <div className="plotty-kicker">{getStoryTagCategoryLabel(category)}</div>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <Chip key={tag.id} tone={tag.category === "completion" ? "olive" : tag.category === "warning" ? "gold" : "default"}>
            {tag.name}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function formatChapterCount(count: number) {
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
