"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import {
  createChapter,
  createStory,
  storiesQueryOptions,
  storyDetailsQueryOptions,
  storyKeys,
  storyTagsQueryOptions,
} from "@/entities/story/api/stories-api";
import * as generatedImageCache from "@/entities/story/model/generated-image-cache";
import { defaultStoriesQuery } from "@/entities/story/model/story-query";
import { getStoryTextOverride } from "@/entities/story/model/story-text-cache";
import { isAuthError } from "@/shared/api/fetch-json";
import { routes } from "@/shared/config/routes";
import { Button, ButtonLink } from "@/shared/ui/button";
import { Field, FieldLabel } from "@/shared/ui/field";
import { EmptyState } from "@/shared/ui/empty-state";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";

import { GenerateChapterImageButton } from "./generate-chapter-image-button";
import { PlottyShell, ShellCard } from "./plotty-shell";
import { StoryCoverPreview } from "./story-cover-preview";
import { StorySettingsFields, type StorySettingsValues } from "./story-settings-fields";
import { StoryTagChip } from "./story-tag-chip";

const initialStoryValues: StorySettingsValues = {
  title: "",
  description: "",
  excerpt: "",
  selectedTagIds: [],
};

const initialChapterValues = {
  title: "",
  content: "",
};

const emptyChapterDraft = "Черновик новой главы. Откройте редактор и продолжайте писать.";

