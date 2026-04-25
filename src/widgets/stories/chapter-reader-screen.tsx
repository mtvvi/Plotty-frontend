"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/entities/auth/model/auth-context";
import {
  addChapterComment,
  chapterCommentsQueryOptions,
  chapterDetailsQueryOptions,
  chapterWikiQueryOptions,
  deleteStoryComment,
  storyDetailsQueryOptions,
  storyKeys,
} from "@/entities/story/api/stories-api";
import type { ChapterWiki, ChapterWikiEntity, StoryCommentsResponse } from "@/entities/story/model/types";
import { isAuthError } from "@/shared/api/fetch-json";
import { publicChaptersForReader } from "@/entities/story/model/story-query";
import { routes } from "@/shared/config/routes";
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
  const [wikiOpen, setWikiOpen] = useState(false);
  const wikiQuery = useQuery(chapterWikiQueryOptions(chapterId, { enabled: wikiOpen && Boolean(chapterId) }));

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
      <PlottyShell title="Глава загружается" description="Подтягиваем историю и текст главы.">
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
      <PlottyShell title="Глава не найдена" description="Проверьте номер главы или вернитесь в историю.">
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
      title={`${story.title} • Глава ${displayChapterNumber}`}
      description={`Обновлена ${new Date(chapter.updatedAt).toLocaleString("ru-RU")}`}
      actions={
        chapterPublished ? (
          <Button type="button" variant="secondary" onClick={() => setWikiOpen(true)}>
            Справочник
          </Button>
        ) : undefined
      }
    >
      <div className="mx-auto max-w-4xl space-y-5">
        {chapter.imageUrl ? <ChapterImageFrame title={chapter.title} imageUrl={chapter.imageUrl} /> : null}

        <ShellCard title={chapter.title} description={`${chapter.wordCount ?? 0} слов`} className="bg-[rgba(255,255,255,0.72)]">
          <div className="space-y-5">
            <div className="whitespace-pre-wrap text-[15px] leading-8 text-[var(--plotty-ink)] md:text-[16px] md:leading-9">
              {chapter.content}
            </div>

            <div className="flex flex-wrap justify-between gap-3 border-t border-[var(--plotty-line)] pt-4">
              {chapterPublished && prevChapter ? (
                <ButtonLink
                  href={routes.chapter(slug, prevChapter.number ?? displayChapterNumber - 1)}
                  variant="secondary"
                >
                  Предыдущая глава
                </ButtonLink>
              ) : (
                <span />
              )}
              {chapterPublished && nextChapter ? (
                <ButtonLink
                  href={routes.chapter(slug, nextChapter.number ?? displayChapterNumber + 1)}
                  variant="secondary"
                >
                  Следующая глава
                </ButtonLink>
              ) : null}
            </div>
          </div>
        </ShellCard>

        {chapterPublished ? (
          <section id="chapter-comments" className="scroll-mt-24 space-y-5 rounded-[24px] border border-[rgba(41,38,34,0.08)] bg-[rgba(255,255,255,0.78)] p-4 sm:p-6">
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
                    className="min-h-32"
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
                  <div key={comment.id} className="rounded-[20px] border border-[rgba(41,38,34,0.08)] bg-white/78 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-[var(--plotty-ink)]">{comment.author.username}</div>
                        <div className="plotty-meta">{new Date(comment.createdAt).toLocaleString("ru-RU")}</div>
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
                    <p className="mt-3 text-sm leading-7 text-[var(--plotty-ink)]">{comment.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Комментариев пока нет" description="Станьте первым, кто откликнется на эту главу." />
            )}
          </section>
        ) : (
          <p className="plotty-meta text-center text-sm">Комментарии будут доступны после публикации главы.</p>
        )}
      </div>
      {wikiOpen ? (
        <ChapterWikiDrawer
          wiki={wikiQuery.data}
          isLoading={wikiQuery.isLoading}
          isError={wikiQuery.isError}
          onClose={() => setWikiOpen(false)}
        />
      ) : null}
    </PlottyShell>
  );
}

function ChapterWikiDrawer({
  wiki,
  isLoading,
  isError,
  onClose,
}: {
  wiki?: ChapterWiki;
  isLoading: boolean;
  isError: boolean;
  onClose: () => void;
}) {
  const sections = [
    { title: "Персонажи", items: normalizeWikiItems(wiki?.characters) },
    { title: "Локации", items: normalizeWikiItems(wiki?.locations) },
    { title: "Предметы", items: normalizeWikiItems(wiki?.items) },
  ];
  const hasItems = sections.some((section) => section.items.length > 0);

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Закрыть справочник"
        className="absolute inset-0 bg-[rgba(35,33,30,0.38)] backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-[30rem] flex-col border-l border-[rgba(41,38,34,0.08)] bg-[rgba(247,242,234,0.98)] p-5 shadow-[var(--plotty-shadow)] sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="plotty-kicker">Бесспойлерно</div>
            <h2 className="plotty-section-title">Справочник</h2>
            <p className="plotty-meta">Состояние мира доступно только по уже опубликованным ранее главам.</p>
          </div>
          <Button type="button" variant="secondary" className="min-h-10 px-3 text-sm" onClick={onClose}>
            Закрыть
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-24 rounded-[18px] bg-white/60" />
              <div className="h-24 rounded-[18px] bg-white/60" />
              <div className="h-24 rounded-[18px] bg-white/60" />
            </div>
          ) : isError ? (
            <EmptyState title="Справочник недоступен" description="Не удалось загрузить состояние персонажей для этой главы." />
          ) : hasItems ? (
            <div className="space-y-5">
              {sections.map((section) =>
                section.items.length ? (
                  <section key={section.title} className="space-y-3">
                    <h3 className="plotty-section-title text-[1rem]">{section.title}</h3>
                    <div className="space-y-2">
                      {section.items.map((item, index) => (
                        <div
                          key={`${section.title}-${item.name}-${index}`}
                          className="rounded-[18px] border border-[rgba(41,38,34,0.08)] bg-white/78 p-4"
                        >
                          <div className="text-sm font-semibold text-[var(--plotty-ink)]">{item.name}</div>
                          {item.state ? <p className="mt-2 text-sm leading-6 text-[var(--plotty-muted)]">{item.state}</p> : null}
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null,
              )}
            </div>
          ) : (
            <EmptyState title="Справочник пока пуст" description="Для этой точки истории еще нет открытых персонажей, локаций или предметов." />
          )}
        </div>
      </aside>
    </div>
  );
}

function normalizeWikiItems(value: unknown): Array<{ name: string; state?: string }> {
  if (!Array.isArray(value)) {
    return [];
  }

  const items: Array<{ name: string; state?: string }> = [];

  value.forEach((item: ChapterWikiEntity | unknown) => {
    if (!item || typeof item !== "object") {
      return;
    }

    const entity = item as ChapterWikiEntity;
    const name = typeof entity.name === "string" ? entity.name.trim() : "";
    const state =
      typeof entity.state === "string"
        ? entity.state.trim()
        : typeof entity.description === "string"
          ? entity.description.trim()
          : "";

    if (name) {
      items.push({ name, state });
    }
  });

  return items;
}
