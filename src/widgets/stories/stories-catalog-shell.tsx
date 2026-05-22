"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, ListFilter, LoaderCircle, Search, SlidersHorizontal, X } from "lucide-react";
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
import { IconButton } from "@/shared/ui/icon-button";
import { Input } from "@/shared/ui/input";
import { AnimatedList } from "@/shared/ui/motion";
import { PopoverContent, usePopover } from "@/shared/ui/popover";
import { PlottyMobileSheet, PlottyPageShell, PlottySectionCard } from "@/widgets/layout/plotty-page-shell";

import { StoryCard } from "./story-card";
import { StoryTagChip } from "./story-tag-chip";

const multiSelectCategories = new Set(["rating", "completion", "size"]);
const singleSelectCategories = new Set(["directionality"]);
const searchDebounceMs = 300;
const catalogFilterExitMs = 260;
type CatalogSort = StoriesSort | "popular-desc";
type CatalogFiltersState = "expanded" | "collapsing" | "collapsed";

const sortOptions: Array<{ value: CatalogSort; label: string }> = [
  { value: "popular-desc", label: "Популярное" },
  { value: "updated-desc", label: "Сначала новые" },
  { value: "updated-asc", label: "Сначала старые" },
  { value: "title-asc", label: "Название А-Я" },
  { value: "title-desc", label: "Название Я-А" },
];

type CatalogPageItem = number | "ellipsis";
type CatalogPaginationData = {
  page: number;
  pageSize: number;
  total: number;
};