export function StoryCreateScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"library" | "create">("library");
  const [selectedStorySlug, setSelectedStorySlug] = useState("");
  const [storyValues, setStoryValues] = useState(initialStoryValues);
  const [chapterValues, setChapterValues] = useState(initialChapterValues);
  const storiesQuery = useQuery(storiesQueryOptions({ ...defaultStoriesQuery, pageSize: 50 }));
  const tagsQuery = useQuery(storyTagsQueryOptions());
  const selectedStoryQuery = useQuery({
    ...storyDetailsQueryOptions(selectedStorySlug),
    enabled: Boolean(selectedStorySlug),
  });

  const createStoryMutation = useMutation({
    mutationFn: createStory,
  });
  const createChapterMutation = useMutation({
    mutationFn: ({ storyId, title, content }: { storyId: string; title: string; content: string }) =>
      createChapter(storyId, { title, content }),
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

  const selectedStorySlugValue = selectedStoryQuery.data?.slug ?? "";
  const selectedStoryHasExplicitCover = Boolean(selectedStoryQuery.data?.coverImageUrl);
  const selectedStoryDisplayCover =
    selectedStoryQuery.data?.coverImageUrl ??
    (selectedStorySlugValue ? getStoryCoverFromCache(selectedStorySlugValue) : undefined) ??
    (selectedStoryQuery.data?.chapters[0]
      ? generatedImageCache.getGeneratedImageUrl(selectedStoryQuery.data.chapters[0].id)
      : undefined);
  const selectedStoryTextOverride = selectedStoryQuery.data ? getStoryTextOverride(selectedStoryQuery.data.id) : undefined;
  const selectedStoryDescription =
    selectedStoryTextOverride?.description ??
    selectedStoryQuery.data?.description ??
    selectedStoryQuery.data?.excerpt ??
    "Описание истории пока не заполнено.";

  useEffect(() => {
    if (selectedStorySlugValue && !selectedStoryHasExplicitCover && selectedStoryDisplayCover) {
      setStoryCoverInCache(selectedStorySlugValue, selectedStoryDisplayCover);
    }
  }, [selectedStoryDisplayCover, selectedStoryHasExplicitCover, selectedStorySlugValue]);

  async function handleCreateStory() {
    try {
      const story = await createStoryMutation.mutateAsync({
        title: storyValues.title.trim(),
        description: storyValues.description.trim(),
        excerpt: storyValues.excerpt.trim(),
        tagIds: storyValues.selectedTagIds,
      });

      const chapter = await createChapterMutation.mutateAsync({
        storyId: story.id,
        title: chapterValues.title.trim() || "Глава 1",
        content: chapterValues.content.trim() || emptyChapterDraft,
      });

      await queryClient.invalidateQueries({ queryKey: storyKeys.all });
      router.push(routes.chapterEditor(story.id, chapter.id));
    } catch (error) {
      if (isAuthError(error)) {
        router.push(routes.auth({ next: routes.write }));
      }
    }
  }

  async function handleCreateNextChapter() {
    if (!selectedStoryQuery.data) {
      return;
    }

    try {
      const nextNumber = (selectedStoryQuery.data.chapters.at(-1)?.number ?? 0) + 1;
      const chapter = await createChapterMutation.mutateAsync({
        storyId: selectedStoryQuery.data.id,
        title: `Глава ${nextNumber}`,
        content: emptyChapterDraft,
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
      description="Главный хаб автора: выбирайте истории, управляйте главами и открывайте настройки истории отдельно."
    >
      <div className="space-y-5">
        <div className="flex flex-wrap gap-3">
          <Button variant={mode === "library" ? "primary" : "secondary"} onClick={() => setMode("library")}>
            Мои истории
          </Button>
          <Button variant={mode === "create" ? "primary" : "secondary"} onClick={() => setMode("create")}>
            Создать историю
          </Button>
        </div>

        {mode === "create" ? (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <ShellCard title="Новая история" description="Сначала задайте общие параметры истории. Главы и их текст останутся отдельной сущностью.">
              <StorySettingsFields values={storyValues} availableTags={tagsQuery.data?.items ?? []} onChange={setStoryValues} />
            </ShellCard>

            <div className="space-y-5">
              <ShellCard title="Первая глава" description="После создания истории вы сразу перейдёте в редактор первой главы.">
                <div className="grid gap-4">
                  <Field>
                    <FieldLabel htmlFor="new-chapter-title">Название главы</FieldLabel>
                    <Input
                      id="new-chapter-title"
                      value={chapterValues.title}
                      onChange={(event) => setChapterValues((current) => ({ ...current, title: event.target.value }))}
                      placeholder="Глава 1"
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="new-chapter-content">Черновик первой главы</FieldLabel>
                    <Textarea
                      id="new-chapter-content"
                      value={chapterValues.content}
                      onChange={(event) => setChapterValues((current) => ({ ...current, content: event.target.value }))}
                      placeholder="Начните писать первую главу"
                      className="min-h-52"
                    />
                  </Field>

                  <Button variant="primary" onClick={handleCreateStory} disabled={createStoryMutation.isPending || createChapterMutation.isPending}>
                    {createStoryMutation.isPending || createChapterMutation.isPending
                      ? "Создаем..."
                      : "Создать историю и открыть редактор"}
                  </Button>
                </div>
              </ShellCard>

              <ShellCard title="Как это работает" description="Story settings и chapter editor разделены, чтобы роли экранов не смешивались.">
                <div className="space-y-3 text-sm leading-6 text-[var(--plotty-muted)]">
                  <p>Сначала создаётся история с основными параметрами и тегами.</p>
                  <p>Затем создаётся первая глава и открывается chapter editor только для неё.</p>
                  <p>Позже story-level параметры редактируются с отдельного экрана настроек истории.</p>
                </div>
              </ShellCard>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
            <ShellCard title="Мои истории" description="Выберите историю, чтобы управлять главами, открыть страницу истории или перейти к настройкам.">
              {storiesQuery.isLoading ? (
                <div className="space-y-3">
                  <div className="h-24 rounded-[18px] bg-white/40" />
                  <div className="h-24 rounded-[18px] bg-white/40" />
                </div>
              ) : storiesQuery.data?.items.length ? (
                <div className="space-y-3">
                  {storiesQuery.data.items.map((story) => (
                    <div
                      key={story.id}
                      className={`rounded-[20px] border px-4 py-4 transition-[background-color,border-color,color,box-shadow] duration-150 ${
                        selectedStorySlug === story.slug
                          ? "border-transparent bg-[var(--plotty-accent)] text-white shadow-[0_12px_28px_rgba(188,95,61,0.18)]"
                          : "border-[var(--plotty-line)] bg-white/72 hover:bg-white/90"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <button type="button" onClick={() => setSelectedStorySlug(story.slug)} className="flex-1 text-left">
                          <div className="text-base font-semibold">{story.title}</div>
                          <div
                            className={`mt-1 text-sm ${
                              selectedStorySlug === story.slug ? "text-white/80" : "text-[var(--plotty-muted)]"
                            }`}
                          >
                            {story.chaptersCount} глав
                          </div>
                        </button>
                        <ButtonLink
                          href={routes.storySettings(story.id)}
                          variant={selectedStorySlug === story.slug ? "secondary" : "ghost"}
                          className={`min-h-10 px-3 text-lg leading-none ${selectedStorySlug === story.slug ? "border-white/20 bg-white/12 text-white hover:bg-white/18" : ""}`}
                          aria-label={`Настройки истории ${story.title}`}
                        >
                          ...
                        </ButtonLink>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="Историй пока нет" description="Создайте первую историю, чтобы собрать рабочую библиотеку." />
              )}
            </ShellCard>

            <ShellCard
              title={selectedStoryQuery.data?.title ?? "Выберите историю"}
              
            >
              {selectedStoryQuery.isLoading ? (
                <div className="space-y-3">
                  <div className="h-24 rounded-[18px] bg-white/40" />
                  <div className="h-24 rounded-[18px] bg-white/40" />
                </div>
              ) : selectedStoryQuery.data ? (
                <div className="space-y-6">
                  <div className="grid gap-4 lg:grid-cols-[200px_minmax(0,1fr)]">
                    <StoryCoverPreview
                      title={selectedStoryQuery.data.title}
                      imageUrl={selectedStoryDisplayCover}
                      compact
                    />
                    <div className="space-y-4">
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
                        {selectedStoryQuery.data.tags.map((tag) => (
                          <StoryTagChip key={tag.id} tag={tag} />
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <ButtonLink href={routes.story(selectedStoryQuery.data.slug)} variant="secondary">
                          Открыть страницу истории
                        </ButtonLink>
                        <ButtonLink href={routes.storySettings(selectedStoryQuery.data.id)} variant="secondary">
                          Настройки истории
                        </ButtonLink>
                        <Button variant="primary" onClick={handleCreateNextChapter} disabled={createChapterMutation.isPending}>
                          {createChapterMutation.isPending ? "Создаем..." : "Создать новую главу"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h2 className="plotty-section-title">Главы</h2>
                      <span className="plotty-meta">
                        {selectedStoryQuery.data.chapters.length} {selectedStoryQuery.data.chapters.length === 1 ? "глава" : "глав"}
                      </span>
                    </div>

                    {selectedStoryQuery.data.chapters.length ? (
                      <div className="space-y-3">
                        {selectedStoryQuery.data.chapters.map((chapter) => (
                          <div
                            key={chapter.id}
                            className="flex flex-wrap items-center justify-between gap-4 rounded-[18px] border border-[var(--plotty-line)] bg-white/76 px-4 py-4"
                          >
                            <div>
                              <div className="text-base font-semibold">
                                Глава {chapter.number}. {chapter.title}
                              </div>
                              <div className="mt-1 text-sm text-[var(--plotty-muted)]">
                                Обновлена {new Date(chapter.updatedAt).toLocaleString("ru-RU")}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-3">
                              <GenerateChapterImageButton
                                chapterId={chapter.id}
                                chapterTitle={chapter.title}
                                storySlug={selectedStoryQuery.data.slug}
                                storyTitle={selectedStoryQuery.data.title}
                              />
                              <ButtonLink href={routes.chapter(selectedStoryQuery.data.slug, chapter.number ?? 1)} variant="secondary">
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
                <EmptyState title="Выберите историю" description="Список историй слева откроет её главы и author actions." />
              )}
            </ShellCard>
          </div>
        )}
      </div>
    </PlottyShell>
  );
}

function getStoryCoverFromCache(storySlug: string) {
  return typeof generatedImageCache.getGeneratedStoryCoverUrl === "function"
    ? generatedImageCache.getGeneratedStoryCoverUrl(storySlug)
    : undefined;
}

function setStoryCoverInCache(storySlug: string, imageUrl: string) {
  if (typeof generatedImageCache.setGeneratedStoryCoverUrl === "function") {
    generatedImageCache.setGeneratedStoryCoverUrl(storySlug, imageUrl);
  }
}
