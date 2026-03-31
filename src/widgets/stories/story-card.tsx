"use client";

import Link from "next/link";

import type { StoryListItem } from "@/entities/story/model/types";
import * as generatedImageCache from "@/entities/story/model/generated-image-cache";
import { getStoryTextOverride } from "@/entities/story/model/story-text-cache";
import { routes } from "@/shared/config/routes";
import { Chip } from "@/shared/ui/chip";
import { buttonClassName } from "@/shared/ui/button";

import { StoryCoverPreview } from "./story-cover-preview";

export function StoryCard({ story }: { story: StoryListItem }) {
  const displayCoverImage =
    story.coverImageUrl ??
    getStoryCoverFromCache(story.slug) ??
    (story.firstChapterId ? generatedImageCache.getGeneratedImageUrl(story.firstChapterId) : undefined);
  const textOverride = getStoryTextOverride(story.id);
  const catalogTeaser = textOverride?.excerpt ?? story.excerpt ?? story.description;

  return (
    <Link
      href={routes.story(story.slug)}
      className="block overflow-hidden rounded-[24px] border border-[rgba(35,33,30,0.08)] bg-[rgba(255,255,255,0.84)] shadow-none transition-[transform,box-shadow,border-color] duration-150 ease-out hover:-translate-y-[1px] hover:border-[rgba(35,33,30,0.12)] hover:shadow-[var(--plotty-shadow-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plotty-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--plotty-paper)]"
    >
      <div className="grid gap-0 md:grid-cols-[220px_minmax(0,1fr)]">
        <StoryCoverPreview
          title={story.title}
          imageUrl={displayCoverImage}
          compact
          className="rounded-none border-0 border-b border-[rgba(35,33,30,0.08)] md:border-b-0 md:border-r"
          imageClassName="aspect-[4/5] md:aspect-[5/4]"
        />

        <div className="flex min-h-full flex-col gap-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <h2 className="plotty-card-title text-[20px] sm:text-[22px]">{story.title}</h2>
              <div className="flex flex-wrap gap-x-[10px] gap-y-1 text-[13px] text-[var(--plotty-muted)]">
                {story.fandom ? <span>{story.fandom}</span> : null}
                {story.ratingLabel ? <span>{story.ratingLabel}</span> : null}
                {story.statusLabel ? <span>{story.statusLabel}</span> : null}
              </div>
            </div>

            <span className="rounded-[14px] bg-[rgba(54,81,63,0.08)] px-[12px] py-[8px] text-[13px] font-semibold text-[var(--plotty-olive)]">
              {story.chaptersCount} глав
            </span>
          </div>

          {catalogTeaser ? (
            <p
              className="plotty-body text-[14px] leading-6 text-[var(--plotty-muted)]"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {catalogTeaser}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {story.tags.slice(0, 5).map((tag) => (
              <CatalogMetaChip key={tag.id}>{tag.name}</CatalogMetaChip>
            ))}
          </div>

          <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-1">
            <div className="flex flex-wrap gap-[10px]">
              <CatalogMiniStat>Создана {new Date(story.createdAt).toLocaleDateString("ru-RU")}</CatalogMiniStat>
              <CatalogMiniStat>Обновлена {new Date(story.updatedAt).toLocaleDateString("ru-RU")}</CatalogMiniStat>
            </div>

            <span className={buttonClassName("primary", "min-h-10 shrink-0 px-[14px] text-[13px]")}>
              Открыть историю
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function getStoryCoverFromCache(storySlug: string) {
  return typeof generatedImageCache.getGeneratedStoryCoverUrl === "function"
    ? generatedImageCache.getGeneratedStoryCoverUrl(storySlug)
    : undefined;
}

function CatalogMetaChip({ children }: { children: React.ReactNode }) {
  return <Chip className="bg-[var(--plotty-panel)] text-[var(--plotty-ink)]">{children}</Chip>;
}

function CatalogMiniStat({ children }: { children: React.ReactNode }) {
  return <span className="rounded-[12px] bg-[var(--plotty-paper)] px-[11px] py-[8px] text-[13px] font-semibold">{children}</span>;
}