export function StoriesCatalogShell() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isRouting, startTransition] = useTransition();
  const searchParamsString = searchParams.toString();
  const appliedQuery = useMemo(() => parseStoriesQuery(new URLSearchParams(searchParamsString)), [searchParamsString]);
  const [searchDraft, setSearchDraft] = useState(appliedQuery.q);
  const [localSort, setLocalSort] = useState<CatalogSort>(appliedQuery.sort ?? defaultStoriesSort);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [filtersState, setFiltersState] = useState<CatalogFiltersState>("expanded");
  const lastRequestedSearchRef = useRef(appliedQuery.q);
  const filtersCollapseTimeoutRef = useRef<number | null>(null);
  const filtersAreHidden = filtersState !== "expanded";

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
    return () => {
      if (filtersCollapseTimeoutRef.current !== null) {
        window.clearTimeout(filtersCollapseTimeoutRef.current);
      }
    };
  }, []);

  const normalizedSearchDraft = searchDraft.trim();
  const isSearchDirty = normalizedSearchDraft !== appliedQuery.q;
  const currentSort = localSort;
  const apiQuery = currentSort === "popular-desc" ? { ...appliedQuery, sort: undefined } : appliedQuery;

  const storiesQuery = useQuery({
    ...storiesQueryOptions(apiQuery),
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
  const pageHasOnlyDraftStories = (rawListItems?.length ?? 0) > 0 && catalogStories.length === 0;
  const hasInitialLoading = storiesQuery.isLoading && !storiesQuery.data;
  const appliedActiveTags = (tagsQuery.data?.items ?? []).filter((tag) => appliedQuery.tags.includes(tag.slug));

  useEffect(() => {
    setLocalSort((current) => (current === "popular-desc" ? current : appliedQuery.sort ?? defaultStoriesSort));
  }, [appliedQuery.sort]);

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

  function updateTagFilters(tags: string[]) {
    const nextQuery = {
      ...appliedQuery,
      tags,
      page: 1,
    };

    if (serializeStoriesQuery(nextQuery).toString() === serializeStoriesQuery({ ...appliedQuery, page: 1 }).toString()) {
      return;
    }

    navigateToQuery(nextQuery);
  }

  function clearTagFilters() {
    updateTagFilters([]);
  }

  function clearAllDraft() {
    setSearchDraft("");
    lastRequestedSearchRef.current = "";
  }

  function clearAppliedFilters() {
    clearAllDraft();
    navigateToQuery({ ...appliedQuery, q: "", tags: [], page: 1 });
  }

  function handleSortChange(sort: CatalogSort) {
    setLocalSort(sort);

    navigateToQuery({
      ...appliedQuery,
      sort: sort === "popular-desc" || sort === defaultStoriesSort ? undefined : sort,
      page: 1,
    });
  }

  function toggleDesktopFilters() {
    if (filtersCollapseTimeoutRef.current !== null) {
      window.clearTimeout(filtersCollapseTimeoutRef.current);
      filtersCollapseTimeoutRef.current = null;
    }

    if (filtersState === "expanded") {
      setFiltersState("collapsing");
      filtersCollapseTimeoutRef.current = window.setTimeout(() => {
        filtersCollapseTimeoutRef.current = null;
        setFiltersState("collapsed");
      }, catalogFilterExitMs);
      return;
    }

    setFiltersState("expanded");
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

  const filters = (
    <CatalogFilters
      orderedGroups={orderedGroups}
      selectedTags={appliedQuery.tags}
      onTagsChange={updateTagFilters}
      clearTagFilters={clearTagFilters}
      setSingleSelectTag={setSingleSelectTag}
      toggleMultiSelectTag={toggleMultiSelectTag}
      toggleGenericTag={toggleGenericTag}
    />
  );

  return (
    <PlottyPageShell
      pageTitle={<span aria-label="Каталог историй и глав">Каталог историй</span>}
      pageDescription="Откройте миры, написанные сердцем."
      pageActions={
        <div className="hidden min-w-0 items-center gap-3 lg:mt-3 lg:flex">
          <CatalogSortSelect value={currentSort} onChange={handleSortChange} ariaLabel="Сортировка каталога" />
          <Button
            type="button"
            variant="secondary"
            aria-pressed={filtersAreHidden}
            className="whitespace-nowrap"
            onClick={toggleDesktopFilters}
          >
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            {filtersAreHidden ? "Показать фильтры" : "Скрыть фильтры"}
          </Button>
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
      contentClassName="pt-5 lg:pt-10"
    >
      <div
        className="plotty-catalog-layout"
        data-filters-collapsed={filtersState === "collapsed" ? "true" : "false"}
        data-filters-state={filtersState}
      >
        <aside className="plotty-catalog-filter-rail hidden lg:block" aria-hidden={filtersAreHidden}>
          <PlottySectionCard variant="sidebar" className="plotty-catalog-filter-card sticky top-[7rem] space-y-5 bg-[rgba(255,250,244,0.58)] p-4 shadow-none backdrop-blur-sm xl:p-5">
            {filters}
          </PlottySectionCard>
        </aside>

        <section className="min-w-0 space-y-5">
          <div className="flex flex-wrap items-center gap-2">
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
            <CatalogInitialLoading />
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
            <AnimatedList
              items={catalogStories}
              getKey={(story) => story.id}
              className="plotty-catalog-story-list space-y-4"
              ariaLive="polite"
              renderItem={(story, index) => <StoryCard story={story} showChapterActions={false} priorityCover={index === 0} />}
            />
          ) : (
            <EmptyState
              title="Под этот запрос историй не нашлось"
              description="Попробуйте ослабить фильтры или очистить поиск, чтобы вернуть больше историй в каталог."
              actionLabel="Очистить всё"
              onAction={clearAppliedFilters}
            />
          )}

          {!hasInitialLoading && !storiesQuery.isError ? (
            <CatalogPagination
              disabled={isRouting}
              pagination={storiesQuery.data?.pagination}
              onPageChange={(page) => navigateToQuery({ ...appliedQuery, page })}
            />
          ) : null}
        </section>
      </div>

      <PlottyMobileSheet open={isMobileFiltersOpen} title="Фильтры" onClose={() => setIsMobileFiltersOpen(false)}>
        <div className="mb-5">
          <Button variant="secondary" fullWidth onClick={clearTagFilters}>
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
  selectedTags,
  onTagsChange,
  clearTagFilters,
  setSingleSelectTag,
  toggleMultiSelectTag,
  toggleGenericTag,
}: {
  orderedGroups: Array<readonly [string, StoryTag[]]>;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  clearTagFilters: () => void;
  setSingleSelectTag: (currentTags: string[], tagSlug: string, categoryTags: StoryTag[]) => string[];
  toggleMultiSelectTag: (currentTags: string[], tagSlug: string, categoryTags: StoryTag[]) => string[];
  toggleGenericTag: (currentTags: string[], tagSlug: string) => string[];
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="plotty-section-title flex items-center gap-2 text-[1.3rem]">
            <SlidersHorizontal className="size-4 text-[var(--plotty-accent)]" aria-hidden="true" />
            Фильтры
          </h2>
          <Button variant="ghost" className="min-h-8 px-2 text-xs" onClick={clearTagFilters}>
            Сбросить всё
          </Button>
        </div>
      </div>

      {orderedGroups.map(([category, tags]) => {
        const selectedSlugs = getSelectedCategoryTags(selectedTags, tags);

        if (singleSelectCategories.has(category)) {
          return (
            <CatalogFandomDropdown
              key={category}
              title={getStoryTagCategoryLabel(category)}
              options={tags}
              selectedSlug={selectedSlugs[0] ?? ""}
              onSelect={(tagSlug) => onTagsChange(setSingleSelectTag(selectedTags, tagSlug, tags))}
            />
          );
        }

        if (multiSelectCategories.has(category)) {
          return (
            <CatalogToggleGroup
              key={category}
              title={getStoryTagCategoryLabel(category)}
              canClear={selectedSlugs.length > 0}
              onClear={() => onTagsChange(replaceCategoryTags(selectedTags, tags, []))}
            >
              {tags.map((tag) => (
                <CatalogTogglePill
                  key={tag.id}
                  label={tag.name}
                  active={selectedSlugs.includes(tag.slug)}
                  onClick={() => onTagsChange(toggleMultiSelectTag(selectedTags, tag.slug, tags))}
                />
              ))}
            </CatalogToggleGroup>
          );
        }

        return (
          <CatalogToggleGroup
            key={category}
            title={getStoryTagCategoryLabel(category)}
            canClear={selectedSlugs.length > 0}
            onClear={() => onTagsChange(replaceCategoryTags(selectedTags, tags, []))}
          >
            {tags.map((tag) => (
              <StoryTagChip
                key={tag.id}
                tag={tag}
                active={selectedTags.includes(tag.slug)}
                onClick={() => onTagsChange(toggleGenericTag(selectedTags, tag.slug))}
              />
            ))}
          </CatalogToggleGroup>
        );
      })}
    </div>
  );
}

function CatalogSearchField({
  ariaLabel = "Поиск по названию истории",
  className,
  value,
  onChange,
}: {
  ariaLabel?: string;
  className?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Surface
      variant="inset"
      className={cn(
        "plotty-search-shell grid grid-cols-[auto_1fr] items-center gap-3 bg-[rgba(255,253,249,0.9)] px-4 py-1.5 shadow-[0_10px_24px_rgba(58,43,27,0.04)]",
        className,
      )}
    >
      <Search className="size-4 text-[var(--plotty-muted)]" aria-hidden="true" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={ariaLabel}
        placeholder="Поиск по названию истории"
        className="min-h-[42px] rounded-none border-0 bg-transparent px-0 shadow-none focus:border-transparent focus:shadow-none focus-visible:shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
      />
    </Surface>
  );
}

function CatalogSortSelect({
  ariaLabel = "Сортировка",
  value,
  onChange,
  compact = false,
}: {
  ariaLabel?: string;
  value: CatalogSort;
  onChange: (value: CatalogSort) => void;
  compact?: boolean;
}) {
  const popover = usePopover({ minWidth: 220 });
  const selectedOption = sortOptions.find((option) => option.value === value) ?? sortOptions[0];

  return (
    <div ref={popover.triggerRef} className={cn("relative", compact ? "w-full" : "min-w-[11.5rem]")}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={popover.open}
        onClick={popover.toggle}
        className={cn(
          "inline-grid min-h-11 w-full grid-cols-[auto_1fr_auto] items-center gap-2 rounded-[var(--plotty-radius-md)] border border-[var(--plotty-line)] bg-[rgba(255,253,249,0.88)] px-3 text-left text-sm font-semibold text-[var(--plotty-ink)] shadow-[0_10px_24px_rgba(58,43,27,0.05)] transition-[border-color,box-shadow,transform] hover:-translate-y-px hover:border-[var(--plotty-line-strong)] hover:shadow-[0_14px_28px_rgba(58,43,27,0.09)] active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plotty-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--plotty-paper)]",
          compact ? "w-full" : "",
        )}
      >
        <ListFilter className="size-4 text-[var(--plotty-muted)]" aria-hidden="true" />
        <span className="truncate">{selectedOption.label}</span>
        <span className={cn("text-[var(--plotty-muted)] transition-transform duration-[var(--motion-base)]", popover.open && "rotate-180")} aria-hidden="true">
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
              "plotty-popover-item flex w-full items-center rounded-[10px] px-3 py-2 text-left text-sm transition-colors",
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

function sortStoryListItems(stories: StoryListItem[], sort: CatalogSort) {
  return [...stories].sort((a, b) => {
    if (sort === "updated-asc") {
      return a.updatedAt.localeCompare(b.updatedAt);
    }

    if (sort === "popular-desc") {
      const likesDelta = (b.likesCount ?? 0) - (a.likesCount ?? 0);

      return likesDelta || b.updatedAt.localeCompare(a.updatedAt);
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
      aria-label={`Убрать фильтр ${label}`}
      title={label}
      onClick={onClear}
      className="plotty-chip-motion inline-flex min-h-9 max-w-full min-w-0 items-center gap-2 rounded-[var(--plotty-radius-md)] border border-[rgba(195,79,50,0.13)] bg-[var(--plotty-accent-wash)] px-3 text-sm font-semibold text-[var(--plotty-accent)] transition-colors hover:bg-[var(--plotty-accent-soft)] [&_svg]:transition-transform hover:[&_svg]:rotate-90"
    >
      <span className="min-w-0 max-w-xs truncate sm:max-w-md lg:max-w-2xl">{label}</span>
      <X className="size-3.5 shrink-0" aria-hidden="true" />
    </button>
  );
}

function CatalogInitialLoading() {
  return (
    <Surface
      variant="panel"
      className="flex min-h-64 items-center justify-center p-8 text-center"
      role="status"
      aria-live="polite"
      aria-label="Загружаем каталог"
    >
      <div className="grid justify-items-center gap-3">
        <span className="inline-flex size-12 items-center justify-center rounded-full border border-[var(--plotty-line)] bg-[var(--plotty-accent-wash)] text-[var(--plotty-accent)] shadow-[var(--plotty-shadow-soft)]">
          <LoaderCircle className="size-6 animate-spin" aria-hidden="true" />
        </span>
        <span className="plotty-meta">Загружаем истории...</span>
      </div>
    </Surface>
  );
}

function CatalogPagination({
  disabled,
  pagination,
  onPageChange,
}: {
  disabled?: boolean;
  pagination?: CatalogPaginationData;
  onPageChange: (page: number) => void;
}) {
  if (!pagination || pagination.total <= pagination.pageSize || pagination.pageSize <= 0) {
    return null;
  }

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);
  const currentPage = Math.min(Math.max(pagination.page, 1), totalPages);
  const firstItem = (currentPage - 1) * pagination.pageSize + 1;
  const lastItem = Math.min(currentPage * pagination.pageSize, pagination.total);
  const pageItems = getCatalogPageItems(currentPage, totalPages);

  function changePage(page: number) {
    if (page === currentPage || page < 1 || page > totalPages) {
      return;
    }

    onPageChange(page);
  }

  return (
    <nav
      aria-label="Пагинация каталога"
      className="flex flex-col gap-3 border-t border-[var(--plotty-line)] pt-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="plotty-meta text-sm">
        {firstItem}-{lastItem} из {pagination.total}
      </p>

      <div className="flex items-center gap-1.5">
        <IconButton
          aria-label="Предыдущая страница"
          disabled={disabled || currentPage <= 1}
          onClick={() => changePage(currentPage - 1)}
          size="sm"
          variant="secondary"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </IconButton>

        <div className="flex items-center gap-1">
          {pageItems.map((item, index) =>
            item === "ellipsis" ? (
              <span
                key={`ellipsis-${index}`}
                aria-hidden="true"
                className="inline-flex size-10 items-center justify-center text-sm font-semibold text-[var(--plotty-muted)]"
              >
                ...
              </span>
            ) : (
              <button
                key={item}
                type="button"
                aria-current={item === currentPage ? "page" : undefined}
                aria-label={`Страница ${item}`}
                disabled={disabled}
                onClick={() => changePage(item)}
                className={cn(
                  "inline-flex size-10 items-center justify-center rounded-[var(--plotty-radius-sm)] border text-sm font-semibold transition-[background-color,border-color,color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plotty-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--plotty-paper)] disabled:pointer-events-none disabled:opacity-60",
                  item === currentPage
                    ? "border-[var(--plotty-accent)] bg-[var(--plotty-accent)] text-white shadow-[0_8px_18px_rgba(195,79,50,0.18)]"
                    : "border-[var(--plotty-line)] bg-[rgba(255,253,249,0.78)] text-[var(--plotty-ink)] hover:border-[var(--plotty-line-strong)] hover:bg-[var(--plotty-paper-strong)]",
                )}
              >
                {item}
              </button>
            ),
          )}
        </div>

        <IconButton
          aria-label="Следующая страница"
          disabled={disabled || currentPage >= totalPages}
          onClick={() => changePage(currentPage + 1)}
          size="sm"
          variant="secondary"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </IconButton>
      </div>
    </nav>
  );
}

function getCatalogPageItems(currentPage: number, totalPages: number): CatalogPageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const nearbyPages = [1, currentPage - 1, currentPage, currentPage + 1, totalPages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);
  const pageItems: CatalogPageItem[] = [];

  nearbyPages.forEach((page, index) => {
    const previousPage = nearbyPages[index - 1];

    if (previousPage && page - previousPage > 1) {
      pageItems.push(page - previousPage === 2 ? previousPage + 1 : "ellipsis");
    }

    pageItems.push(page);
  });

  return pageItems;
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
  const [searchQuery, setSearchQuery] = useState("");
  const selectedOption = options.find((option) => option.slug === selectedSlug);
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredOptions = normalizedSearchQuery
    ? options.filter((option) => option.name.toLowerCase().includes(normalizedSearchQuery))
    : options;

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
          className="relative flex min-h-[3rem] w-full items-center rounded-[var(--plotty-radius-md)] border border-[var(--plotty-line)] bg-[rgba(255,253,249,0.84)] py-0 pl-4 pr-10 text-left text-sm font-semibold text-[var(--plotty-ink)] transition-[border-color,box-shadow,transform] duration-[var(--motion-base)] hover:-translate-y-px hover:border-[var(--plotty-line-strong)] hover:shadow-[0_10px_22px_rgba(58,43,27,0.08)] active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plotty-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--plotty-paper)]"
        >
          <span className="min-w-0 truncate">{selectedOption?.name ?? "Любой фандом"}</span>
          <span
            className={cn(
              "absolute right-4 top-1/2 -translate-y-1/2 text-[var(--plotty-muted)] transition-transform duration-[var(--motion-base)]",
              popover.open && "-translate-y-1/2 rotate-180",
            )}
            aria-hidden="true"
          >
            ▾
          </span>
        </button>

        <PopoverContent
          open={popover.open}
          contentRef={popover.contentRef}
          position={popover.position}
          role="dialog"
          aria-label={title}
          className="max-h-[min(32rem,calc(100vh-2rem))] overflow-y-auto rounded-[var(--plotty-radius-md)] p-2"
        >
          <div className="sticky top-0 z-10 mb-2 bg-[rgba(251,247,242,0.98)] pb-2">
            <div className="relative">
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                aria-label="Поиск по фандомам"
                placeholder="Найти фандом"
                className="min-h-10 pr-10"
              />
              {searchQuery ? (
                <IconButton
                  type="button"
                  aria-label="Очистить поиск фандомов"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 min-h-8 w-8 -translate-y-1/2 rounded-[var(--plotty-radius-sm)] p-0"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="size-4" aria-hidden="true" />
                </IconButton>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            role="option"
            aria-selected={!selectedSlug}
            onClick={() => {
              onSelect("");
              popover.close();
            }}
            className={cn(
              "plotty-popover-item flex w-full items-center rounded-[10px] px-3 py-2 text-left text-sm transition-colors",
              !selectedSlug ? "bg-white text-[var(--plotty-ink)]" : "text-[var(--plotty-muted)] hover:bg-white/80",
            )}
          >
            Любой фандом
          </button>
          {filteredOptions.map((option) => {
            const isSelected = selectedSlug === option.slug;

            if (isSelected) {
              return (
                <div
                  key={option.id}
                  role="option"
                  aria-label={option.name}
                  aria-selected="true"
                  className="plotty-popover-item flex w-full items-center justify-between gap-2 rounded-[10px] bg-white px-3 py-1.5 text-left text-sm text-[var(--plotty-ink)] transition-colors"
                >
                  <span className="min-w-0 truncate">{option.name}</span>
                  <IconButton
                    type="button"
                    aria-label="Сбросить фандом"
                    variant="ghost"
                    size="sm"
                    className="min-h-8 w-8 rounded-[var(--plotty-radius-sm)] p-0"
                    onClick={() => {
                      onSelect("");
                      popover.close();
                    }}
                  >
                    <X className="size-4" aria-hidden="true" />
                  </IconButton>
                </div>
              );
            }

            return (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected="false"
                onClick={() => {
                  onSelect(option.slug);
                  popover.close();
                }}
                className="plotty-popover-item flex w-full items-center rounded-[10px] px-3 py-2 text-left text-sm text-[var(--plotty-muted)] transition-colors hover:bg-white/80"
              >
                {option.name}
              </button>
            );
          })}
          {!filteredOptions.length ? (
            <div className="px-3 py-2 text-sm text-[var(--plotty-muted)]">Фандом не найден.</div>
          ) : null}
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
    <section className="space-y-3 border-t border-[var(--plotty-line)] pt-4 transition-colors duration-[var(--motion-base)] hover:border-[rgba(195,79,50,0.18)] first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between gap-3">
        <h3 className="plotty-label">{title}</h3>
        {canClear && onClear ? (
          <button
            type="button"
            onClick={onClear}
            className="plotty-meta text-xs font-semibold transition-[color,transform] duration-[var(--motion-base)] hover:translate-x-0.5 hover:text-[var(--plotty-ink)] active:scale-[0.98]"
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
