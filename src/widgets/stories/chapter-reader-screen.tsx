"use client";

import { useQuery } from "@tanstack/react-query";

import { chapterDetailsQueryOptions, storyDetailsQueryOptions } from "@/entities/story/api/stories-api";
import { routes } from "@/shared/config/routes";
import { ButtonLink } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";

import { ChapterImageFrame } from "./chapter-image-frame";
import { PlottyShell, ShellCard } from "./plotty-shell";

export function ChapterReaderScreen({
  slug,
  number,
}: {
  slug: string;
  number: string;
}) {
  const chapterNumber = Number(number);
  const storyQuery = useQuery(storyDetailsQueryOptions(slug));
  const chapterId = storyQuery.data?.chapters.find((chapter) => chapter.number === chapterNumber)?.id ?? "";
  const chapterQuery = useQuery(chapterDetailsQueryOptions(chapterId));

  if (storyQuery.isLoading || (chapterId && chapterQuery.isLoading)) {
    return (
      <PlottyShell title="Глава загружается" description="Подтягиваем историю и текст главы.">
        <div className="h-72 rounded-[24px] bg-white/40" />
      </PlottyShell>
    );
  }

  if (storyQuery.isError || !storyQuery.data || !chapterId || chapterQuery.isError || !chapterQuery.data) {
    return (
      <PlottyShell title="Глава не найдена" description="Проверьте номер главы или вернитесь в историю.">
        <EmptyState title="Глава не найдена" description="Такой главы нет в текущей истории." />
      </PlottyShell>
    );
  }

  const currentIndex = storyQuery.data.chapters.findIndex((chapter) => chapter.id === chapterId);
  const prevChapter = currentIndex > 0 ? storyQuery.data.chapters[currentIndex - 1] : null;
  const nextChapter =
    currentIndex >= 0 && currentIndex < storyQuery.data.chapters.length - 1
      ? storyQuery.data.chapters[currentIndex + 1]
      : null;

  return (
    <PlottyShell
      title={`${storyQuery.data.title} • Глава ${chapterNumber}`}
      description={`Обновлена ${new Date(chapterQuery.data.updatedAt).toLocaleString("ru-RU")}`}
    >
      <div className="mx-auto max-w-4xl space-y-5">
        {chapterQuery.data.imageUrl ? <ChapterImageFrame title={chapterQuery.data.title} imageUrl={chapterQuery.data.imageUrl} /> : null}

        <ShellCard title={chapterQuery.data.title} description={`${chapterQuery.data.wordCount ?? 0} слов`} className="bg-[rgba(255,255,255,0.72)]">
          <div className="space-y-5">
            <div className="whitespace-pre-wrap text-[15px] leading-8 text-[var(--plotty-ink)] md:text-[16px] md:leading-9">
              {chapterQuery.data.content}
            </div>

            <div className="flex flex-wrap justify-between gap-3 border-t border-[var(--plotty-line)] pt-4">
              {prevChapter ? (
                <ButtonLink href={routes.chapter(slug, prevChapter.number ?? chapterNumber - 1)} variant="secondary">
                  Предыдущая глава
                </ButtonLink>
              ) : (
                <span />
              )}
              {nextChapter ? (
                <ButtonLink href={routes.chapter(slug, nextChapter.number ?? chapterNumber + 1)} variant="secondary">
                  Следующая глава
                </ButtonLink>
              ) : null}
            </div>
          </div>
        </ShellCard>
      </div>
    </PlottyShell>
  );
}
