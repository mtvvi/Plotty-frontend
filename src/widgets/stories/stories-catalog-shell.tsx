"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { storiesQueryOptions, storyTagsQueryOptions } from "@/entities/story/api/stories-api";
import { parseStoriesQuery, serializeStoriesQuery } from "@/entities/story/model/story-query";
import type { StoriesQuery, StoryTag } from "@/entities/story/model/types";
import { cn } from "@/shared/lib/utils";
import { getStoryTagCategoryLabel, groupStoryTags, storyTagCategoryOrder } from "@/shared/config/story-tags";
import { Button } from "@/shared/ui/button";
import { Chip } from "@/shared/ui/chip";
import { EmptyState } from "@/shared/ui/empty-state";
import { Input } from "@/shared/ui/input";
import { Select } from "@/shared/ui/select";
import {
  PlottyAppMenu,
  PlottyMobileSheet,
  PlottyPageShell,
  PlottySectionCard,
} from "@/widgets/layout/plotty-page-shell";

import { StoryCard } from "./story-card";
import { StoryTagChip } from "./story-tag-chip";

const multiSelectCategories = new Set(["rating", "completion", "size"]);
const singleSelectCategories = new Set(["directionality"]);
const searchDebounceMs = 300;

export function StoriesCatalogShell() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isRouting, startTransition] = useTransition();
  const searchParamsString = searchParams.toString();
  const appliedQuery = useMemo(() => parseStoriesQuery(new URLSearchParams(searchParamsString)), [searchParamsString]);
  const [searchDraft, setSearchDraft] = useState(appliedQuery.q);
  const [draftTags, setDraftTags] = useState(appliedQuery.tags);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [, setIsMobileMenuOpen] = useState(false);
  const lastRequestedSearchRef = useRef(appliedQuery.q);

  const navigateToQuery = useCallback(
    (nextQuery: StoriesQuery) => {
      const params = serializeStoriesQuery(nextQuery);
      const href = params.toString() ? `${pathname}?${params.toString()}` : pathname;

      startTransition(() => {
        router.replace(href, { scroll: false });
      });
    },
    [pathname, router],
  );

  useEffect(() => {
    if (appliedQuery.q !== lastRequestedSearchRef.current) {
      setSearchDraft(appliedQuery.q);
      lastRequestedSearchRef.current = appliedQuery.q;
    }
  }, [appliedQuery.q]);

  useEffect(() => {
    setDraftTags(appliedQuery.tags);
  }, [appliedQuery.tags]);

  const hasFilterDraftChanges = useMemo(
    () =>
      serializeStoriesQuery({ ...appliedQuery, tags: draftTags }).toString() !==
      serializeStoriesQuery(appliedQuery).toString(),
    [appliedQuery, draftTags],
  );
  const normalizedSearchDraft = searchDraft.trim();
  const isSearchDirty = normalizedSearchDraft !== appliedQuery.q;

  const storiesQuery = useQuery({
    ...storiesQueryOptions(appliedQuery),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
  const tagsQuery = useQuery(storyTagsQueryOptions());
  const stories = storiesQuery.data?.items ?? [];
  const groupedTags = useMemo(() => groupStoryTags(tagsQuery.data?.items ?? []), [tagsQuery.data?.items]);
  const orderedGroups = storyTagCategoryOrder
    .map((category) => [category, groupedTags[category] ?? []] as const)
    .filter(([, tags]) => tags.length);
  const totalStories = (storiesQuery.data?.pagination.total ?? 0).toLocaleString("ru-RU");
  const hasInitialLoading = storiesQuery.isLoading && !storiesQuery.data;
  const appliedActiveTags = (tagsQuery.data?.items ?? []).filter((tag) => appliedQuery.tags.includes(tag.slug));

  useEffect(() => {
    if (!isSearchDirty) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      lastRequestedSearchRef.current = normalizedSearchDraft;
      navigateToQuery({
        ...appliedQuery,
        q: normalizedSearchDraft,
        page: 1,
      });
    }, searchDebounceMs);

    return () => window.clearTimeout(timeoutId);
  }, [appliedQuery, isSearchDirty, navigateToQuery, normalizedSearchDraft]);

  function applyDraftTags() {
    if (!hasFilterDraftChanges) {
      return;
    }

    navigateToQuery({
      ...appliedQuery,
      tags: draftTags,
      page: 1,
    });
  }

  function clearDraftFilters() {
    setDraftTags([]);
  }

  function clearAllDraft() {
    setSearchDraft("");
    lastRequestedSearchRef.current = "";
    setDraftTags([]);
  }

  function clearAppliedFilters() {
    clearAllDraft();
    navigateToQuery({ ...appliedQuery, q: "", tags: [], page: 1 });
  }

  function setSingleSelectTag(currentTags: string[], tagSlug: string, categoryTags: StoryTag[]) {
    return replaceCategoryTags(currentTags, categoryTags, tagSlug ? [tagSlug] : []);
  }

  function toggleMultiSelectTag(currentTags: string[], tagSlug: string, categoryTags: StoryTag[]) {
    const selectedInCategory = getSelectedCategoryTags(currentTags, categoryTags);
    const nextSelected = selectedInCategory.includes(tagSlug)
      ? selectedInCategory.filter((slug) => slug !== tagSlug)
      : [...selectedInCategory, tagSlug];

    return replaceCategoryTags(currentTags, categoryTags, nextSelected);
  }

  function toggleGenericTag(currentTags: string[], tagSlug: string) {
    return currentTags.includes(tagSlug)
      ? currentTags.filter((tag) => tag !== tagSlug)
      : [...currentTags, tagSlug];
  }

  function applyMobileFilters() {
    setIsMobileFiltersOpen(false);
    applyDraftTags();
  }

  return (
    <PlottyPageShell
      suppressPageIntro
      onMenuOpenChange={setIsMobileMenuOpen}
      menuContent={({ closeMenu }) => <PlottyAppMenu onNavigate={closeMenu} />}
      desktopHeaderCenter={
        <div className="mx-auto w-full max-w-[34rem] xl:max-w-[38rem]">
          <CatalogSearchField value={searchDraft} onChange={setSearchDraft} />
        </div>
      }
      mobileHeaderCenter={
        <div className="ml-1 min-w-0">
          <CatalogSearchField value={searchDraft} onChange={setSearchDraft} compact />
        </div>
      }
      mobileToolbar={
        <div className="grid gap-2">
          <Button
            type="button"
            variant="secondary"
            aria-label="Открыть фильтры"
            className="w-full justify-center"
            onClick={() => setIsMobileFiltersOpen(true)}
          >
            Фильтр
            {appliedActiveTags.length ? (
              <span className="ml-2 rounded-full bg-[var(--plotty-accent-soft)] px-2 py-0.5 text-xs text-[var(--plotty-accent)]">
                {appliedActiveTags.length}
              </span>
            ) : null}
          </Button>
        </div>
      }
      contentClassName="pt-3 lg:pt-4"
      className="!px-3 sm:!px-4 lg:!px-6"
    >
      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-6">
        <aside className="hidden lg:block">
          <PlottySectionCard className="space-y-6 bg-[rgba(240,232,219,0.78)] shadow-none lg:space-y-7">
            <div className="space-y-3">
              <div className="space-y-1">
                <h2 className="plotty-section-title">Фильтры</h2>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" className="min-h-10 w-full px-3 text-sm" onClick={clearDraftFilters}>
                  Очистить всё
                </Button>
                <Button
                  variant="primary"
                  className="min-h-10 w-full px-3 text-sm"
                  onClick={applyDraftTags}
                  disabled={!hasFilterDraftChanges || isRouting}
                >
                  Применить
                </Button>
              </div>
            </div>

            {orderedGroups.map(([category, tags]) => {
              const selectedSlugs = getSelectedCategoryTags(draftTags, tags);

              if (singleSelectCategories.has(category)) {
                return (
                  <label key={category} className="grid gap-3">
                    <span className="plotty-meta text-xs font-bold uppercase tracking-[0.08em]">
                      {getStoryTagCategoryLabel(category)}
                    </span>
                    <Select
                      className="min-h-[3.25rem]"
                      aria-label={getStoryTagCategoryLabel(category)}
                      value={selectedSlugs[0] ?? ""}
                      onChange={(event) => setDraftTags(setSingleSelectTag(draftTags, event.target.value, tags))}
                    >
                      <option value="">Любой вариант</option>
                      {tags.map((tag) => (
                        <option key={tag.id} value={tag.slug}>
                          {tag.name}
                        </option>
                      ))}
                    </Select>
                  </label>
                );
              }

              if (multiSelectCategories.has(category)) {
                return (
                  <CatalogToggleGroup
                    key={category}
                    title={getStoryTagCategoryLabel(category)}
                    canClear={selectedSlugs.length > 0}
                    onClear={() => setDraftTags(replaceCategoryTags(draftTags, tags, []))}
                  >
                    {tags.map((tag) => (
                      <CatalogTogglePill
                        key={tag.id}
                        label={tag.name}
                        active={selectedSlugs.includes(tag.slug)}
                        onClick={() => setDraftTags(toggleMultiSelectTag(draftTags, tag.slug, tags))}
                      />
                    ))}
                  </CatalogToggleGroup>
                );
              }

              return (
                <CatalogToggleGroup key={category} title={getStoryTagCategoryLabel(category)}>
                  {tags.map((tag) => (
                    <StoryTagChip
                      key={tag.id}
                      tag={tag}
                      active={draftTags.includes(tag.slug)}
                      onClick={() => setDraftTags(toggleGenericTag(draftTags, tag.slug))}
                    />
                  ))}
                </CatalogToggleGroup>
              );
            })}
          </PlottySectionCard>
        </aside>

        <div className="space-y-4 lg:space-y-5">
          <PlottySectionCard className="border-[rgba(35,33,30,0.07)] bg-[rgba(240,232,219,0.86)] p-3 shadow-none sm:p-3.5">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-full bg-white/90 px-3 py-2 font-semibold text-[var(--plotty-ink)]">
                Найдено {totalStories}
              </span>
              {appliedQuery.q ? (
                <span className="rounded-full bg-[var(--plotty-accent-soft)] px-3 py-2 font-semibold text-[var(--plotty-accent)]">
                  Поиск: {appliedQuery.q}
                </span>
              ) : null}
              {(appliedQuery.q || appliedActiveTags.length) && !hasInitialLoading ? (
                <Button
                  variant="ghost"
                  className="min-h-10 px-3 text-sm"
                  onClick={() => {
                    clearAllDraft();
                    navigateToQuery({ ...appliedQuery, q: "", tags: [], page: 1 });
                  }}
                >
                  Очистить всё
                </Button>
              ) : null}
            </div>
          </PlottySectionCard>

          {appliedActiveTags.length ? (
            <div className="flex flex-wrap gap-2">
              {appliedActiveTags.map((tag) => (
                <StoryTagChip
                  key={tag.id}
                  tag={tag}
                  active
                  onClick={() =>
                    navigateToQuery({
                      ...appliedQuery,
                      tags: appliedQuery.tags.filter((slug) => slug !== tag.slug),
                      page: 1,
                    })
                  }
                />
              ))}
            </div>
          ) : null}

          {hasInitialLoading ? (
            <PlottySectionCard className="space-y-3 shadow-none">
              <div className="h-52 rounded-[20px] bg-white/50" />
              <div className="h-52 rounded-[20px] bg-white/50" />
            </PlottySectionCard>
          ) : storiesQuery.isError ? (
            <EmptyState
              title="Не удалось загрузить истории"
              description="Проверьте доступность API proxy /api и настройки BACKEND_URL."
              actionLabel="Очистить всё"
              onAction={clearAppliedFilters}
            />
          ) : stories.length ? (
            <div className="space-y-3 sm:space-y-4" aria-live="polite">
              {stories.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Ничего не найдено"
              description="Попробуйте изменить поисковый запрос или снять часть фильтров."
              actionLabel="Очистить всё"
              onAction={clearAppliedFilters}
            />
          )}
        </div>
      </div>

      <PlottyMobileSheet open={isMobileFiltersOpen} title="Фильтры" onClose={() => setIsMobileFiltersOpen(false)}>
        <div className="mb-5 grid grid-cols-2 gap-3">
          <Button variant="primary" onClick={applyMobileFilters} disabled={!hasFilterDraftChanges || isRouting}>
            Применить
          </Button>
          <Button variant="secondary" onClick={clearDraftFilters}>
            Очистить всё
          </Button>
        </div>

        <div className="space-y-6">
          {orderedGroups.map(([category, tags]) => {
            const selectedSlugs = getSelectedCategoryTags(draftTags, tags);

            if (singleSelectCategories.has(category)) {
              return (
                <label key={category} className="grid gap-3">
                  <span className="plotty-meta text-xs font-bold uppercase tracking-[0.08em]">
                    {getStoryTagCategoryLabel(category)}
                  </span>
                  <Select
                    className="min-h-[3.25rem]"
                    aria-label={getStoryTagCategoryLabel(category)}
                    value={selectedSlugs[0] ?? ""}
                    onChange={(event) => setDraftTags(setSingleSelectTag(draftTags, event.target.value, tags))}
                  >
                    <option value="">Любой вариант</option>
                    {tags.map((tag) => (
                      <option key={tag.id} value={tag.slug}>
                        {tag.name}
                      </option>
                    ))}
                  </Select>
                </label>
              );
            }

            if (multiSelectCategories.has(category)) {
              return (
                <CatalogToggleGroup
                  key={category}
                  title={getStoryTagCategoryLabel(category)}
                  canClear={selectedSlugs.length > 0}
                  onClear={() => setDraftTags(replaceCategoryTags(draftTags, tags, []))}
                >
                  {tags.map((tag) => (
                    <CatalogTogglePill
                      key={tag.id}
                      label={tag.name}
                      active={selectedSlugs.includes(tag.slug)}
                      onClick={() => setDraftTags(toggleMultiSelectTag(draftTags, tag.slug, tags))}
                    />
                  ))}
                </CatalogToggleGroup>
              );
            }

            return (
              <CatalogToggleGroup key={category} title={getStoryTagCategoryLabel(category)}>
                {tags.map((tag) => (
                  <StoryTagChip
                    key={tag.id}
                    tag={tag}
                    active={draftTags.includes(tag.slug)}
                    onClick={() => setDraftTags(toggleGenericTag(draftTags, tag.slug))}
                  />
                ))}
              </CatalogToggleGroup>
            );
          })}
        </div>
      </PlottyMobileSheet>
      {isRouting ? <span className="sr-only">Каталог обновляется</span> : null}
    </PlottyPageShell>
  );
}

