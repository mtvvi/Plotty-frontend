"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { storyDetailsQueryOptions } from "@/entities/story/api/stories-api";
import * as generatedImageCache from "@/entities/story/model/generated-image-cache";
import { getStoryTextOverride } from "@/entities/story/model/story-text-cache";
import { routes } from "@/shared/config/routes";
import { Button, ButtonLink } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import {
  PlottyAppMenu,
  PlottyPageShell,
  PlottySectionCard,
} from "@/widgets/layout/plotty-page-shell";

import { StoryCoverPreview } from "./story-cover-preview";
import { StoryTagChip } from "./story-tag-chip";

export function StoryDetailsScreen({ slug }: { slug: string }) {
  const storyQuery = useQuery(storyDetailsQueryOptions(slug));
  const [activeSection, setActiveSection] = useState<"description" | "chapters">("description");
  const storySlug = storyQuery.data?.slug ?? "";
  const hasExplicitCover = Boolean(storyQuery.data?.coverImageUrl);
  const firstChapter = storyQuery.data?.chapters[0] ?? null;
  const displayCoverImage =
    storyQuery.data?.coverImageUrl ??
    (storySlug ? getStoryCoverFromCache(storySlug) : undefined) ??
    (firstChapter ? generatedImageCache.getGeneratedImageUrl(firstChapter.id) : undefined);

  useEffect(() => {
    if (storySlug && !hasExplicitCover && displayCoverImage) {
      setStoryCoverInCache(storySlug, displayCoverImage);
    }
  }, [displayCoverImage, hasExplicitCover, storySlug]);

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

  const textOverride = getStoryTextOverride(storyQuery.data.id);
  const storyDescription =
    textOverride?.description ??
    storyQuery.data.description ??
    storyQuery.data.excerpt ??
    "Описание истории пока не заполнено.";

  return (
    <PlottyPageShell suppressPageIntro menuContent={({ closeMenu }) => <PlottyAppMenu onNavigate={closeMenu} />}>
      <div className="space-y-4 lg:space-y-5">
        <PlottySectionCard className="overflow-hidden p-0">
          <div className="grid gap-0 lg:grid-cols-[320px_minmax(0,1fr)]">
            <StoryCoverPreview
              title={storyQuery.data.title}
              imageUrl={displayCoverImage}
              className="rounded-none border-0 border-b border-[rgba(35,33,30,0.08)] lg:border-b-0 lg:border-r"
              imageClassName="aspect-[4/5] lg:aspect-[4/5]"
            />

            <div className="space-y-4 p-5 lg:p-6">
              <div className="space-y-1.5">
                <div className="plotty-meta text-xs font-bold uppercase tracking-[0.12em]">История</div>
                <h1 className="plotty-page-title text-[2.35rem] leading-[0.95] sm:text-[3.1rem]">
                  {storyQuery.data.title}
                </h1>
                <p className="plotty-meta">
                  Обновлена {new Date(storyQuery.data.updatedAt).toLocaleString("ru-RU")}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {firstChapter ? (
                  <ButtonLink href={routes.chapter(storyQuery.data.slug, firstChapter.number ?? 1)} variant="primary">
                    Читать
                  </ButtonLink>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                {storyQuery.data.tags.map((tag) => (
                  <StoryTagChip key={tag.id} tag={tag} />
                ))}
              </div>
            </div>
          </div>
        </PlottySectionCard>

        <div className="flex flex-wrap gap-2.5">
          <Button
            type="button"
            variant={activeSection === "description" ? "primary" : "secondary"}
            onClick={() => setActiveSection("description")}
          >
            Описание
          </Button>
          <Button
            type="button"
            variant={activeSection === "chapters" ? "primary" : "secondary"}
            onClick={() => setActiveSection("chapters")}
          >
            Главы
          </Button>
        </div>

        <PlottySectionCard id="story-content">
          {activeSection === "description" ? (
            <div className="space-y-3">
              <p className="plotty-body max-w-4xl text-[16px] leading-8 text-[var(--plotty-ink)] lg:text-[17px]">
                {storyDescription}
              </p>
            </div>
          ) : storyQuery.data.chapters.length ? (
            <div className="space-y-3">
              {storyQuery.data.chapters.map((chapter) => (
                <div
                  key={chapter.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-[18px] border border-[var(--plotty-line)] bg-white/76 px-4 py-3.5"
                >
                  <div className="space-y-1">
                    <div className="plotty-card-title text-[1.125rem] leading-7">
                      Глава {chapter.number}. {chapter.title}
                    </div>
                    <div className="plotty-meta text-sm">
                      Обновлена {new Date(chapter.updatedAt).toLocaleString("ru-RU")}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <ButtonLink href={routes.chapter(storyQuery.data.slug, chapter.number ?? 1)} variant="primary">
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
          )}
        </PlottySectionCard>
      </div>
    </PlottyPageShell>
  );
}

function getStoryCoverFromCache(storySlug: string) {
  return typeof generatedImageCache.getGeneratedStoryCoverUrl === "function"
    ? generatedImageCache.getGeneratedStoryCoverUrl(storySlug)
    : undefined;
}

function setStoryCoverInCache(storySlug: string, imageUrl: string) {
  if (typeof generatedImageCache.setGeneratedStoryCoverUrl === "function") {
    generatedImageCache.setGeneratedStoryCoverUrl(storySlug, imageUrl);
  }
}
