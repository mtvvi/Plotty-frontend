"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Heart, List, MessageCircle } from "lucide-react";
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
import { Button, ButtonLink } from "@/shared/ui/button";
import { Chip } from "@/shared/ui/chip";

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
  const storyDetailsQuery = useQuery({
    ...storyDetailsQueryOptions(story.slug),
    enabled: Boolean(story.slug),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
  const firstChapter = storyDetailsQuery.data?.chapters[0];
  const firstChapterQuery = useQuery({
    ...chapterDetailsQueryOptions(firstChapter?.id ?? ""),
    enabled: Boolean(firstChapter?.id && !story.coverImageUrl),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
  const displayCoverImage = story.coverImageUrl ?? firstChapterQuery.data?.imageUrl;
  const chaptersHref = `${routes.story(story.slug)}?tab=chapters`;
  const readHref = firstChapter ? routes.chapter(story.slug, firstChapter.number ?? 1) : resolvedStoryHref;
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
    <article className="plotty-story-card overflow-hidden rounded-[var(--plotty-radius-lg)] border border-[var(--plotty-line)] bg-[rgba(255,253,249,0.86)] shadow-[var(--plotty-shadow-card)]">
      <div className="grid min-w-0 md:min-h-[15rem] md:grid-cols-[minmax(16rem,19rem)_minmax(0,1fr)_minmax(10rem,12rem)] xl:grid-cols-[20rem_minmax(0,1fr)_minmax(11rem,13rem)]">
        <Link
          href={resolvedStoryHref}
          aria-label={`Открыть историю ${story.title}`}
          className="relative block min-w-0 aspect-video overflow-hidden border-b border-[var(--plotty-line)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plotty-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--plotty-paper)] md:aspect-auto md:min-h-[13.5rem] md:border-b-0 md:border-r"
        >
          <StoryCoverPreview
            title={story.title}
            imageUrl={displayCoverImage}
            compact
            className="h-full rounded-none border-0"
            imageClassName="h-full min-h-[18rem] max-md:!min-h-0"
            fullHeight
          />
        </Link>

        <div className="min-w-0 space-y-3 p-4 md:space-y-4 md:p-5 lg:p-6">
          <div className="space-y-1.5 md:space-y-2">
            <Link href={resolvedStoryHref} className="plotty-story-title-anchor">
              <h2 className="plotty-card-title text-[1.28rem] leading-[1.05] md:text-[1.8rem] md:leading-none lg:text-[2.25rem]">
                <span className="plotty-story-title-text">{story.title}</span>
              </h2>
            </Link>
            <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-xs leading-5 text-[var(--plotty-muted)] md:gap-x-2.5 md:gap-y-1 md:text-sm">
              {story.author?.username ? (
                <Link href={routes.user(story.author.username)} className="font-semibold hover:text-[var(--plotty-accent)]">
                  Автор {story.author.username}
                </Link>
              ) : null}
              <span aria-hidden="true">•</span>
              <span>{updatedLabel}</span>
              <span aria-hidden="true">•</span>
              <span>
                {story.chaptersCount} {getChapterLabel(story.chaptersCount)}
              </span>
            </div>
          </div>

          {story.aiHint ? (
            <p
              className="plotty-body text-[13px] leading-5 text-[var(--plotty-ink-soft)] md:text-[14px] md:leading-6 lg:text-[15px]"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
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
          <div className="grid gap-2 pt-1 md:hidden">
            <div className="grid grid-cols-2 gap-2">
              <ButtonLink href={readHref} variant="primary" size="sm" className="w-full" aria-label="Читать историю">
                <BookOpen className="size-4" aria-hidden="true" />
                Читать
              </ButtonLink>
              <ButtonLink href={chaptersHref} variant="secondary" size="sm" className="w-full" aria-label="Открыть главы">
                <List className="size-4" aria-hidden="true" />
                Главы
              </ButtonLink>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                onClick={() => void handleToggleLike()}
                disabled={likeMutation.isPending}
                variant={viewerHasLiked ? "primary" : "secondary"}
                size="sm"
                className="w-full"
                aria-pressed={viewerHasLiked}
                aria-label={viewerHasLiked ? "Убрать лайк" : "Поставить лайк"}
              >
                <Heart className="size-4" fill={viewerHasLiked ? "currentColor" : "none"} aria-hidden="true" />
                {formatCount(likesCount)}
              </Button>
              <Link href={chaptersHref} className="plotty-stat justify-center" aria-label="Количество глав">
                <MessageCircle className="size-4" aria-hidden="true" />
                {story.chaptersCount}
              </Link>
            </div>
            {showShelfControl ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <StoryShelfControl storyId={story.id} className="max-w-none" compact />
                <StoryCollectionControl storyId={story.id} className="max-w-none" compact />
              </div>
            ) : null}
          </div>
        </div>

        <aside
          aria-label="Действия карточки"
          className="hidden min-w-0 content-start gap-3 overflow-hidden border-t border-[var(--plotty-line)] bg-[rgba(245,238,229,0.48)] p-4 md:grid md:border-l md:border-t-0 lg:p-5"
        >
          <ButtonLink href={readHref} variant="primary" className="min-w-0 w-full">
            <BookOpen className="size-4" aria-hidden="true" />
            Читать
          </ButtonLink>
          <ButtonLink href={chaptersHref} variant="secondary" className="min-w-0 w-full">
            <List className="size-4" aria-hidden="true" />
            Главы
          </ButtonLink>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              onClick={() => void handleToggleLike()}
              disabled={likeMutation.isPending}
              variant={viewerHasLiked ? "primary" : "secondary"}
              size="sm"
              aria-pressed={viewerHasLiked}
              aria-label={viewerHasLiked ? "Убрать лайк" : "Поставить лайк"}
            >
              <Heart className="size-4" fill={viewerHasLiked ? "currentColor" : "none"} aria-hidden="true" />
              {formatCount(likesCount)}
            </Button>
            <Link href={chaptersHref} className="plotty-stat justify-center" aria-label="Количество глав">
              <MessageCircle className="size-4" aria-hidden="true" />
              {story.chaptersCount}
            </Link>
          </div>
          {showShelfControl ? (
            <div className="hidden space-y-2 border-t border-[var(--plotty-line)] pt-3 md:block">
              <StoryShelfControl storyId={story.id} className="max-w-none min-w-0" compact />
              <StoryCollectionControl storyId={story.id} className="max-w-none min-w-0" compact />
            </div>
          ) : null}
        </aside>
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
  const chips = [
    fandom ? { id: "fandom", label: fandom, tone: "gold" as const } : null,
    rating ? { id: "rating", label: rating, tone: "default" as const } : null,
    status ? { id: "status", label: status, tone: "olive" as const } : null,
    size ? { id: "size", label: size, tone: "default" as const } : null,
    ...genres.map((tag) => ({ id: tag.id, label: tag.name, tone: "default" as const })),
    ...warnings.map((tag) => ({ id: tag.id, label: tag.name, tone: "gold" as const })),
    ...extraTags.map((tag) => ({ id: tag.id, label: tag.name, tone: "default" as const })),
  ].filter(Boolean) as Array<{ id: string; label: string; tone: "default" | "gold" | "olive" }>;

  if (!chips.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {chips.slice(0, 8).map((chip) => (
        <Chip key={chip.id} tone={chip.tone}>
          {chip.label}
        </Chip>
      ))}
    </div>
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
