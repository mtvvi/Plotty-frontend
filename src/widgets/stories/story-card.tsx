"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  chapterDetailsQueryOptions,
  storyDetailsQueryOptions,
} from "@/entities/story/api/stories-api";
import { useStoryLikeMutation } from "@/entities/story/api/story-like-hooks";
import type { StoryListItem } from "@/entities/story/model/types";
import { isAuthError } from "@/shared/api/fetch-json";
import { routes } from "@/shared/config/routes";
import { getStoryTagCategoryLabel } from "@/shared/config/story-tags";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";

import { StoryCoverPreview } from "./story-cover-preview";
import { StoryCollectionControl } from "./story-collection-control";
import { StoryShelfControl } from "./story-shelf-control";

export function StoryCard({
  story,
  storyHref,
  showShelfControl = true,
}: {
  story: StoryListItem;
  storyHref?: string;
  showShelfControl?: boolean;
}) {
  const router = useRouter();
  const resolvedStoryHref = storyHref ?? routes.story(story.slug);
  const chaptersHref = `${routes.story(story.slug)}?tab=chapters`;
  const storyDetailsQuery = useQuery({
    ...storyDetailsQueryOptions(story.slug),
    enabled: Boolean(story.slug),
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
  const viewerHasLiked = Boolean(storyDetailsQuery.data?.viewerHasLiked ?? story.viewerHasLiked);
  const likesCount = storyDetailsQuery.data?.likesCount ?? story.likesCount;
  const likeMutation = useStoryLikeMutation({
    storyId: story.id,
    likesCount,
    viewerHasLiked,
  });
  const updatedLabel = `Обновлена ${new Date(story.updatedAt).toLocaleDateString("ru-RU")}`;
  const genres = useMemo(() => story.tags.filter((tag) => tag.category === "genre"), [story.tags]);
  const warnings = useMemo(() => story.tags.filter((tag) => tag.category === "warning"), [story.tags]);
  const extraTags = useMemo(
    () =>
      story.tags.filter((tag) => !["genre", "warning", "completion", "rating", "size", "directionality"].includes(tag.category ?? "")),
    [story.tags],
  );

  async function handleToggleLike() {
    try {
      await likeMutation.toggleLike();
    } catch (error) {
      if (isAuthError(error)) {
        router.push(routes.auth({ next: routes.story(story.slug) }));
      }
    }
  }

  return (
    <article className="plotty-story-card overflow-hidden rounded-[26px] border border-[rgba(35,33,30,0.08)] bg-[rgba(255,255,255,0.86)] shadow-[var(--plotty-shadow-card)]">
      <div className="grid md:grid-cols-[minmax(20rem,42%)_minmax(0,1fr)] xl:grid-cols-[minmax(24rem,42%)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col border-b border-[rgba(35,33,30,0.08)] md:border-b-0 md:border-r">
          <Link
            href={resolvedStoryHref}
            aria-label={`Открыть историю ${story.title}`}
            className="relative block aspect-square overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plotty-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--plotty-paper)]"
          >
            <StoryCoverPreview
              title={story.title}
              imageUrl={displayCoverImage}
              compact
              className="h-full rounded-none border-0"
              imageClassName="h-full"
              fullHeight
            />
            <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
              {story.statusLabel ? (
                <span className="rounded-full bg-[rgba(247,242,234,0.94)] px-3 py-1.5 text-xs font-bold text-[var(--plotty-accent)] shadow-[0_8px_24px_rgba(46,35,23,0.14)] backdrop-blur-xl">
                  {story.statusLabel}
                </span>
              ) : null}
              {story.sizeLabel ? (
                <span className="rounded-full bg-[rgba(247,242,234,0.9)] px-3 py-1.5 text-xs font-bold text-[var(--plotty-ink)] shadow-[0_8px_24px_rgba(46,35,23,0.1)] backdrop-blur-xl">
                  {story.sizeLabel}
                </span>
              ) : null}
            </div>
          </Link>

          <aside
            aria-label="Действия карточки"
            className="grid gap-3 bg-[rgba(240,232,219,0.38)] p-4 sm:p-5"
          >
            {showShelfControl ? (
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
                <StoryShelfControl storyId={story.id} className="max-w-none" />
                <StoryCollectionControl storyId={story.id} className="max-w-none" />
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => void handleToggleLike()}
                disabled={likeMutation.isPending}
                variant={viewerHasLiked ? "primary" : "secondary"}
                size="sm"
                className="plotty-stat min-w-[4.25rem] flex-1 justify-center gap-2 sm:flex-none"
                aria-pressed={viewerHasLiked}
                aria-label={viewerHasLiked ? "Убрать лайк" : "Поставить лайк"}
              >
                <StatHeartIcon filled={viewerHasLiked} />
                <span>{formatCount(likesCount)}</span>
              </Button>
              <Link href={chaptersHref} className="plotty-stat min-w-[4.25rem] flex-1 justify-center sm:flex-none" aria-label="Главы">
                <StatChapterIcon />
                <span>{story.chaptersCount}</span>
              </Link>
            </div>
          </aside>
        </div>

        <div className="flex min-w-0 flex-col">
          <div className="min-w-0 flex-1 space-y-4 p-4 sm:p-5 lg:p-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="plotty-story-eyebrow-kind">История</span>
                <span className="size-1 rounded-full bg-[var(--plotty-muted-soft)]" aria-hidden="true" />
                <span className="plotty-story-eyebrow-date">{updatedLabel}</span>
              </div>
              <Link href={resolvedStoryHref} className="plotty-story-title-anchor">
                <h2 className="plotty-story-title">
                  <span className="plotty-story-title-text">{story.title}</span>
                </h2>
              </Link>
              <div className="flex flex-wrap gap-x-2.5 gap-y-1 text-[13px] text-[var(--plotty-muted)]">
                {story.author?.username ? (
                  <Link href={routes.user(story.author.username)} className="font-semibold text-[var(--plotty-accent)] hover:underline">
                    Автор {story.author.username}
                  </Link>
                ) : null}
                <span>
                  {story.chaptersCount} {getChapterLabel(story.chaptersCount)}
                </span>
                {story.createdAt ? <span>{`С ${new Date(story.createdAt).toLocaleDateString("ru-RU")}`}</span> : null}
              </div>
            </div>

            {story.aiHint ? (
              <p
                className="plotty-body text-[14px] leading-6 text-[var(--plotty-muted)] sm:text-[15px]"
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

            <CatalogStoryTags
              fandom={story.fandom}
              rating={story.ratingLabel}
              status={story.statusLabel}
              size={story.sizeLabel}
              genres={genres}
              warnings={warnings}
              extraTags={extraTags}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

function CatalogStoryTags({
  fandom,
  rating,
  status,
  size,
  genres,
  warnings,
  extraTags,
}: {
  fandom?: string;
  rating?: string;
  status?: string;
  size?: string;
  genres: Array<{ id: string; name: string }>;
  warnings: Array<{ id: string; name: string }>;
  extraTags: Array<{ id: string; name: string }>;
}) {
  const primaryGroups = [
    ["directionality", fandom],
    ["rating", rating],
    ["completion", status],
    ["size", size],
  ].filter(([, value]) => Boolean(value)) as Array<[string, string]>;

  if (!primaryGroups.length && !genres.length && !warnings.length && !extraTags.length) {
    return null;
  }

  return (
    <div className="space-y-3">
      {primaryGroups.length ? (
        <div className="grid grid-cols-2 gap-3">
          {primaryGroups.map(([category, value]) => (
            <MetaGroup key={category} label={getStoryTagCategoryLabel(category)}>
              <CatalogMetaChip>{value}</CatalogMetaChip>
            </MetaGroup>
          ))}
        </div>
      ) : null}

      {genres.length ? (
        <MetaGroup label={getStoryTagCategoryLabel("genre")}>
          {genres.map((tag) => (
            <CatalogMetaChip key={tag.id}>{tag.name}</CatalogMetaChip>
          ))}
        </MetaGroup>
      ) : null}
      {warnings.length ? (
        <MetaGroup label={getStoryTagCategoryLabel("warning")}>
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
    <Badge className="min-h-[34px] justify-center border border-[rgba(41,38,34,0.09)] px-3.5 py-2 text-sm leading-none text-[var(--plotty-ink)]">
      {children}
    </Badge>
  );
}

function StatHeartIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill={filled ? "currentColor" : "none"} aria-hidden="true">
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
