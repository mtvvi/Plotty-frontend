"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  createChapter,
  createStory,
  storiesQueryOptions,
  storyDetailsQueryOptions,
  storyKeys,
  storyTagsQueryOptions,
} from "@/entities/story/api/stories-api";
import { defaultStoriesQuery } from "@/entities/story/model/story-query";
import { routes } from "@/shared/config/routes";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";

import { GenerateChapterImageButton } from "./generate-chapter-image-button";
import { PlottyShell, ShellCard } from "./plotty-shell";
import { StoryEditorForm, type StoryEditorValues } from "./story-editor-form";
import { StoryTagChip } from "./story-tag-chip";

const initialValues: StoryEditorValues = {
  storyTitle: "",
  selectedTagIds: [],
  chapterTitle: "",
  chapterContent: "",
};

const emptyChapterDraft = "Черновик новой главы. Откройте редактор и продолжайте писать.";

export function StoryCreateScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"library" | "create">("library");
  const [selectedStorySlug, setSelectedStorySlug] = useState("");
  const [values, setValues] = useState(initialValues);
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

  async function handleSave() {
    const story = await createStoryMutation.mutateAsync({
      title: values.storyTitle.trim(),
      tagIds: values.selectedTagIds,
    });

    const chapter = await createChapterMutation.mutateAsync({
      storyId: story.id,
      title: values.chapterTitle.trim() || "Глава 1",
      content: values.chapterContent.trim() || emptyChapterDraft,
    });

    await queryClient.invalidateQueries({ queryKey: storyKeys.all });
    router.push(routes.chapterEditor(story.id, chapter.id));
  }

  async function handleCreateNextChapter() {
    if (!selectedStoryQuery.data) {
      return;
    }

    const nextNumber = (selectedStoryQuery.data.chapters.at(-1)?.number ?? 0) + 1;
    const chapter = await createChapterMutation.mutateAsync({
      storyId: selectedStoryQuery.data.id,
      title: `Глава ${nextNumber}`,
      content: emptyChapterDraft,
    });

    await queryClient.invalidateQueries({ queryKey: storyKeys.details(selectedStoryQuery.data.slug) });
    router.push(routes.chapterEditor(selectedStoryQuery.data.id, chapter.id));
  }

  return (
    <PlottyShell
      title="Авторская мастерская"
      description="Фронтенд теперь работает с реальным бэкендом: история хранит название и теги, а текст живет на уровне главы."
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
          <StoryEditorForm
            mode="create"
            values={values}
            availableTags={tagsQuery.data?.items ?? []}
            onChange={setValues}
            onSave={handleSave}
            onSpellcheck={() => {}}
            isSaving={createStoryMutation.isPending || createChapterMutation.isPending}
            saveLabel="Создать историю и первую главу"
          />
        ) : (
          <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
            <ShellCard title="Мои истории" description="Выберите историю, чтобы посмотреть теги и перейти к её главам.">
              {storiesQuery.isLoading ? (
                <div className="space-y-3">
                  <div className="h-20 rounded-[18px] bg-white/40" />
                  <div className="h-20 rounded-[18px] bg-white/40" />
                </div>
              ) : storiesQuery.data?.items.length ? (
                <div className="space-y-3">
                  {storiesQuery.data.items.map((story) => (
                    <button
                      key={story.id}
                      type="button"
                      onClick={() => setSelectedStorySlug(story.slug)}
                      className={`w-full rounded-[20px] border px-4 py-4 text-left transition-colors ${
                        selectedStorySlug === story.slug
                          ? "border-[var(--plotty-accent)] bg-[var(--plotty-accent-soft)]"
                          : "border-[var(--plotty-line)] bg-white/72 hover:bg-white/90"
                      }`}
                    >
                      <div className="text-base font-semibold">{story.title}</div>
                      <div className="mt-1 text-sm text-[var(--plotty-muted)]">{story.chaptersCount} глав</div>
                    </button>
                  ))}
                </div>
              ) : (
                <EmptyState title="Историй пока нет" description="Создайте первую историю, чтобы собрать рабочую библиотеку." />
              )}
            </ShellCard>

            <ShellCard
              title={selectedStoryQuery.data?.title ?? "Выберите историю"}
              description={
                selectedStoryQuery.data
                  ? "Список глав и теги истории. Новую главу можно создать прямо отсюда."
                  : "Слева появится список ваших историй. Выберите любую, чтобы продолжить работу."
              }
            >
              {selectedStoryQuery.isLoading ? (
                <div className="space-y-3">
                  <div className="h-24 rounded-[18px] bg-white/40" />
                  <div className="h-24 rounded-[18px] bg-white/40" />
                </div>
              ) : selectedStoryQuery.data ? (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {selectedStoryQuery.data.tags.map((tag) => (
                        <StoryTagChip key={tag.id} tag={tag} />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h2 className="text-lg font-semibold">Главы</h2>
                      <div className="flex flex-wrap gap-3">
                        <Link href={routes.story(selectedStoryQuery.data.slug)}>
                          <Button variant="secondary">Открыть страницу истории</Button>
                        </Link>
                        <Button variant="primary" onClick={handleCreateNextChapter} disabled={createChapterMutation.isPending}>
                          {createChapterMutation.isPending ? "Создаем..." : "Создать новую главу"}
                        </Button>
                      </div>
                    </div>

                    {selectedStoryQuery.data.chapters.length ? (
                      <div className="space-y-3">
                        {selectedStoryQuery.data.chapters.map((chapter) => (
                          <div
                            key={chapter.id}
                            className="flex flex-wrap items-center justify-between gap-4 rounded-[20px] border border-[var(--plotty-line)] bg-white/72 px-4 py-4"
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
                              <Link href={routes.chapter(selectedStoryQuery.data.slug, chapter.number ?? 1)}>
                                <Button variant="secondary">Читать</Button>
                              </Link>
                              <Link href={routes.chapterEditor(selectedStoryQuery.data.id, chapter.id)}>
                                <Button>Редактировать</Button>
                              </Link>
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
                <EmptyState title="Выберите историю" description="Список историй слева откроет её главы и рабочие действия." />
              )}
            </ShellCard>
          </div>
        )}
      </div>
    </PlottyShell>
  );
}
