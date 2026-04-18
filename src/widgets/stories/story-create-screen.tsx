"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import {
  chapterDetailsQueryOptions,
  createChapter,
  myStoriesQueryOptions,
  storyDetailsQueryOptions,
  storyKeys,
} from "@/entities/story/api/stories-api";
import { defaultStoriesQuery, publicChaptersForReader, readerChapterNumberForChapterId } from "@/entities/story/model/story-query";
import { useAuth } from "@/entities/auth/model/auth-context";
import { STORY_ANNOTATION_PLACEHOLDER } from "@/shared/config/story-annotation";
import { isAuthError } from "@/shared/api/fetch-json";
import { routes } from "@/shared/config/routes";
import { Button, ButtonLink } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";

import { PlottyShell, ShellCard } from "./plotty-shell";
import { StoryCoverPreview } from "./story-cover-preview";
import { StoryTagChip } from "./story-tag-chip";

const emptyChapterDraft = "Черновик новой главы. Откройте редактор и продолжайте писать.";

export function StoryCreateScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedStorySlug, setSelectedStorySlug] = useState("");
  const storiesQuery = useQuery(myStoriesQueryOptions({ ...defaultStoriesQuery, pageSize: 50 }, { userId: user?.id }));
  const selectedStoryQuery = useQuery({
    ...storyDetailsQueryOptions(selectedStorySlug),
    enabled: Boolean(selectedStorySlug),
  });
  const selectedStoryFirstChapterId = selectedStoryQuery.data?.chapters[0]?.id ?? "";
  const selectedStoryFirstChapterQuery = useQuery({
    ...chapterDetailsQueryOptions(selectedStoryFirstChapterId),
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

    const stillExists = storiesQuery.data.items.some((story) => story.slug === selectedStorySlug);

    if (!selectedStorySlug || !stillExists) {
      setSelectedStorySlug(storiesQuery.data.items[0].slug);
    }
  }, [selectedStorySlug, storiesQuery.data?.items]);

  const selectedStoryPublishedCount = selectedStoryQuery.data
    ? publicChaptersForReader(selectedStoryQuery.data.chapters).length
    : 0;

  const selectedStoryDisplayCover = selectedStoryFirstChapterQuery.data?.imageUrl;
  const selectedStoryDescription = selectedStoryQuery.data?.aiHint?.trim() ? selectedStoryQuery.data.aiHint : STORY_ANNOTATION_PLACEHOLDER;

  const activeStoryTags = useMemo(
    () =>
      (selectedStoryQuery.data?.tags ?? []).sort((left, right) => {
        const leftCategory = left.category ?? "other";
        const rightCategory = right.category ?? "other";

        return leftCategory.localeCompare(rightCategory, "ru");
      }),
    [selectedStoryQuery.data?.tags],
  );

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
      title="Авторская мастерская"
      description="Выберите историю и продолжайте работу с главами."
      actions={
        <ButtonLink href={routes.writeNew} variant="primary">
          Создать историю
        </ButtonLink>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <ShellCard title="Мои истории">
          {storiesQuery.isLoading ? (
            <div className="space-y-3">
              <div className="h-24 rounded-[18px] bg-white/40" />
              <div className="h-24 rounded-[18px] bg-white/40" />
            </div>
          ) : storiesQuery.data?.items.length ? (
            <div className="space-y-3">
              {storiesQuery.data.items.map((story) => {
                return (
                <div
                  key={story.id}
                  className={`rounded-[22px] border px-4 py-4 transition-[background-color,border-color,color,box-shadow,transform] duration-150 ${
                    selectedStorySlug === story.slug
                      ? "border-[rgba(188,95,61,0.16)] bg-[rgba(188,95,61,0.08)] shadow-[0_12px_28px_rgba(188,95,61,0.08)]"
                      : "border-[var(--plotty-line)] bg-white/72 hover:-translate-y-[1px] hover:bg-white/90"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button type="button" onClick={() => setSelectedStorySlug(story.slug)} className="flex-1 text-left">
                      <div className="plotty-kicker">История</div>
                      <div className="mt-2 text-base font-semibold text-[var(--plotty-ink)]">{story.title}</div>
                      <div className="mt-1 text-sm text-[var(--plotty-muted)]">
                        {formatChapterCount(story.chaptersCount)}
                      </div>
                    </button>
                    <ButtonLink
                      href={routes.storySettings(story.id)}
                      variant="ghost"
                      className="min-h-10 px-3 text-lg leading-none"
                      aria-label={`Настройки истории ${story.title}`}
                    >
                      ...
                    </ButtonLink>
                  </div>
                </div>
                );
              })}

              <ButtonLink
                href={routes.writeNew}
                variant="ghost"
                className="flex min-h-[7.5rem] w-full flex-col items-start rounded-[22px] border border-dashed border-[rgba(41,38,34,0.14)] bg-white/40 px-4 py-5 text-left"
              >
                <span className="plotty-kicker">Новая история</span>
                <span className="mt-2 text-base font-semibold text-[var(--plotty-ink)]">Создать историю</span>
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
              <div className="h-24 rounded-[18px] bg-white/40" />
              <div className="h-24 rounded-[18px] bg-white/40" />
            </div>
          ) : selectedStoryQuery.data ? (
            <div className="space-y-5">
              <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
                <StoryCoverPreview
                  title={selectedStoryQuery.data.title}
                  imageUrl={selectedStoryDisplayCover}
                  compact
                  className="h-full"
                  imageClassName="h-full"
                  fullHeight
                />
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="plotty-kicker">Активная история</div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-[var(--plotty-muted)]">
                      <span>{formatChapterCount(selectedStoryPublishedCount)}</span>
                      <span>{`Обновлена ${new Date(selectedStoryQuery.data.updatedAt).toLocaleDateString("ru-RU")}`}</span>
                    </div>
                  </div>

                  <p
                    className="plotty-body text-[var(--plotty-muted)]"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {selectedStoryDescription}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {activeStoryTags.map((tag) => (
                      <StoryTagChip key={tag.id} tag={tag} />
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button variant="primary" onClick={handleCreateNextChapter} disabled={createChapterMutation.isPending}>
                      {createChapterMutation.isPending ? "Создаем..." : "Создать новую главу"}
                    </Button>
                    <ButtonLink href={routes.story(selectedStoryQuery.data.slug)} variant="secondary">
                      Открыть историю
                    </ButtonLink>
                    <ButtonLink href={routes.storySettings(selectedStoryQuery.data.id)} variant="ghost">
                      Настройки
                    </ButtonLink>
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-[22px] border border-[rgba(41,38,34,0.08)] bg-[var(--plotty-panel-muted)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="plotty-section-title">Главы</h2>
                  <span className="plotty-meta">{formatChapterCount(selectedStoryPublishedCount)}</span>
                </div>

                {selectedStoryQuery.data.chapters.length ? (
                  <div className="space-y-3">
                    {selectedStoryQuery.data.chapters.map((chapter) => (
                      <div
                        key={chapter.id}
                        className="flex flex-col gap-4 rounded-[18px] border border-[var(--plotty-line)] bg-white/76 px-4 py-4 lg:flex-row lg:items-center lg:justify-between"
                      >
                        <div className="space-y-1">
                          <div className="text-base font-semibold">
                            Глава {chapter.number}. {chapter.title}
                          </div>
                          <div className="mt-1 text-sm text-[var(--plotty-muted)]">
                            Обновлена {new Date(chapter.updatedAt).toLocaleString("ru-RU")}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
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
                          >
                            Читать
                          </ButtonLink>
                          <ButtonLink href={routes.chapterEditor(selectedStoryQuery.data.id, chapter.id)} variant="primary">
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
              </div>
            </div>
          ) : (
            <EmptyState title="Выберите историю" description="Слева находится список ваших историй." />
          )}
        </ShellCard>
      </div>
    </PlottyShell>
  );
}

function formatChapterCount(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return `${count} глава`;
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} главы`;
  }

  return `${count} глав`;
}