function CatalogSearchField({
  value,
  onChange,
  compact = false,
}: {
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid items-center gap-3 rounded-[18px] border border-[rgba(35,33,30,0.08)] bg-white/84 px-4 shadow-none",
        compact ? "grid-cols-[auto_1fr] py-0.5" : "grid-cols-[auto_1fr] py-2",
      )}
    >
      <span className="text-base text-[var(--plotty-muted)]" aria-hidden="true">
        ⌕
      </span>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Поиск по названию истории"
        placeholder="Поиск по названию истории"
        className={cn(
          "border-0 bg-transparent px-0 shadow-none focus:border-transparent focus-visible:ring-0 focus-visible:ring-offset-0",
          compact ? "min-h-10 text-sm" : "min-h-11",
        )}
      />
    </div>
  );
}

function CatalogToggleGroup({
  title,
  canClear,
  onClear,
  children,
}: {
  title: string;
  canClear?: boolean;
  onClear?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3.5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="plotty-meta text-xs font-bold uppercase tracking-[0.08em]">{title}</h3>
        {canClear && onClear ? (
          <button
            type="button"
            onClick={onClear}
            className="plotty-meta text-xs font-bold uppercase tracking-[0.08em] transition-colors hover:text-[var(--plotty-ink)]"
          >
            Очистить
          </button>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2.5">{children}</div>
    </section>
  );
}

function CatalogTogglePill({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <Chip selected={active} onClick={onClick}>
      {label}
    </Chip>
  );
}

function getSelectedCategoryTags(currentTags: string[], categoryTags: StoryTag[]) {
  const categoryTagSet = new Set(categoryTags.map((tag) => tag.slug));

  return currentTags.filter((tagSlug) => categoryTagSet.has(tagSlug));
}

function replaceCategoryTags(currentTags: string[], categoryTags: StoryTag[], nextCategoryTags: string[]) {
  const categoryTagSet = new Set(categoryTags.map((tag) => tag.slug));
  const filteredTags = currentTags.filter((tagSlug) => !categoryTagSet.has(tagSlug));

  nextCategoryTags.forEach((tagSlug) => {
    if (!filteredTags.includes(tagSlug)) {
      filteredTags.push(tagSlug);
    }
  });

  return filteredTags;
}
