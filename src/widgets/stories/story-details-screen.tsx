"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useAuth } from "@/entities/auth/model/auth-context";
import {
  addStoryComment,
  chapterDetailsQueryOptions,
  deleteStoryComment,
  likeStory,
  patchStorySummaryCaches,
  storyCommentsQueryOptions,
  storyDetailsQueryOptions,
  storyKeys,
  unlikeStory,
} from "@/entities/story/api/stories-api";
import type { StoryCommentsResponse } from "@/entities/story/model/types";
import { getStoryTextOverride } from "@/entities/story/model/story-text-cache";
import { isAuthError } from "@/shared/api/fetch-json";
import { routes } from "@/shared/config/routes";
import { Button, ButtonLink } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { Field, FieldLabel } from "@/shared/ui/field";
import { TabButton } from "@/shared/ui/tabs";
import { Textarea } from "@/shared/ui/textarea";
import { PlottyAppMenu, PlottyPageShell, PlottySectionCard } from "@/widgets/layout/plotty-page-shell";

import { StoryCoverPreview } from "./story-cover-preview";
import { StoryTagChip } from "./story-tag-chip";

type StorySection = "description" | "chapters" | "comments";

export function StoryDetailsScreen({ slug }: { slug: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const storyQuery = useQuery(storyDetailsQueryOptions(slug));
  const [activeSection, setActiveSection] = useState<StorySection>(getInitialSection(searchParams.get("tab")));
  const [commentDraft, setCommentDraft] = useState("");
  const firstChapter = storyQuery.data?.chapters[0] ?? null;
  const firstChapterQuery = useQuery({
    ...chapterDetailsQueryOptions(firstChapter?.id ?? ""),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
  const commentsQuery = useQuery({
    ...storyCommentsQueryOptions(storyQuery.data?.id ?? ""),
    enabled: Boolean(storyQuery.data?.id) && activeSection === "comments",
  });
  const likeMutation = useMutation({
    mutationFn: ({ liked, storyId }: { liked: boolean; storyId: string }) => (liked ? unlikeStory(storyId) : likeStory(storyId)),
  });
  const addCommentMutation = useMutation({
    mutationFn: ({ storyId, content }: { storyId: string; content: string }) => addStoryComment(storyId, { content }),
  });
  const deleteCommentMutation = useMutation({
    mutationFn: deleteStoryComment,
  });

  useEffect(() => {
    setActiveSection(getInitialSection(searchParams.get("tab")));
  }, [searchParams]);

  if (storyQuery.isLoading) {
    return (
      <PlottyPageShell
        pageTitle="История загружается"
        pageDescription="Собираем метаданные истории и список глав."
        menuContent={({ closeMenu }) => <PlottyAppMenu onNavigate={closeMenu} />}
      >
        <div className="h-72 rounded-[24px] bg-white/40" />
      </PlottyPageShell>
    );
  }

  if (storyQuery.isError || !storyQuery.data) {
    return (
      <PlottyPageShell
        pageTitle="История не найдена"
        pageDescription="Либо slug неверный, либо бэкенд не отдал данные."
        menuContent={({ closeMenu }) => <PlottyAppMenu onNavigate={closeMenu} />}
      >
        <EmptyState title="История не найдена" description="Вернитесь в каталог и выберите другую историю." />
      </PlottyPageShell>
    );
  }

  const story = storyQuery.data;

  const textOverride = getStoryTextOverride(story.id);
  const storyDescription =
    textOverride?.description ??
    story.description ??
    story.excerpt ??
    "Описание истории пока не заполнено.";
  const storyTeaser =
    textOverride?.excerpt ??
    story.excerpt ??
    story.description ??
    "Описание истории пока не заполнено.";
  const displayCoverImage =
    story.coverImageUrl ??
    firstChapterQuery.data?.imageUrl;
  const viewerHasLiked = Boolean(story.viewerHasLiked);
  const genericTags = story.tags.filter((tag) => !["completion", "rating", "size"].includes(tag.category ?? ""));

  async function handleToggleLike() {
    const nextLiked = !viewerHasLiked;
    const previousLikesCount = story.likesCount ?? 0;

    patchStorySummaryCaches(queryClient, story.id, {
      likesCount: Math.max(previousLikesCount + (nextLiked ? 1 : -1), 0),
      viewerHasLiked: nextLiked,
    });

    try {
      const result = await likeMutation.mutateAsync({ liked: viewerHasLiked, storyId: story.id });

      patchStorySummaryCaches(queryClient, story.id, {
        likesCount: result.likesCount,
        commentsCount: result.commentsCount,
        bookmarksCount: result.bookmarksCount,
        viewsCount: result.viewsCount,
        viewerHasLiked: result.viewerHasLiked,
      });
    } catch (error) {
      patchStorySummaryCaches(queryClient, story.id, {
        likesCount: previousLikesCount,
        viewerHasLiked,
      });

      if (isAuthError(error)) {
        router.push(routes.auth({ next: routes.story(slug) }));
      }
    }
  }

  async function handleAddComment() {
    const content = commentDraft.trim();

    if (!content) {
      return;
    }

    if (!isAuthenticated) {
      router.push(routes.auth({ next: `${routes.story(slug)}?tab=comments` }));
      return;
    }

    try {
      const comment = await addCommentMutation.mutateAsync({
        storyId: story.id,
        content,
      });

      queryClient.setQueryData<StoryCommentsResponse | undefined>(
        storyKeys.comments(story.id),
        (current) => ({
          items: [comment, ...(current?.items ?? [])],
        }),
      );
      patchStorySummaryCaches(queryClient, story.id, {
        commentsCount: (story.commentsCount ?? 0) + 1,
      });
      setCommentDraft("");
    } catch (error) {
      if (isAuthError(error)) {
        router.push(routes.auth({ next: `${routes.story(slug)}?tab=comments` }));
      }
    }
  }

  async function handleDeleteComment(commentId: string) {
    const currentComments = commentsQuery.data?.items ?? [];

    queryClient.setQueryData<StoryCommentsResponse | undefined>(storyKeys.comments(story.id), {
      items: currentComments.filter((comment) => comment.id !== commentId),
    });
    patchStorySummaryCaches(queryClient, story.id, {
      commentsCount: Math.max((story.commentsCount ?? 0) - 1, 0),
    });

    try {
      await deleteCommentMutation.mutateAsync(commentId);
    } catch (error) {
      queryClient.setQueryData(storyKeys.comments(story.id), { items: currentComments });
      patchStorySummaryCaches(queryClient, story.id, {
        commentsCount: story.commentsCount,
      });

      if (isAuthError(error)) {
        router.push(routes.auth({ next: `${routes.story(slug)}?tab=comments` }));
      }
    }
  }

  return (
    <PlottyPageShell
      suppressPageIntro
      showMobileBack
      mobileBackHref={routes.home}
      menuContent={({ closeMenu }) => <PlottyAppMenu onNavigate={closeMenu} />}
    >
      <div className="space-y-4 lg:space-y-5">
        <PlottySectionCard className="overflow-hidden p-0">
          <div className="grid gap-0 xl:grid-cols-[360px_minmax(0,1fr)]">
            <StoryCoverPreview
              title={story.title}
              imageUrl={displayCoverImage}
              className="h-full border-0 border-b border-[rgba(35,33,30,0.08)] xl:border-b-0 xl:border-r"
              imageClassName="h-full"
              fullHeight
            />

            <div className="space-y-5 p-4 sm:p-5 lg:p-6 xl:p-7">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="plotty-kicker">История</div>
                  <h1 className="plotty-page-title text-[2.15rem] leading-[0.95] sm:text-[2.85rem] xl:text-[3.35rem]">
                    {story.title}
                  </h1>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[14px] text-[var(--plotty-muted)]">
                  {story.fandom ? <span>{story.fandom}</span> : null}
                  {story.pairing ? <span>{story.pairing}</span> : null}
                  <span>{story.chapters.length} {getChapterLabel(story.chapters.length)}</span>
                </div>
                <p className="plotty-meta">
                  {story.updatedLabel ?? `Обновлена ${new Date(story.updatedAt).toLocaleString("ru-RU")}`}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {story.statusLabel ? <StoryMetaPill accent>{story.statusLabel}</StoryMetaPill> : null}
                {story.ratingLabel ? <StoryMetaPill>{story.ratingLabel}</StoryMetaPill> : null}
                {story.sizeLabel ? <StoryMetaPill>{story.sizeLabel}</StoryMetaPill> : null}
                {genericTags.map((tag) => (
                  <StoryTagChip key={tag.id} tag={tag} />
                ))}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  {firstChapter ? (
                    <ButtonLink href={routes.chapter(story.slug, firstChapter.number ?? 1)} variant="primary">
                      Читать
                    </ButtonLink>
                  ) : null}
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setActiveSection("chapters")}
                    disabled={!story.chapters.length}
                  >
                    К главам
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleToggleLike}
                    disabled={likeMutation.isPending}
                    className={`plotty-stat transition-colors ${viewerHasLiked ? "bg-[var(--plotty-accent-soft)] text-[var(--plotty-accent)]" : ""}`}
                    aria-pressed={viewerHasLiked}
                    aria-label={viewerHasLiked ? "Убрать лайк" : "Поставить лайк"}
                  >
                    <StatHeartIcon />
                    <span>{formatCount(story.likesCount)}</span>
                  </button>
                  <button type="button" className="plotty-stat" onClick={() => setActiveSection("comments")}>
                    <StatCommentIcon />
                    <span>{formatCount(story.commentsCount)}</span>
                  </button>
                  <span className="plotty-stat">
                    <StatBookmarkIcon />
                    <span>{formatCount(story.bookmarksCount)}</span>
                  </span>
                </div>
              </div>

              <div className="rounded-[20px] border border-[rgba(41,38,34,0.08)] bg-[var(--plotty-panel-muted)] p-4">
                <p
                  className="plotty-body text-[15px] leading-7 text-[var(--plotty-muted)]"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {storyTeaser}
                </p>
              </div>
            </div>
          </div>
        </PlottySectionCard>

        <div className="plotty-segmented">
          <TabButton type="button" isActive={activeSection === "description"} onClick={() => setActiveSection("description")}>
            Описание
          </TabButton>
          <TabButton type="button" isActive={activeSection === "chapters"} onClick={() => setActiveSection("chapters")}>
            Главы
          </TabButton>
          <TabButton type="button" isActive={activeSection === "comments"} onClick={() => setActiveSection("comments")}>
            Комментарии
          </TabButton>
        </div>

        <PlottySectionCard id="story-content" className="space-y-5">
          {activeSection === "description" ? (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
              <div className="space-y-4">
                <p className="plotty-body max-w-4xl text-[16px] leading-8 text-[var(--plotty-ink)] lg:text-[17px]">
                  {storyDescription}
                </p>
                {story.aiHint ? (
                  <div className="rounded-[20px] border border-[rgba(54,81,63,0.1)] bg-[rgba(54,81,63,0.06)] p-4">
                    <div className="plotty-kicker text-[var(--plotty-olive)]">Сводка</div>
                    <p className="mt-2 text-sm leading-6 text-[var(--plotty-muted)]">{story.aiHint}</p>
                  </div>
                ) : null}
              </div>
              <div className="space-y-3 rounded-[22px] border border-[rgba(41,38,34,0.08)] bg-[var(--plotty-panel-muted)] p-4">
                <div className="plotty-section-title">Мета истории</div>
                <div className="grid gap-2 text-sm text-[var(--plotty-muted)]">
                  <span>Создана {new Date(story.createdAt).toLocaleDateString("ru-RU")}</span>
                  <span>{story.updatedLabel ?? `Обновлена ${new Date(story.updatedAt).toLocaleDateString("ru-RU")}`}</span>
                  {story.summaryLabel ? <span>{story.summaryLabel}</span> : null}
                </div>
              </div>
            </div>
          ) : null}

          {activeSection === "chapters" ? (
            story.chapters.length ? (
              <div className="space-y-3">
                {story.chapters.map((chapter) => (
                  <div
                    key={chapter.id}
                    className="flex flex-col gap-4 rounded-[20px] border border-[rgba(41,38,34,0.08)] bg-white/76 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[rgba(188,95,61,0.08)] text-sm font-bold text-[var(--plotty-accent)]">
                        {chapter.number ?? "—"}
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="plotty-card-title text-[1.1rem] leading-7">
                          Глава {chapter.number}. {chapter.title}
                        </div>
                        <div className="plotty-meta text-sm">
                          Обновлена {new Date(chapter.updatedAt).toLocaleString("ru-RU")}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <ButtonLink href={routes.chapter(story.slug, chapter.number ?? 1)} variant="primary">
                        Читать
                      </ButtonLink>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="У истории пока нет глав"
                description="Загляните позже или выберите другую историю из каталога."
              />
            )
          ) : null}

          {activeSection === "comments" ? (
            <div className="space-y-5">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="space-y-4">
                  <Field>
                    <FieldLabel htmlFor="story-comment">Новый комментарий</FieldLabel>
                    <Textarea
                      id="story-comment"
                      value={commentDraft}
                      onChange={(event) => setCommentDraft(event.target.value)}
                      placeholder={isAuthenticated ? "Поделитесь впечатлением о главе, ритме или атмосфере истории" : "Войдите, чтобы оставить комментарий"}
                      className="min-h-32"
                      disabled={addCommentMutation.isPending}
                    />
                  </Field>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="primary" onClick={handleAddComment} disabled={addCommentMutation.isPending || !commentDraft.trim()}>
                      {addCommentMutation.isPending ? "Публикуем..." : "Добавить комментарий"}
                    </Button>
                    {!isAuthenticated ? (
                      <ButtonLink href={routes.auth({ next: `${pathname}?tab=comments` })} variant="secondary">
                        Войти для комментария
                      </ButtonLink>
                    ) : null}
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
                <EmptyState
                  title="Комментариев пока нет"
                  description="Станьте первым читателем, который оставит отзыв о темпе, атмосфере или героях."
                />
              )}
            </div>
          ) : null}
        </PlottySectionCard>
      </div>
    </PlottyPageShell>
  );
}

function StoryMetaPill({
  children,
  accent = false,
}: {
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <span
      className={
        accent
          ? "rounded-full bg-[rgba(188,95,61,0.08)] px-3 py-2 text-[12px] font-semibold text-[var(--plotty-accent)]"
          : "rounded-full border border-[rgba(41,38,34,0.09)] bg-white/82 px-3 py-2 text-[12px] font-semibold text-[var(--plotty-muted)]"
      }
    >
      {children}
    </span>
  );
}

function StatHeartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 13.3 2.9 8.6a3.2 3.2 0 0 1 4.5-4.5L8 4.7l.6-.6a3.2 3.2 0 1 1 4.5 4.5L8 13.3Z" stroke="currentColor" strokeWidth="1.35" />
    </svg>
  );
}

function StatCommentIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 3.5h10v6H7l-3.2 2.7V3.5Z" stroke="currentColor" strokeWidth="1.35" strokeLinejoin="round" />
    </svg>
  );
}

function StatBookmarkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4.2 2.3h7.6v11.4L8 10.8l-3.8 2.9V2.3Z" stroke="currentColor" strokeWidth="1.35" strokeLinejoin="round" />
    </svg>
  );
}

function formatCount(value?: number) {
  return (value ?? 0).toLocaleString("ru-RU");
}

function getChapterLabel(count: number) {
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

function getInitialSection(value: string | null): StorySection {
  if (value === "chapters" || value === "comments") {
    return value;
  }

  return "description";
}
