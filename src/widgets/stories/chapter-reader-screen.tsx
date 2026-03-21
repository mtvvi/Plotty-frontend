"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";

import { chapterDetailsQueryOptions, storyDetailsQueryOptions } from "@/entities/story/api/stories-api";
import { getGeneratedImageUrl } from "@/entities/story/model/generated-image-cache";
import { routes } from "@/shared/config/routes";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";

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
  const [generatedImageUrl, setGeneratedImage] = useState<string | undefined>();

  useEffect(() => {
    if (!chapterId) {
      setGeneratedImage(undefined);
      return;
    }

    setGeneratedImage(getGeneratedImageUrl(chapterId));
  }, [chapterId]);

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
      actions={
        <Link href={routes.chapterEditor(chapterQuery.data.storyId, chapterQuery.data.id)}>
          <Button variant="secondary">Редактировать главу</Button>
        </Link>
      }
    >
      <div className="space-y-5">
        {generatedImageUrl ? (
          <Image
            src={generatedImageUrl}
            alt={chapterQuery.data.title}
            width={960}
            height={540}
            unoptimized
            className="w-full rounded-[28px] border border-[var(--plotty-line)] object-cover"
          />
        ) : null}

        <ShellCard title={chapterQuery.data.title} description={`${chapterQuery.data.wordCount ?? 0} слов`}>
          <div className="space-y-4">
            <div className="whitespace-pre-wrap text-[15px] leading-8 text-[var(--plotty-ink)]">
              {chapterQuery.data.content}
            </div>

            <div className="flex flex-wrap justify-between gap-3 border-t border-[var(--plotty-line)] pt-4">
              {prevChapter ? (
                <Link href={routes.chapter(slug, prevChapter.number ?? chapterNumber - 1)}>
                  <Button variant="secondary">Предыдущая глава</Button>
                </Link>
              ) : (
                <span />
              )}
              {nextChapter ? (
                <Link href={routes.chapter(slug, nextChapter.number ?? chapterNumber + 1)}>
                  <Button variant="secondary">Следующая глава</Button>
                </Link>
              ) : null}
            </div>
          </div>
        </ShellCard>
      </div>
    </PlottyShell>
  );
}
