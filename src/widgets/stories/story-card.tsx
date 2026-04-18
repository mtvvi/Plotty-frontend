"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  chapterDetailsQueryOptions,
  likeStory,
  patchStorySummaryCaches,
  storyDetailsQueryOptions,
  unlikeStory,
} from "@/entities/story/api/stories-api";
import type { StoryListItem } from "@/entities/story/model/types";
import { isAuthError } from "@/shared/api/fetch-json";
import { routes } from "@/shared/config/routes";

import { StoryCoverPreview } from "./story-cover-preview";

export function StoryCard({ story }: { story: StoryListItem }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const storyHref = routes.story(story.slug);
  const chaptersHref = `${storyHref}?tab=chapters`;
  const storyDetailsQuery = useQuery({
    ...storyDetailsQueryOptions(story.slug),
    enabled: story.chaptersCount > 0,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
  const firstChapterId = storyDetailsQuery.data?.chapters[0]?.id ?? "";
  const firstChapterQuery = useQuery({
    ...chapterDetailsQueryOptions(firstChapterId),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
  const displayCoverImage = firstChapterQuery.data?.imageUrl;
  const likeMutation = useMutation({
    mutationFn: ({ liked }: { liked: boolean }) => (liked ? unlikeStory(story.id) : likeStory(story.id)),
  });
  const viewerHasLiked = Boolean(story.viewerHasLiked);
  const updatedLabel = `Обновлена ${new Date(story.updatedAt).toLocaleDateString("ru-RU")}`;
  const genres = useMemo(() => story.tags.filter((tag) => tag.category === "genre"), [story.tags]);
  const warnings = useMemo(() => story.tags.filter((tag) => tag.category === "warning"), [story.tags]);
  const extraTags = useMemo(
    () =>
      story.tags.filter((tag) => !["genre", "warning", "completion", "rating", "size", "directionality"].includes(tag.category ?? "")),
    [story.tags],
  );

  async function handleToggleLike() {
    const nextLiked = !viewerHasLiked;
    const previousLikesCount = story.likesCount ?? 0;

    patchStorySummaryCaches(queryClient, story.id, {
      likesCount: Math.max(previousLikesCount + (nextLiked ? 1 : -1), 0),
      viewerHasLiked: nextLiked,
    });

    try {
      const result = await likeMutation.mutateAsync({ liked: viewerHasLiked });

      patchStorySummaryCaches(queryClient, story.id, {
        likesCount: result.likesCount,
        viewerHasLiked: result.viewerHasLiked,
      });
    } catch (error) {
      patchStorySummaryCaches(queryClient, story.id, {
        likesCount: previousLikesCount,
        viewerHasLiked,
      });

      if (isAuthError(error)) {
        router.push(routes.auth({ next: storyHref }));
      }
    }
  }

  return (
    <article className="overflow-hidden rounded-[26px] border border-[rgba(35,33,30,0.08)] bg-[rgba(255,255,255,0.84)] shadow-[var(--plotty-shadow-card)]">
      <div className="grid items-stretch md:grid-cols-[minmax(0,1fr)_112px]">
        <Link
          href={storyHref}
          aria-label={`Открыть историю ${story.title}`}
          className="grid transition-[box-shadow,transform] duration-150 hover:-translate-y-[1px] hover:shadow-[0_22px_44px_rgba(46,35,23,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plotty-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--plotty-paper)] md:grid-cols-[320px_minmax(0,1fr)]"
        >
          <div className="h-full border-b border-[rgba(35,33,30,0.08)] md:border-b-0 md:border-r">
            <StoryCoverPreview
              title={story.title}
              imageUrl={displayCoverImage}
              compact
              className="h-full rounded-none border-0"
              imageClassName="h-full"
              fullHeight
            />
          </div>

          <div className="min-w-0 space-y-4 p-4 sm:p-5 lg:p-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {story.statusLabel ? <CatalogStatusPill>{story.statusLabel}</CatalogStatusPill> : null}
                {story.ratingLabel ? <CatalogMetaChip>{story.ratingLabel}</CatalogMetaChip> : null}
                {story.sizeLabel ? <CatalogMetaChip>{story.sizeLabel}</CatalogMetaChip> : null}
                {story.fandom ? <CatalogMetaChip>{story.fandom}</CatalogMetaChip> : null}
              </div>

              <div className="space-y-2">
                <h2 className="plotty-card-title text-[1.35rem] sm:text-[1.55rem]">{story.title}</h2>
                <div className="flex flex-wrap gap-x-2.5 gap-y-1 text-[13px] text-[var(--plotty-muted)]">
                  {story.author?.username ? <span>Автор {story.author.username}</span> : null}
                  <span>
                    {story.chaptersCount} {getChapterLabel(story.chaptersCount)}
                  </span>
                </div>
              </div>

              {story.aiHint ? (
                <p
                  className="plotty-body text-[14px] leading-6 text-[var(--plotty-muted)]"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {story.aiHint}
                </p>
              ) : null}

              <div className="space-y-3">
                {genres.length ? (
                  <MetaGroup label="Жанры">
                    {genres.map((tag) => (
                      <CatalogMetaChip key={tag.id}>{tag.name}</CatalogMetaChip>
                    ))}
                  </MetaGroup>
                ) : null}
                {warnings.length ? (
                  <MetaGroup label="Предупреждения">
                    {warnings.map((tag) => (
                      <CatalogMetaChip key={tag.id}>{tag.name}</CatalogMetaChip>
                    ))}
                  </MetaGroup>
                ) : null}
                {extraTags.length ? (
                  <MetaGroup label="Дополнительно">
                    {extraTags.map((tag) => (
                      <CatalogMetaChip key={tag.id}>{tag.name}</CatalogMetaChip>
                    ))}
                  </MetaGroup>
                ) : null}
              </div>
            </div>
          </div>
        </Link>

        <aside
          aria-label="Действия карточки"
          className="flex min-w-0 flex-row items-center justify-between gap-3 border-t border-[rgba(35,33,30,0.08)] p-4 md:flex-col md:items-end md:justify-start md:border-t-0 md:border-l md:px-5 md:py-6"
        >
          <div className="space-y-2 text-right">
            <span className="inline-flex rounded-full bg-[rgba(54,81,63,0.08)] px-3 py-2 text-[12px] font-semibold text-[var(--plotty-olive)]">
              {updatedLabel}
            </span>
            {story.createdAt ? <div className="plotty-meta">{`С ${new Date(story.createdAt).toLocaleDateString("ru-RU")}`}</div> : null}
          </div>

          <div className="flex flex-row gap-2 md:flex-col md:items-end">
            <button
              type="button"
              onClick={() => void handleToggleLike()}
              disabled={likeMutation.isPending}
              className={`plotty-stat min-w-[4.25rem] justify-center ${viewerHasLiked ? "bg-[var(--plotty-accent-soft)] text-[var(--plotty-accent)]" : ""}`}
              aria-pressed={viewerHasLiked}
              aria-label={viewerHasLiked ? "Убрать лайк" : "Поставить лайк"}
            >
              <StatHeartIcon />
              <span>{formatCount(story.likesCount)}</span>
            </button>
            <Link href={chaptersHref} className="plotty-stat min-w-[4.25rem] justify-center" aria-label="Главы">
              <StatChapterIcon />
              <span>{story.chaptersCount}</span>
            </Link>
          </div>
        </aside>
      </div>
    </article>
  );
}

function MetaGroup({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="space-y-1.5">
      <div className="plotty-kicker">{label}</div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function CatalogMetaChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex min-h-[34px] items-center justify-center rounded-full border border-[rgba(41,38,34,0.09)] bg-[var(--plotty-panel)] px-3.5 py-2 text-sm font-semibold leading-none text-[var(--plotty-ink)]">
      {children}
    </span>
  );
}

function CatalogStatusPill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-[rgba(188,95,61,0.08)] px-3 py-2 text-[12px] font-semibold text-[var(--plotty-accent)]">
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

function StatChapterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 2.8h7.5a.7.7 0 0 1 .7.7v8.9a.7.7 0 0 1-.7.7H4.9a1.4 1.4 0 0 0-.9.3l-.7.6V3.5a.7.7 0 0 1 .7-.7Z" stroke="currentColor" strokeWidth="1.35" strokeLinejoin="round" />
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
