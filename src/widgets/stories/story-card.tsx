"use client";

import { memo, useMemo } from "react";
import { BookOpen, Heart, List } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/entities/auth/model/auth-context";
import { useStoryLikeMutation } from "@/entities/story/api/story-like-hooks";
import type { StoryListItem, StoryTag } from "@/entities/story/model/types";
import type { ReaderShelf } from "@/entities/library/model/types";
import { isAuthError } from "@/shared/api/fetch-json";
import { routes } from "@/shared/config/routes";
import { Button, ButtonLink } from "@/shared/ui/button";
import { Chip } from "@/shared/ui/chip";
import { StoryRevealButtonLink } from "@/shared/ui/story-reveal-transition";

import { StoryCoverPreview, storyCoverPlaceholderSrc } from "./story-cover-preview";
import { StoryCollectionControl } from "./story-collection-control";
import { getStoryTagTone, StoryTagLinkChip } from "./story-tag-link";
import { StoryShelfControl } from "./story-shelf-control";

export const StoryCard = memo(function StoryCard({
  story,
  storyHref,
  showShelfControl = true,
  showChapterActions = true,
  priorityCover = false,
  initialShelf = null,
  initialCollectionIds = [],
}: {
  story: StoryListItem;
  storyHref?: string;
  showShelfControl?: boolean;
  showChapterActions?: boolean;
  priorityCover?: boolean;
  initialShelf?: ReaderShelf | "" | null;
  initialCollectionIds?: readonly string[];
}) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const resolvedStoryHref = storyHref ?? routes.story(story.slug);
  const hasDirectReadChapterNumber = Object.prototype.hasOwnProperty.call(story, "readChapterNumber");
  const directReadChapterNumber = getPositiveChapterNumber(story.readChapterNumber);
  const displayCoverImage = story.coverImageUrl ?? undefined;
  const revealCoverImage = displayCoverImage ?? storyCoverPlaceholderSrc;
  const chaptersHref = `${routes.story(story.slug)}?tab=chapters`;
  const readHref = hasDirectReadChapterNumber
    ? directReadChapterNumber
      ? routes.chapter(story.slug, directReadChapterNumber)
      : resolvedStoryHref
    : story.chaptersCount > 0
      ? routes.chapter(story.slug, 1)
      : resolvedStoryHref;
  const viewerHasLiked = Boolean(story.viewerHasLiked);
  const likesCount = story.likesCount;
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
    <article className="plotty-story-card overflow-hidden rounded-[var(--plotty-radius-lg)] border border-[var(--plotty-line)] bg-[rgba(255,253,249,0.86)]">
      <div className="grid min-w-0 md:min-h-[15rem] md:grid-cols-[minmax(16rem,19rem)_minmax(0,1fr)_minmax(10rem,12rem)] xl:grid-cols-[20rem_minmax(0,1fr)_minmax(11rem,13rem)]">
        <Link
          href={resolvedStoryHref}
          prefetch={false}
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
            priority={priorityCover}
            sizes="(min-width: 1280px) 20rem, (min-width: 768px) 19rem, 100vw"
          />
        </Link>

        <div className="relative min-w-0 space-y-3 p-4 md:space-y-3.5 md:p-5">
          <Link
            href={resolvedStoryHref}
            prefetch={false}
            aria-label={`Перейти на страницу истории ${story.title}`}
            className="plotty-story-card-body-link"
          />

          <div className="pointer-events-none relative z-20 space-y-1.5 md:space-y-2">
            <div className="plotty-story-title-anchor">
              <h2 className="plotty-card-title text-[1.28rem] leading-[1.08] md:text-[1.75rem] md:leading-none lg:text-[2rem]">
                <span className="plotty-story-title-text">{story.title}</span>
              </h2>
            </div>
            <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-xs leading-5 text-[var(--plotty-muted)] md:gap-x-2.5 md:gap-y-1 md:text-sm">
              {story.author?.username ? (
                <Link
                  href={routes.user(story.author.username)}
                  prefetch={false}
                  className="pointer-events-auto relative z-30 font-semibold transition-colors hover:text-[var(--plotty-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plotty-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--plotty-paper)]"
                >
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
              className="pointer-events-none relative z-20 plotty-body text-[13px] leading-5 text-[var(--plotty-ink-soft)] md:text-[14px] md:leading-6 lg:text-[15px]"
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

          <div className="pointer-events-none relative z-20">
            <CatalogStoryTags
              fandom={story.fandom}
              rating={story.ratingLabel}
              status={story.statusLabel}
              size={story.sizeLabel}
              tags={story.tags}
              genres={genres}
              warnings={warnings}
              extraTags={extraTags}
            />
          </div>
        </div>

        <aside
          aria-label="Действия карточки"
          className="plotty-action-zone pointer-events-auto relative z-20 grid min-w-0 content-start gap-3 overflow-hidden border-t border-[var(--plotty-line)] bg-[rgba(245,238,229,0.48)] p-4 md:border-l md:border-t-0 lg:p-5"
        >
          <div className={showChapterActions ? "grid grid-cols-2 gap-2 md:grid-cols-1" : "grid gap-2"}>
            <StoryRevealButtonLink
              href={readHref}
              variant="primary"
              className="min-w-0 w-full"
              revealTitle={story.title}
              revealCoverUrl={revealCoverImage}
              prefetch={false}
            >
              <BookOpen className="size-4" aria-hidden="true" />
              Читать
            </StoryRevealButtonLink>
            {showChapterActions ? (
              <ButtonLink href={chaptersHref} prefetch={false} variant="secondary" className="min-w-0 w-full">
                <List className="size-4" aria-hidden="true" />
                Главы
              </ButtonLink>
            ) : null}
          </div>
          <div className={showChapterActions ? "grid grid-cols-2 gap-2" : "grid gap-2"}>
            <Button
              type="button"
              onClick={() => void handleToggleLike()}
              disabled={likeMutation.isPending}
              variant={viewerHasLiked ? "primary" : "secondary"}
              size="sm"
              className="plotty-like-pop w-full"
              aria-pressed={viewerHasLiked}
              aria-label={viewerHasLiked ? "Убрать лайк" : "Поставить лайк"}
            >
              <Heart className="size-4" fill={viewerHasLiked ? "currentColor" : "none"} aria-hidden="true" />
              {formatCount(likesCount)}
            </Button>
            {showChapterActions ? (
              <Link href={chaptersHref} prefetch={false} className="plotty-stat justify-center" aria-label="Количество глав">
                <List className="size-4" aria-hidden="true" />
                {story.chaptersCount}
              </Link>
            ) : null}
          </div>
          {showShelfControl && isAuthenticated ? (
            <div className="grid gap-2 border-t border-[var(--plotty-line)] pt-3 sm:grid-cols-2 md:grid-cols-1">
              <StoryShelfControl storyId={story.id} initialShelf={initialShelf} className="max-w-none min-w-0" compact />
              <StoryCollectionControl
                storyId={story.id}
                initialCollectionIds={initialCollectionIds}
                className="max-w-none min-w-0"
                compact
              />
            </div>
          ) : null}
        </aside>
      </div>
    </article>
  );
});

