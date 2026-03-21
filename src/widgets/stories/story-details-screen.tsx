"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createChapter, deleteStory, storyDetailsQueryOptions, storyKeys } from "@/entities/story/api/stories-api";
import { routes } from "@/shared/config/routes";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";

import { GenerateChapterImageButton } from "./generate-chapter-image-button";
import { PlottyShell, ShellCard } from "./plotty-shell";
import { StoryTagChip } from "./story-tag-chip";

export function StoryDetailsScreen({ slug }: { slug: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const storyQuery = useQuery(storyDetailsQueryOptions(slug));
  const createChapterMutation = useMutation({
    mutationFn: ({ storyId, nextNumber }: { storyId: string; nextNumber: number }) =>
      createChapter(storyId, { title: `Глава ${nextNumber}`, content: "" }),
  });
  const deleteStoryMutation = useMutation({
    mutationFn: deleteStory,
  });

  async function handleNewChapter() {
    if (!storyQuery.data) {
      return;
    }

    const nextNumber = (storyQuery.data.chapters.at(-1)?.number ?? 0) + 1;
    const chapter = await createChapterMutation.mutateAsync({
      storyId: storyQuery.data.id,
      nextNumber,
    });

    await queryClient.invalidateQueries({ queryKey: storyKeys.all });
    await queryClient.invalidateQueries({ queryKey: storyKeys.details(slug) });
    router.push(routes.chapterEditor(storyQuery.data.id, chapter.id));
  }

  async function handleDeleteStory() {
    if (!storyQuery.data || !window.confirm("Удалить историю целиком?")) {
      return;
    }

    await deleteStoryMutation.mutateAsync(storyQuery.data.id);
    await queryClient.invalidateQueries({ queryKey: storyKeys.all });
    router.push(routes.home);
  }

  if (storyQuery.isLoading) {
    return (
      <PlottyShell title="История загружается" description="Собираем метаданные истории и список глав.">
        <div className="h-72 rounded-[24px] bg-white/40" />
      </PlottyShell>
    );
  }

  if (storyQuery.isError || !storyQuery.data) {
    return (
      <PlottyShell title="История не найдена" description="Либо slug неверный, либо mock API не отдал данные.">
        <EmptyState title="История не найдена" description="Вернитесь в каталог и выберите другую историю." />
      </PlottyShell>
    );
  }

  const latestChapter = storyQuery.data.chapters.at(-1);

  return (
    <PlottyShell
      title={storyQuery.data.title}
      description={storyQuery.data.excerpt}
      actions={
        latestChapter ? (
          <Link href={routes.chapterEditor(storyQuery.data.id, latestChapter.id)}>
            <Button variant="secondary">Редактировать историю</Button>
          </Link>
        ) : null
      }
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5">
          <ShellCard title="Описание" description="Теги и главы живут в одной рабочей карточке истории.">
            <div className="space-y-4">
              <p className="text-sm leading-7 text-[var(--plotty-muted)]">{storyQuery.data.description}</p>
              <div className="flex flex-wrap gap-2">
                {storyQuery.data.tags.map((tag) => (
                  <StoryTagChip key={tag.id} tag={tag} />
                ))}
              </div>
            </div>
          </ShellCard>

          <ShellCard title="Главы" description="Чтение и редактирование разведены по разным маршрутам.">
            {storyQuery.data.chapters.length ? (
              <div className="space-y-3">
                {storyQuery.data.chapters.map((chapter) => (
                  <div
                    key={chapter.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-[20px] border border-[var(--plotty-line)] bg-white/70 px-4 py-4"
                  >
                    <div>
                      <div className="text-sm font-semibold">
                        Глава {chapter.number}. {chapter.title}
                      </div>
                      <div className="text-sm text-[var(--plotty-muted)]">
                        {chapter.wordCount} слов {chapter.hasImage ? "• есть картинка" : ""}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <GenerateChapterImageButton
                        chapterId={chapter.id}
                        chapterTitle={chapter.title}
                        storySlug={storyQuery.data.slug}
                        hasImage={chapter.hasImage}
                      />
                      <Link href={routes.chapter(storyQuery.data.slug, chapter.number)}>
                        <Button variant="secondary">Читать</Button>
                      </Link>
                      <Link href={routes.chapterEditor(storyQuery.data.id, chapter.id)}>
                        <Button>Редактировать</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="У истории пока нет глав" description="Создайте первую главу, чтобы продолжить работу." />
            )}
          </ShellCard>
        </div>

        <div className="space-y-5">
          <ShellCard title="Действия" description="Быстрые сценарии для автора.">
            <div className="flex flex-col gap-3">
              <Button variant="primary" onClick={handleNewChapter} disabled={createChapterMutation.isPending}>
                {createChapterMutation.isPending ? "Создаем..." : "Новая глава"}
              </Button>
              {latestChapter ? (
                <Link href={routes.chapterEditor(storyQuery.data.id, latestChapter.id)}>
                  <Button className="w-full">Редактировать историю</Button>
                </Link>
              ) : null}
              <Button variant="ghost" onClick={handleDeleteStory} disabled={deleteStoryMutation.isPending}>
                Удалить историю
              </Button>
            </div>
          </ShellCard>
        </div>
      </div>
    </PlottyShell>
  );
}
