"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, X } from "lucide-react";

import { useAuth } from "@/entities/auth/model/auth-context";
import {
  addChapterComment,
  chapterCommentsQueryOptions,
  chapterDetailsQueryOptions,
  chapterWikiQueryOptions,
  deleteStoryComment,
  markChapterViewed,
  storyDetailsQueryOptions,
  storyKeys,
} from "@/entities/story/api/stories-api";
import type { ChapterWiki, ChapterWikiEntity, StoryCommentsResponse } from "@/entities/story/model/types";
import { isAuthError } from "@/shared/api/fetch-json";
import { publicChaptersForReader } from "@/entities/story/model/story-query";
import { routes } from "@/shared/config/routes";
import { cn, pluralizeRu } from "@/shared/lib/utils";
import { Button, ButtonLink } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { Field, FieldLabel } from "@/shared/ui/field";
import { IconButton } from "@/shared/ui/icon-button";
import { AnimatedList } from "@/shared/ui/motion";
import { Textarea } from "@/shared/ui/textarea";

import {
  ChapterSortButton,
  sortChaptersForDisplay,
  type ChapterSortDirection,
} from "./chapter-list-sort";
import { ChapterImageFrame } from "./chapter-image-frame";
import { PlottyShell, ShellCard } from "./plotty-shell";