const CatalogStoryTags = memo(function CatalogStoryTags({
  fandom,
  rating,
  status,
  size,
  tags,
  genres,
  warnings,
  extraTags,
}: {
  fandom?: string;
  rating?: string;
  status?: string;
  size?: string;
  tags: StoryTag[];
  genres: StoryTag[];
  warnings: StoryTag[];
  extraTags: StoryTag[];
}) {
  const linkedTags = sortDisplayTags(tags).slice(0, 8);

  if (linkedTags.length) {
    return (
      <div className="flex flex-wrap gap-2">
        {linkedTags.map((tag) => (
          <StoryTagLinkChip key={tag.id} tag={tag} />
        ))}
      </div>
    );
  }

  const chips = [
    fandom ? { id: "fandom", label: fandom, tone: "gold" as const } : null,
    rating ? { id: "rating", label: rating, tone: "default" as const } : null,
    status ? { id: "status", label: status, tone: "olive" as const } : null,
    size ? { id: "size", label: size, tone: "default" as const } : null,
    ...genres.map((tag) => ({ id: tag.id, label: tag.name, tone: getStoryTagTone(tag) })),
    ...warnings.map((tag) => ({ id: tag.id, label: tag.name, tone: getStoryTagTone(tag) })),
    ...extraTags.map((tag) => ({ id: tag.id, label: tag.name, tone: getStoryTagTone(tag) })),
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
});

function sortDisplayTags(tags: StoryTag[]) {
  const order = ["directionality", "rating", "completion", "size", "genre", "warning"];

  return [...tags].sort((left, right) => {
    const leftIndex = order.indexOf(left.category ?? "other");
    const rightIndex = order.indexOf(right.category ?? "other");

    return (leftIndex === -1 ? order.length : leftIndex) - (rightIndex === -1 ? order.length : rightIndex);
  });
}

function formatCount(value?: number) {
  return (value ?? 0).toLocaleString("ru-RU");
}

function getPositiveChapterNumber(value?: number | null) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
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
