"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { storiesQueryOptions, storyTagsQueryOptions } from "@/entities/story/api/stories-api";
import { isStoryInPublicCatalog, parseStoriesQuery, serializeStoriesQuery } from "@/entities/story/model/story-query";
import type { StoriesQuery, StoryTag } from "@/entities/story/model/types";
import { getStoryTagCategoryLabel, groupStoryTags, storyTagCategoryOrder } from "@/shared/config/story-tags";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Chip } from "@/shared/ui/chip";
import { EmptyState } from "@/shared/ui/empty-state";
import { Input } from "@/shared/ui/input";
import { PlottyAppMenu, PlottyMobileSheet, PlottyPageShell, PlottySectionCard } from "@/widgets/layout/plotty-page-shell";

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
  const rawListItems = useMemo(() => storiesQuery.data?.items ?? [], [storiesQuery.data?.items]);
  const catalogStories = useMemo(() => rawListItems.filter(isStoryInPublicCatalog), [rawListItems]);
  const groupedTags = useMemo(() => groupStoryTags(tagsQuery.data?.items ?? []), [tagsQuery.data?.items]);
  const orderedGroups = storyTagCategoryOrder
    .map((category) => [category, groupedTags[category] ?? []] as const)
    .filter(([, tags]) => tags.length);
  const totalStories = catalogStories.length.toLocaleString("ru-RU");
  const pageHasOnlyDraftStories = rawListItems.length > 0 && catalogStories.length === 0;
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
      mobileToolbar={
        <div className="grid gap-2">
          <Button
            type="button"
            variant="secondary"
            aria-label="Открыть фильтры"
            className="w-full justify-center"
            onClick={() => setIsMobileFiltersOpen(true)}
          >
            Фильтры
            {appliedActiveTags.length ? (
              <span className="ml-2 rounded-full bg-[var(--plotty-accent-soft)] px-2 py-0.5 text-xs text-[var(--plotty-accent)]">
                {appliedActiveTags.length}
              </span>
            ) : null}
          </Button>
        </div>
      }
      contentClassName="pt-3 lg:pt-5"
      className="!px-3 sm:!px-4 lg:!px-6"
    >
      <div className="space-y-4 lg:space-y-5">
        <PlottySectionCard className="p-4 sm:p-5 lg:p-6">
          <CatalogSearchField value={searchDraft} onChange={setSearchDraft} />
        </PlottySectionCard>

        <div className="grid gap-3 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-5">
          <aside className="hidden lg:block">
            <PlottySectionCard className="sticky top-[6.5rem] space-y-5 bg-[rgba(240,232,219,0.55)] shadow-none">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="plotty-section-title">Фильтры</h2>
                  <Button variant="ghost" className="min-h-9 px-2.5 text-sm" onClick={clearDraftFilters}>
                    Очистить всё
                  </Button>
                </div>
                <Button
                  variant="primary"
                  className="min-h-10 w-full justify-center px-3 text-sm"
                  onClick={applyDraftTags}
                  disabled={!hasFilterDraftChanges || isRouting}
                >
                  Применить
                </Button>
              </div>

              {orderedGroups.map(([category, tags]) => {
                const selectedSlugs = getSelectedCategoryTags(draftTags, tags);

                if (singleSelectCategories.has(category)) {
                  return (
                    <CatalogFandomDropdown
                      key={category}
                      title={getStoryTagCategoryLabel(category)}
                      options={tags}
                      selectedSlug={selectedSlugs[0] ?? ""}
                      onSelect={(tagSlug) => setDraftTags(setSingleSelectTag(draftTags, tagSlug, tags))}
                    />
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

          <div className="space-y-3 lg:space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-full bg-white/90 px-3 py-2 font-semibold text-[var(--plotty-ink)] shadow-[0_6px_16px_rgba(46,35,23,0.06)]">
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
                  className="min-h-9 px-2.5 text-sm"
                  onClick={() => {
                    clearAllDraft();
                    navigateToQuery({ ...appliedQuery, q: "", tags: [], page: 1 });
                  }}
                >
                  Очистить всё
                </Button>
              ) : null}
            </div>

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
                <div className="h-48 rounded-[20px] bg-white/50" />
                <div className="h-48 rounded-[20px] bg-white/50" />
              </PlottySectionCard>
            ) : storiesQuery.isError ? (
              <EmptyState
                title="Не удалось загрузить истории"
                description="Проверьте доступность API proxy /api и настройки BACKEND_URL."
                actionLabel="Очистить всё"
                onAction={clearAppliedFilters}
              />
            ) : pageHasOnlyDraftStories ? (
              <EmptyState
                title="На этой странице нет опубликованных историй"
                description="Черновики и истории без опубликованной первой главы в общий каталог не попадают. Перейдите на другую страницу выдачи или смените фильтры."
                actionLabel="Очистить всё"
                onAction={clearAppliedFilters}
              />
            ) : catalogStories.length ? (
              <div className="space-y-3 sm:space-y-4" aria-live="polite">
                {catalogStories.map((story) => (
                  <StoryCard key={story.id} story={story} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="Под этот запрос историй не нашлось"
                description="Попробуйте ослабить фильтры или очистить поиск, чтобы вернуть больше историй в каталог."
                actionLabel="Очистить всё"
                onAction={clearAppliedFilters}
              />
            )}
          </div>
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
                <CatalogFandomDropdown
                  key={category}
                  title={getStoryTagCategoryLabel(category)}
                  options={tags}
                  selectedSlug={selectedSlugs[0] ?? ""}
                  onSelect={(tagSlug) => setDraftTags(setSingleSelectTag(draftTags, tagSlug, tags))}
                />
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
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-[auto_1fr] items-center gap-3 rounded-[18px] border border-[rgba(35,33,30,0.08)] bg-white/88 px-4 py-1.5 shadow-[0_8px_24px_rgba(46,35,23,0.05)] transition-[border-color,box-shadow] duration-150 ease-out focus-within:border-[var(--plotty-accent)] focus-within:shadow-[0_0_0_2px_var(--plotty-accent-soft)]">
      <span className="text-base text-[var(--plotty-muted)]" aria-hidden="true">
        ⌕
      </span>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Поиск по названию истории"
        placeholder="Поиск по названию истории"
        className="min-h-[42px] border-0 bg-transparent px-0 shadow-none focus:border-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
      />
    </div>
  );
}

function CatalogFandomDropdown({
  title,
  options,
  selectedSlug,
  onSelect,
}: {
  title: string;
  options: StoryTag[];
  selectedSlug: string;
  onSelect: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = options.find((option) => option.slug === selectedSlug);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="grid gap-3">
      <span className="plotty-meta text-xs font-bold uppercase tracking-[0.08em]">{title}</span>
      <div className="relative">
        <button
          type="button"
          aria-label={title}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          className="flex min-h-[3.25rem] w-full items-center justify-between rounded-[18px] border border-[rgba(41,38,34,0.08)] bg-white/88 px-4 text-left text-sm font-semibold text-[var(--plotty-ink)] shadow-[0_8px_24px_rgba(46,35,23,0.05)] transition-[border-color,box-shadow] duration-150 hover:border-[var(--plotty-line-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plotty-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--plotty-paper)]"
        >
          <span>{selectedOption?.name ?? "Любой вариант"}</span>
          <span className="text-[var(--plotty-muted)]" aria-hidden="true">
            ▾
          </span>
        </button>

        {open ? (
          <div
            role="listbox"
            aria-label={title}
            className="absolute left-0 right-0 top-[calc(100%+0.55rem)] z-10 rounded-[20px] border border-[rgba(41,38,34,0.08)] bg-[rgba(247,242,234,0.98)] p-2 shadow-[var(--plotty-shadow-soft)] backdrop-blur-xl"
          >
            <button
              type="button"
              role="option"
              aria-selected={!selectedSlug}
              onClick={() => {
                onSelect("");
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center rounded-[14px] px-3 py-2 text-left text-sm transition-colors",
                !selectedSlug ? "bg-white text-[var(--plotty-ink)]" : "text-[var(--plotty-muted)] hover:bg-white/80",
              )}
            >
              Любой вариант
            </button>
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={selectedSlug === option.slug}
                onClick={() => {
                  onSelect(option.slug);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center rounded-[14px] px-3 py-2 text-left text-sm transition-colors",
                  selectedSlug === option.slug ? "bg-white text-[var(--plotty-ink)]" : "text-[var(--plotty-muted)] hover:bg-white/80",
                )}
              >
                {option.name}
              </button>
            ))}
          </div>
        ) : null}
      </div>
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
    <section className="space-y-3">
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
      <div className="flex flex-wrap gap-2">{children}</div>
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
