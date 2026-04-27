"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ListFilter, Search, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { storiesQueryOptions, storyTagsQueryOptions } from "@/entities/story/api/stories-api";
import { defaultStoriesSort, isStoryInPublicCatalog, parseStoriesQuery, serializeStoriesQuery } from "@/entities/story/model/story-query";
import type { StoriesQuery, StoriesSort, StoryListItem, StoryTag } from "@/entities/story/model/types";
import { getStoryTagCategoryLabel, groupStoryTags, storyTagCategoryOrder } from "@/shared/config/story-tags";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Surface } from "@/shared/ui/card";
import { Chip } from "@/shared/ui/chip";
import { EmptyState } from "@/shared/ui/empty-state";
import { Input } from "@/shared/ui/input";
import { PopoverContent, usePopover } from "@/shared/ui/popover";
import { PlottyAppMenu, PlottyMobileSheet, PlottyPageShell, PlottySectionCard } from "@/widgets/layout/plotty-page-shell";

import { StoryCard } from "./story-card";
import { StoryTagChip } from "./story-tag-chip";

const multiSelectCategories = new Set(["rating", "completion", "size"]);
const singleSelectCategories = new Set(["directionality"]);
const searchDebounceMs = 300;
const sortOptions: Array<{ value: StoriesSort; label: string }> = [
  { value: "updated-desc", label: "Сначала новые" },
  { value: "updated-asc", label: "Сначала старые" },
  { value: "title-asc", label: "Название А-Я" },
  { value: "title-desc", label: "Название Я-А" },
];

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
  const currentSort = appliedQuery.sort ?? defaultStoriesSort;

  const storiesQuery = useQuery({
    ...storiesQueryOptions(appliedQuery),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
  const tagsQuery = useQuery(storyTagsQueryOptions());
  const rawListItems = storiesQuery.data?.items;
  const catalogStories = useMemo(
    () => sortStoryListItems((rawListItems ?? []).filter(isStoryInPublicCatalog), currentSort),
    [currentSort, rawListItems],
  );
  const groupedTags = useMemo(() => groupStoryTags(tagsQuery.data?.items ?? []), [tagsQuery.data?.items]);
  const orderedGroups = storyTagCategoryOrder
    .map((category) => [category, groupedTags[category] ?? []] as const)
    .filter(([, tags]) => tags.length);
  const totalStories = storiesQuery.data?.pagination.total ?? catalogStories.length;
  const totalStoriesLabel = totalStories.toLocaleString("ru-RU");
  const pageHasOnlyDraftStories = (rawListItems?.length ?? 0) > 0 && catalogStories.length === 0;
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

  function handleSortChange(sort: StoriesSort) {
    navigateToQuery({
      ...appliedQuery,
      sort: sort === defaultStoriesSort ? undefined : sort,
      page: 1,
    });
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

  const filters = (
    <CatalogFilters
      orderedGroups={orderedGroups}
      draftTags={draftTags}
      setDraftTags={setDraftTags}
      clearDraftFilters={clearDraftFilters}
      hasFilterDraftChanges={hasFilterDraftChanges}
      isRouting={isRouting}
      applyDraftTags={applyDraftTags}
      setSingleSelectTag={setSingleSelectTag}
      toggleMultiSelectTag={toggleMultiSelectTag}
      toggleGenericTag={toggleGenericTag}
    />
  );

  return (
    <PlottyPageShell
      pageTitle={<span aria-label="Каталог историй и глав">Каталог историй</span>}
      pageDescription="Откройте миры, написанные сердцем."
      onMenuOpenChange={setIsMobileMenuOpen}
      menuContent={({ closeMenu }) => <PlottyAppMenu onNavigate={closeMenu} />}
      pageActions={
        <div className="hidden items-center gap-3 lg:flex">
          <span className="plotty-meta whitespace-nowrap">Найдено {totalStoriesLabel} историй</span>
          <CatalogSortSelect value={currentSort} onChange={handleSortChange} />
        </div>
      }
      mobileToolbar={
        <div className="grid gap-3">
          <CatalogSearchField value={searchDraft} onChange={setSearchDraft} />
          <CatalogSortSelect value={currentSort} onChange={handleSortChange} compact />
          <Button
            type="button"
            variant="secondary"
            aria-label="Открыть фильтры"
            onClick={() => setIsMobileFiltersOpen(true)}
          >
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            Фильтры
            {appliedActiveTags.length ? (
              <span className="rounded-full bg-[var(--plotty-accent-soft)] px-2 py-0.5 text-xs text-[var(--plotty-accent)]">
                {appliedActiveTags.length}
              </span>
            ) : null}
          </Button>
        </div>
      }
      contentClassName="pt-4 lg:pt-7"
      className="lg:!px-5"
    >
      <div className="grid gap-4 lg:grid-cols-[21rem_minmax(0,1fr)] lg:gap-6">
        <aside className="hidden lg:block">
          <PlottySectionCard variant="sidebar" className="sticky top-[7.25rem] space-y-5 shadow-none">
            {filters}
          </PlottySectionCard>
        </aside>

        <section className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[var(--plotty-line)] bg-[rgba(255,253,249,0.78)] px-3 py-2 text-sm font-semibold text-[var(--plotty-ink)] lg:hidden">
              Найдено {totalStoriesLabel}
            </span>
            {appliedQuery.q ? (
              <ActiveFilter label={`Поиск: ${appliedQuery.q}`} onClear={() => navigateToQuery({ ...appliedQuery, q: "", page: 1 })} />
            ) : null}
            {appliedActiveTags.map((tag) => (
              <ActiveFilter
                key={tag.id}
                label={tag.name}
                onClear={() =>
                  navigateToQuery({
                    ...appliedQuery,
                    tags: appliedQuery.tags.filter((slug) => slug !== tag.slug),
                    page: 1,
                  })
                }
              />
            ))}
            {(appliedQuery.q || appliedActiveTags.length) && !hasInitialLoading ? (
              <Button variant="ghost" className="min-h-9 px-2.5 text-sm" onClick={clearAppliedFilters}>
                Очистить всё
              </Button>
            ) : null}
          </div>

          {hasInitialLoading ? (
            <div className="space-y-3">
              <div className="h-56 rounded-[var(--plotty-radius-lg)] bg-white/50" />
              <div className="h-56 rounded-[var(--plotty-radius-lg)] bg-white/50" />
            </div>
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
            <div className="space-y-3.5" aria-live="polite">
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
        </section>
      </div>

      <PlottyMobileSheet open={isMobileFiltersOpen} title="Фильтры" onClose={() => setIsMobileFiltersOpen(false)}>
        <div className="mb-5 grid grid-cols-2 gap-3">
          <Button variant="primary" onClick={applyMobileFilters} disabled={!hasFilterDraftChanges || isRouting}>
            Применить
          </Button>
          <Button variant="secondary" onClick={clearDraftFilters}>
            Сбросить
          </Button>
        </div>
        {filters}
      </PlottyMobileSheet>
      {isRouting ? <span className="sr-only">Каталог обновляется</span> : null}
    </PlottyPageShell>
  );
}

function CatalogFilters({
  orderedGroups,
  draftTags,
  setDraftTags,
  clearDraftFilters,
  hasFilterDraftChanges,
  isRouting,
  applyDraftTags,
  setSingleSelectTag,
  toggleMultiSelectTag,
  toggleGenericTag,
}: {
  orderedGroups: Array<readonly [string, StoryTag[]]>;
  draftTags: string[];
  setDraftTags: (tags: string[]) => void;
  clearDraftFilters: () => void;
  hasFilterDraftChanges: boolean;
  isRouting: boolean;
  applyDraftTags: () => void;
  setSingleSelectTag: (currentTags: string[], tagSlug: string, categoryTags: StoryTag[]) => string[];
  toggleMultiSelectTag: (currentTags: string[], tagSlug: string, categoryTags: StoryTag[]) => string[];
  toggleGenericTag: (currentTags: string[], tagSlug: string) => string[];
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="plotty-section-title flex items-center gap-2 text-[1.35rem]">
            <SlidersHorizontal className="size-5 text-[var(--plotty-accent)]" aria-hidden="true" />
            Фильтры
          </h2>
          <Button variant="ghost" className="min-h-9 px-2.5 text-sm" onClick={clearDraftFilters}>
            Сбросить всё
          </Button>
        </div>
        <Button
          variant="primary"
          fullWidth
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
    </div>
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
    <Surface
      variant="inset"
      className="grid grid-cols-[auto_1fr] items-center gap-3 px-4 py-1.5 transition-[border-color,box-shadow] duration-150 ease-out focus-within:border-[var(--plotty-accent)] focus-within:shadow-[0_0_0_2px_var(--plotty-accent-soft)]"
    >
      <Search className="size-4 text-[var(--plotty-muted)]" aria-hidden="true" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Поиск по названию истории"
        placeholder="Поиск по названию истории"
        className="min-h-[42px] border-0 bg-transparent px-0 shadow-none focus:border-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
      />
    </Surface>
  );
}

function CatalogSortSelect({
  value,
  onChange,
  compact = false,
}: {
  value: StoriesSort;
  onChange: (value: StoriesSort) => void;
  compact?: boolean;
}) {
  const popover = usePopover({ minWidth: 220 });
  const selectedOption = sortOptions.find((option) => option.value === value) ?? sortOptions[0];

  return (
    <div ref={popover.triggerRef} className={cn("relative", compact ? "w-full" : "min-w-[12.5rem]")}>
      <button
        type="button"
        aria-label="Сортировка"
        aria-haspopup="listbox"
        aria-expanded={popover.open}
        onClick={popover.toggle}
        className={cn(
          "inline-grid min-h-12 w-full grid-cols-[auto_1fr_auto] items-center gap-2 rounded-[var(--plotty-radius-md)] border border-[var(--plotty-line)] bg-[rgba(255,253,249,0.86)] px-3 text-left text-sm font-semibold text-[var(--plotty-ink)] shadow-[0_8px_24px_rgba(58,43,27,0.05)] transition-[border-color,box-shadow] hover:border-[var(--plotty-line-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plotty-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--plotty-paper)]",
          compact ? "w-full" : "",
        )}
      >
        <ListFilter className="size-4 text-[var(--plotty-muted)]" aria-hidden="true" />
        <span className="truncate">{selectedOption.label}</span>
        <span className="text-[var(--plotty-muted)]" aria-hidden="true">
          ▾
        </span>
      </button>

      <PopoverContent
        open={popover.open}
        contentRef={popover.contentRef}
        position={popover.position}
        role="listbox"
        aria-label="Сортировка"
        className="rounded-[var(--plotty-radius-md)] p-2"
      >
        {sortOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            role="option"
            aria-selected={option.value === value}
            onClick={() => {
              onChange(option.value);
              popover.close();
            }}
            className={cn(
              "flex w-full items-center rounded-[10px] px-3 py-2 text-left text-sm transition-colors",
              option.value === value ? "bg-white text-[var(--plotty-ink)]" : "text-[var(--plotty-muted)] hover:bg-white/80",
            )}
          >
            {option.label}
          </button>
        ))}
      </PopoverContent>
    </div>
  );
}

function sortStoryListItems(stories: StoryListItem[], sort: StoriesSort) {
  return [...stories].sort((a, b) => {
    if (sort === "updated-asc") {
      return a.updatedAt.localeCompare(b.updatedAt);
    }

    if (sort === "title-asc") {
      return a.title.localeCompare(b.title, "ru");
    }

    if (sort === "title-desc") {
      return b.title.localeCompare(a.title, "ru");
    }

    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

function ActiveFilter({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <button
      type="button"
      onClick={onClear}
      className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[rgba(195,79,50,0.13)] bg-[var(--plotty-accent-wash)] px-3 text-sm font-semibold text-[var(--plotty-accent)] transition-colors hover:bg-[var(--plotty-accent-soft)]"
    >
      {label}
      <X className="size-3.5" aria-hidden="true" />
    </button>
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
  const popover = usePopover();
  const selectedOption = options.find((option) => option.slug === selectedSlug);

  return (
    <div ref={popover.triggerRef} className="grid gap-3">
      <span className="plotty-label">{title}</span>
      <div className="relative">
        <button
          type="button"
          aria-label={title}
          aria-haspopup="listbox"
          aria-expanded={popover.open}
          onClick={popover.toggle}
          className="flex min-h-[3rem] w-full items-center justify-between rounded-[var(--plotty-radius-md)] border border-[var(--plotty-line)] bg-[rgba(255,253,249,0.84)] px-4 text-left text-sm font-semibold text-[var(--plotty-ink)] transition-[border-color,box-shadow] duration-150 hover:border-[var(--plotty-line-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plotty-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--plotty-paper)]"
        >
          <span>{selectedOption?.name ?? "Любой фандом"}</span>
          <span className="text-[var(--plotty-muted)]" aria-hidden="true">
            ▾
          </span>
        </button>

        <PopoverContent
          open={popover.open}
          contentRef={popover.contentRef}
          position={popover.position}
          role="listbox"
          aria-label={title}
          className="rounded-[var(--plotty-radius-md)] p-2"
        >
          <button
            type="button"
            role="option"
            aria-selected={!selectedSlug}
            onClick={() => {
              onSelect("");
              popover.close();
            }}
            className={cn(
              "flex w-full items-center rounded-[10px] px-3 py-2 text-left text-sm transition-colors",
              !selectedSlug ? "bg-white text-[var(--plotty-ink)]" : "text-[var(--plotty-muted)] hover:bg-white/80",
            )}
          >
            Любой фандом
          </button>
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              role="option"
              aria-selected={selectedSlug === option.slug}
              onClick={() => {
                onSelect(option.slug);
                popover.close();
              }}
              className={cn(
                "flex w-full items-center rounded-[10px] px-3 py-2 text-left text-sm transition-colors",
                selectedSlug === option.slug ? "bg-white text-[var(--plotty-ink)]" : "text-[var(--plotty-muted)] hover:bg-white/80",
              )}
            >
              {option.name}
            </button>
          ))}
        </PopoverContent>
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
    <section className="space-y-3 border-t border-[var(--plotty-line)] pt-4 first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between gap-3">
        <h3 className="plotty-label">{title}</h3>
        {canClear && onClear ? (
          <button
            type="button"
            onClick={onClear}
            className="plotty-meta text-xs font-semibold transition-colors hover:text-[var(--plotty-ink)]"
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
