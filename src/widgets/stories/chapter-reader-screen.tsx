"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/entities/auth/model/auth-context";
import {
  addChapterComment,
  chapterCommentsQueryOptions,
  chapterDetailsQueryOptions,
  deleteStoryComment,
  storyDetailsQueryOptions,
  storyKeys,
} from "@/entities/story/api/stories-api";
import type { StoryCommentsResponse } from "@/entities/story/model/types";
import { isAuthError } from "@/shared/api/fetch-json";
import { publicChaptersForReader } from "@/entities/story/model/story-query";
import { routes } from "@/shared/config/routes";
import { cn } from "@/shared/lib/utils";
import {
  readerFontSizeValues,
  readerThemeButtonClasses,
  readerThemeMutedClasses,
  readerThemePageClasses,
  readerThemeSurfaceClasses,
  useReaderSettings,
} from "@/shared/model/reader-settings";
import { Button, ButtonLink } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { Field, FieldLabel } from "@/shared/ui/field";
import { Textarea } from "@/shared/ui/textarea";

import { ChapterImageFrame } from "./chapter-image-frame";
import { PlottyShell, ShellCard } from "./plotty-shell";

export function ChapterReaderScreen({
  slug,
  number,
  chapterId: chapterIdFromRoute,
}: {
  slug: string;
  /** Номер главы среди опубликованных (маршрут `/chapters/[number]`). */
  number?: string;
  /** Просмотр по id черновика или точной главы (маршрут `/preview/[chapterId]`). */
  chapterId?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const { settings: readerSettings } = useReaderSettings();
  const chapterNumberFromUrl = number !== undefined ? Number(number) : NaN;
  const storyQuery = useQuery(storyDetailsQueryOptions(slug));
  const readerChapters = useMemo(
    () => (storyQuery.data ? publicChaptersForReader(storyQuery.data.chapters) : []),
    [storyQuery.data],
  );
  const chapterId = useMemo(() => {
    if (chapterIdFromRoute) {
      return chapterIdFromRoute;
    }

    if (!Number.isFinite(chapterNumberFromUrl)) {
      return "";
    }

    return readerChapters.find((chapter) => chapter.number === chapterNumberFromUrl)?.id ?? "";
  }, [chapterIdFromRoute, chapterNumberFromUrl, readerChapters]);
  const chapterMeta = storyQuery.data?.chapters.find((ch) => ch.id === chapterId);
  const chapterPublished = (chapterMeta?.status ?? "published") === "published";
  const displayChapterNumber = chapterMeta?.number ?? chapterNumberFromUrl;
  const chapterQuery = useQuery(chapterDetailsQueryOptions(chapterId));
  const commentsQuery = useQuery({
    ...chapterCommentsQueryOptions(storyQuery.data?.id ?? "", chapterId),
    enabled: Boolean(storyQuery.data?.id && chapterId && chapterPublished),
  });
  const [commentDraft, setCommentDraft] = useState("");

  const addCommentMutation = useMutation({
    mutationFn: ({
      storyId,
      chId,
      content,
    }: {
      storyId: string;
      chId: string;
      content: string;
    }) => addChapterComment(storyId, chId, { content }),
  });
  const deleteCommentMutation = useMutation({
    mutationFn: deleteStoryComment,
  });

  useEffect(() => {
    if (typeof window === "undefined" || window.location.hash !== "#comments") {
      return;
    }

    const id = "chapter-comments";
    const el = document.getElementById(id);

    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [chapterId, commentsQuery.isSuccess]);

  if (storyQuery.isLoading || (chapterId && chapterQuery.isLoading)) {
    return (
      <PlottyShell variant="reader" title="Глава загружается" description="Подтягиваем историю и текст главы.">
        <div className="h-72 rounded-[24px] bg-white/40" />
      </PlottyShell>
    );
  }

  const chapterMissingInStory =
    Boolean(chapterIdFromRoute && storyQuery.data) && !storyQuery.data?.chapters.some((ch) => ch.id === chapterId);

  if (
    storyQuery.isError ||
    !storyQuery.data ||
    !chapterId ||
    chapterMissingInStory ||
    chapterQuery.isError ||
    !chapterQuery.data
  ) {
    return (
      <PlottyShell variant="reader" title="Глава не найдена" description="Проверьте номер главы или вернитесь в историю.">
        <EmptyState title="Глава не найдена" description="Такой главы нет в текущей истории." />
      </PlottyShell>
    );
  }

  const story = storyQuery.data;
  const chapter = chapterQuery.data;
  const currentIndex = readerChapters.findIndex((ch) => ch.id === chapterId);
  const prevChapter = currentIndex > 0 ? readerChapters[currentIndex - 1] : null;
  const nextChapter =
    currentIndex >= 0 && currentIndex < readerChapters.length - 1 ? readerChapters[currentIndex + 1] : null;
  async function handleAddComment() {
    const content = commentDraft.trim();

    if (!content || !isAuthenticated) {
      if (!isAuthenticated) {
        router.push(routes.auth({ next: `${pathname}#comments` }));
      }

      return;
    }

    try {
      const comment = await addCommentMutation.mutateAsync({
        storyId: story.id,
        chId: chapterId,
        content,
      });

      queryClient.setQueryData<StoryCommentsResponse | undefined>(storyKeys.chapterComments(chapterId), (current) => ({
        items: [comment, ...(current?.items ?? [])],
      }));
      setCommentDraft("");
    } catch (error) {
      if (isAuthError(error)) {
        router.push(routes.auth({ next: `${pathname}#comments` }));
      }
    }
  }

  async function handleDeleteComment(commentId: string) {
    const currentComments = commentsQuery.data?.items ?? [];

    queryClient.setQueryData<StoryCommentsResponse | undefined>(storyKeys.chapterComments(chapterId), {
      items: currentComments.filter((c) => c.id !== commentId),
    });

    try {
      await deleteCommentMutation.mutateAsync(commentId);
    } catch (error) {
      queryClient.setQueryData(storyKeys.chapterComments(chapterId), { items: currentComments });

      if (isAuthError(error)) {
        router.push(routes.auth({ next: `${pathname}#comments` }));
      }
    }
  }

  return (
    <PlottyShell
      variant="reader"
      showMobileBack={false}
      suppressPageIntro
      title={`${story.title} • Глава ${displayChapterNumber}`}
      description={`Обновлена ${new Date(chapter.updatedAt).toLocaleString("ru-RU")}`}
    >
      <div
        className={cn(
          "reader-controls -mx-4 -mb-6 -mt-3.5 min-h-[calc(100vh-8rem)] space-y-5 px-4 pb-8 pt-6 transition-[background-color,color,padding] duration-150 sm:-mx-6 sm:px-6 lg:-mx-7 lg:-mb-7 lg:-mt-[18px] lg:px-7 lg:pt-8",
          readerThemePageClasses[readerSettings.theme],
        )}
      >
        <div className="mx-auto max-w-[70ch] space-y-5 px-1 transition-[padding] duration-150 sm:px-0">
          {chapter.imageUrl ? <ChapterImageFrame variant="reader" title={chapter.title} imageUrl={chapter.imageUrl} /> : null}

          <ShellCard
            title={chapter.title}
            description={`${chapter.wordCount ?? 0} слов`}
            className={cn("px-5 py-5 sm:px-6 lg:px-7", readerThemeSurfaceClasses[readerSettings.theme])}
          >
            <div className="space-y-5">
              <div
                className="whitespace-pre-wrap"
                style={{
                  fontSize: readerFontSizeValues[readerSettings.fontSize],
                  lineHeight: readerSettings.lineHeight,
                }}
              >
                {chapter.content}
              </div>

            </div>
          </ShellCard>
        </div>

        {chapterPublished && (prevChapter || nextChapter) ? (
          <div
            className="mx-auto flex max-w-[70ch] flex-wrap justify-between gap-3 px-1 sm:px-0"
            onClick={(event) => event.stopPropagation()}
          >
            {prevChapter ? (
              <ButtonLink
                href={routes.chapter(slug, prevChapter.number ?? displayChapterNumber - 1)}
                variant="secondary"
                className={readerThemeButtonClasses[readerSettings.theme]}
              >
                Предыдущая глава
              </ButtonLink>
            ) : (
              <span />
            )}
            {nextChapter ? (
              <ButtonLink
                href={routes.chapter(slug, nextChapter.number ?? displayChapterNumber + 1)}
                variant="secondary"
                className={readerThemeButtonClasses[readerSettings.theme]}
              >
                Следующая глава
              </ButtonLink>
            ) : null}
          </div>
        ) : null}

        {chapterPublished ? (
          <section
            id="chapter-comments"
            className={cn("mx-auto max-w-[70ch] scroll-mt-24 space-y-5 rounded-[24px] p-4 sm:p-6", readerThemeSurfaceClasses[readerSettings.theme])}
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="plotty-section-title">Комментарии к главе</h2>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
              <div className="space-y-4">
                <Field>
                  <FieldLabel htmlFor="chapter-comment">Новый комментарий</FieldLabel>
                  <Textarea
                    id="chapter-comment"
                    value={commentDraft}
                    onChange={(event) => setCommentDraft(event.target.value)}
                    placeholder={
                      isAuthenticated ? "Поделитесь впечатлением о этой главе" : "Войдите, чтобы оставить комментарий"
                    }
                    className={cn(
                      "min-h-32",
                      readerSettings.theme === "dark" &&
                        "!border-[rgba(255,255,255,0.18)] !bg-[#171513] !text-[#f6eadb] placeholder:!text-[#9f9283] focus:!border-[var(--plotty-accent)]",
                    )}
                    disabled={addCommentMutation.isPending}
                  />
                </Field>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary" onClick={handleAddComment} disabled={addCommentMutation.isPending || !commentDraft.trim()}>
                    {addCommentMutation.isPending ? "Публикуем..." : "Добавить комментарий"}
                  </Button>
                </div>
              </div>
            </div>

            {commentsQuery.isLoading ? (
              <div className="space-y-3">
                <div className="h-28 rounded-[20px] bg-white/50" />
                <div className="h-28 rounded-[20px] bg-white/50" />
              </div>
            ) : commentsQuery.data?.items.length ? (
              <div className="space-y-3">
                {commentsQuery.data.items.map((comment) => (
                  <div key={comment.id} className={cn("rounded-[20px] border p-4", readerThemeSurfaceClasses[readerSettings.theme])}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="text-sm font-semibold">{comment.author.username}</div>
                        <div className={cn("text-[13px] font-semibold leading-5", readerThemeMutedClasses[readerSettings.theme])}>
                          {new Date(comment.createdAt).toLocaleString("ru-RU")}
                        </div>
                      </div>
                      {comment.viewerCanDelete ? (
                        <Button
                          variant="ghost"
                          className="min-h-9 px-2.5 text-sm"
                          onClick={() => handleDeleteComment(comment.id)}
                          disabled={deleteCommentMutation.isPending}
                        >
                          Удалить
                        </Button>
                      ) : null}
                    </div>
                    <p className="mt-3 text-sm leading-7">{comment.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className={cn("rounded-[20px] border p-6 text-center sm:p-8", readerThemeSurfaceClasses[readerSettings.theme])}>
                <div className="mx-auto max-w-md space-y-3.5">
                  <h3 className="plotty-section-title text-[1.35rem]">Комментариев пока нет</h3>
                  <p className={cn("plotty-body", readerThemeMutedClasses[readerSettings.theme])}>
                    Станьте первым, кто откликнется на эту главу.
                  </p>
                </div>
              </div>
            )}
          </section>
        ) : (
          <p className={cn("text-center text-sm font-semibold", readerThemeMutedClasses[readerSettings.theme])}>Комментарии будут доступны после публикации главы.</p>
        )}
      </div>
    </PlottyShell>
  );
}