type ReaderProgressStyle = CSSProperties & { "--plotty-reader-progress": number };

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
  const { isAuthenticated, user } = useAuth();
  const chapterNumberFromUrl = number !== undefined ? Number(number) : NaN;
  const storyQuery = useQuery(storyDetailsQueryOptions(slug));
  const readerChapters = useMemo(
    () => (storyQuery.data ? publicChaptersForReader(storyQuery.data.chapters) : []),
    [storyQuery.data],
  );
  const [chapterSortDirection, setChapterSortDirection] = useState<ChapterSortDirection>("asc");
  const sortedReaderChapters = useMemo(
    () => sortChaptersForDisplay(readerChapters, chapterSortDirection),
    [chapterSortDirection, readerChapters],
  );
  const chaptersScrollRef = useRef<HTMLDivElement | null>(null);
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
  const readerChapterMeta = readerChapters.find((ch) => ch.id === chapterId);
  const chapterPublished = (chapterMeta?.status ?? "published") === "published";
  const displayChapterNumber = readerChapterMeta?.number ?? chapterMeta?.number ?? chapterNumberFromUrl;
  const chapterQuery = useQuery(chapterDetailsQueryOptions(chapterId));
  const commentsQuery = useQuery({
    ...chapterCommentsQueryOptions(storyQuery.data?.id ?? "", chapterId),
    enabled: Boolean(storyQuery.data?.id && chapterId && chapterPublished),
  });
  const [commentDraft, setCommentDraft] = useState("");
  const [wikiOpen, setWikiOpen] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
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

  useEffect(() => {
    if (!chapterId || !chapterPublished || !chapterQuery.data) {
      return;
    }

    void markChapterViewed(chapterId).finally(() => {
      void queryClient.invalidateQueries({ queryKey: storyKeys.chaptersViewed(slug) });
      void queryClient.invalidateQueries({ queryKey: storyKeys.chapterViewed(chapterId) });
    });
  }, [chapterId, chapterPublished, chapterQuery.data, queryClient, slug]);

  const readingProgressContentKey = chapterQuery.data?.publishedContent ?? chapterQuery.data?.content ?? "";

  useEffect(() => {
    function updateReadingProgress() {
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      const nextProgress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;

      setReadingProgress(Math.min(1, Math.max(0, nextProgress)));
    }

    updateReadingProgress();
    window.addEventListener("scroll", updateReadingProgress, { passive: true });
    window.addEventListener("resize", updateReadingProgress);

    return () => {
      window.removeEventListener("scroll", updateReadingProgress);
      window.removeEventListener("resize", updateReadingProgress);
    };
  }, [chapterId, readingProgressContentKey]);

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
  const shouldReadPublishedVersion = chapterPublished && !chapterIdFromRoute;
  const readerChapterTitle = shouldReadPublishedVersion ? chapter.publishedTitle ?? chapter.title : chapter.title;
  const readerChapterContent = shouldReadPublishedVersion ? chapter.publishedContent ?? chapter.content : chapter.content;
  const readerWordCount = countWords(readerChapterContent);

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

  function toggleChapterSortDirection() {
    setChapterSortDirection((current) => (current === "asc" ? "desc" : "asc"));
    window.requestAnimationFrame(() => {
      chaptersScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  return (
    <PlottyShell
      title={
        <span className="plotty-page-title-row">
          <Link
            href={routes.story(story.slug)}
            className="plotty-story-title-anchor plotty-story-title-inline-anchor group text-[var(--plotty-ink)] transition-colors hover:text-[var(--plotty-accent)] focus-visible:text-[var(--plotty-accent)]"
          >
            <ArrowLeft className="plotty-page-title-back-icon size-8 shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5" aria-hidden="true" />
            <span className="plotty-story-title-text text-[2rem]">{story.title}</span>
          </Link>
          <span className="plotty-page-title-part text-[2rem]">{`• Глава ${displayChapterNumber}`}</span>
        </span>
      }
      description={`Обновлена ${new Date(chapter.updatedAt).toLocaleString("ru-RU")}`}
      actions={
        chapterPublished ? (
          <Button type="button" variant="secondary" onClick={() => setWikiOpen(true)}>
            Справочник
          </Button>
        ) : undefined
      }
    >
      <div className="plotty-reader-progress" aria-hidden="true">
        <div
          className="plotty-reader-progress-bar"
          style={{ "--plotty-reader-progress": readingProgress } as ReaderProgressStyle}
        />
      </div>
      <div className="plotty-stagger mx-auto max-w-4xl space-y-5">
        {chapter.imageUrl ? (
          <div className="plotty-stagger-item">
            <ChapterImageFrame title={readerChapterTitle} imageUrl={chapter.imageUrl} />
          </div>
        ) : null}

        <ShellCard
          title={<span className="plotty-chapter-title-motion">{readerChapterTitle}</span>}
          description={formatWordCount(readerWordCount)}
          className="plotty-stagger-item plotty-lift-panel bg-[rgba(255,255,255,0.72)]"
        >
          <div className="space-y-5">
            <div className="whitespace-pre-wrap text-[15px] leading-8 text-[var(--plotty-ink)] md:text-[16px] md:leading-9">
              {readerChapterContent}
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

        {readerChapters.length > 1 ? (
          <section className="plotty-stagger-item space-y-4 rounded-[24px] border border-[rgba(41,38,34,0.08)] bg-[rgba(255,255,255,0.78)] p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <h2 className="plotty-section-title">Главы истории</h2>
                <p className="plotty-meta">
                  {readerChapters.length} {getChapterLabel(readerChapters.length)}
                </p>
              </div>
              <ChapterSortButton
                chapterCount={readerChapters.length}
                direction={chapterSortDirection}
                onToggle={toggleChapterSortDirection}
              />
            </div>
            <AnimatedList
              items={sortedReaderChapters}
              getKey={(item) => item.id}
              listRef={chaptersScrollRef}
              className="plotty-scroll-panel plotty-reader-chapter-list divide-y divide-[var(--plotty-line)] rounded-[var(--plotty-radius-md)] border border-[var(--plotty-line)] bg-[rgba(255,253,249,0.62)]"
              renderItem={(item) => {
                const isCurrent = item.id === chapterId;

                return (
                  <div
                    className={cn(
                      "plotty-lift-panel grid gap-3 px-4 py-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center",
                      isCurrent && "bg-[var(--plotty-accent-soft)]",
                    )}
                  >
                    <span className="plotty-card-title text-[1.2rem]">{item.number ?? "—"}.</span>
                    <div className="min-w-0">
                      <Link
                        href={routes.chapter(story.slug, item.number ?? 1)}
                        className={cn(
                          "plotty-story-title-anchor plotty-card-title text-[1.08rem] hover:text-[var(--plotty-accent)]",
                          isCurrent && "text-[var(--plotty-accent)]",
                        )}
                        aria-current={isCurrent ? "page" : undefined}
                      >
                        <span className="plotty-story-title-text">{item.title}</span>
                      </Link>
                      <p className="plotty-meta mt-1">{new Date(item.updatedAt).toLocaleDateString("ru-RU")}</p>
                    </div>
                    {isCurrent ? (
                      <Button type="button" variant="primary" size="sm" disabled>
                        Сейчас
                      </Button>
                    ) : (
                      <ButtonLink href={routes.chapter(story.slug, item.number ?? 1)} variant="secondary" size="sm">
                        Открыть
                      </ButtonLink>
                    )}
                  </div>
                );
              }}
            />
          </section>
        ) : null}

        {chapterPublished ? (
          <section id="chapter-comments" className="plotty-stagger-item scroll-mt-24 space-y-5 rounded-[24px] border border-[rgba(41,38,34,0.08)] bg-[rgba(255,255,255,0.78)] p-4 sm:p-6">
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
            ) : commentsQuery.isError ? (
              <EmptyState
                title="Комментарии недоступны"
                description="Не удалось загрузить обсуждение этой главы."
                actionLabel="Повторить"
                onAction={() => void commentsQuery.refetch()}
              />
            ) : commentsQuery.data?.items.length ? (
              <div className="space-y-3">
                {commentsQuery.data.items.map((comment) => (
                  <div key={comment.id} className="rounded-[20px] border border-[rgba(41,38,34,0.08)] bg-white/78 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <Link
                        href={routes.user(comment.author.username)}
                        className="flex min-w-0 items-start gap-3 rounded-[14px] transition-colors hover:bg-[rgba(41,38,34,0.04)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plotty-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                      >
                        <CommentAvatar username={comment.author.username} avatarUrl={comment.author.avatarUrl} />
                        <span className="min-w-0 space-y-1">
                          <span className="block truncate text-sm font-semibold text-[var(--plotty-ink)]">
                            {comment.author.username}
                          </span>
                          <span className="plotty-meta block">{new Date(comment.createdAt).toLocaleString("ru-RU")}</span>
                        </span>
                      </Link>
                      {(comment.viewerCanDelete ?? Boolean(user?.id === comment.author.id)) ? (
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
                    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-[var(--plotty-ink)]">{comment.content}</p>
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

function countWords(content: string) {
  return content.trim() ? content.trim().split(/\s+/).length : 0;
}

function formatWordCount(count: number) {
  return `${count} ${pluralizeRu(count, ["слово", "слова", "слов"])}`;
}

function getChapterLabel(count: number) {
  return pluralizeRu(count, ["глава", "главы", "глав"]);
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
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const sections = [
    { title: "Персонажи", items: normalizeWikiItems(wiki?.characters) },
    { title: "Локации", items: normalizeWikiItems(wiki?.locations) },
    { title: "Предметы", items: normalizeWikiItems(wiki?.items) },
  ];
  const hasItems = sections.some((section) => section.items.length > 0);

  return createPortal(
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Закрыть справочник"
        className="absolute inset-0 bg-[rgba(35,33,30,0.38)] backdrop-blur-sm animate-[plotty-reveal-overlay_var(--motion-base)_var(--ease-out-soft)_both]"
        onClick={onClose}
      />
      <aside className="plotty-motion-drawer absolute inset-y-0 right-0 flex w-full max-w-[30rem] flex-col border-l border-[rgba(41,38,34,0.08)] bg-[rgba(247,242,234,0.98)] p-5 shadow-[var(--plotty-shadow)] sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="plotty-kicker">Бесспойлерно</div>
            <h2 className="plotty-section-title">Справочник</h2>
            <p className="plotty-meta">Состояние мира доступно только по уже опубликованным ранее главам.</p>
          </div>
          <IconButton aria-label="Закрыть справочник" size="sm" onClick={onClose}>
            <X className="size-5" aria-hidden="true" />
          </IconButton>
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
            <EmptyState title="Справочник пока пуст" />
          )}
        </div>
      </aside>
    </div>,
    document.body,
  );
}

function CommentAvatar({
  username,
  avatarUrl,
}: {
  username: string;
  avatarUrl?: string | null;
}) {
  const className = "size-10 shrink-0 rounded-full border border-[rgba(41,38,34,0.08)]";

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={avatarUrl} alt={`Аватар ${username}`} className={`${className} object-cover`} />
    );
  }

  return (
    <span className={`${className} flex items-center justify-center bg-[rgba(188,95,61,0.12)] text-sm font-bold text-[var(--plotty-accent)]`}>
      {username.slice(0, 1).toUpperCase()}
    </span>
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
