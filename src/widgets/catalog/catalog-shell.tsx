"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  authorDraftTeaserQueryOptions,
  catalogMetaQueryOptions,
  catalogQueryOptions,
  trendingFandomsQueryOptions,
} from "@/entities/catalog/api/catalog-api";
import {
  defaultCatalogQuery,
  parseCatalogQuery,
  serializeCatalogQuery,
} from "@/entities/catalog/model/catalog-query";
import type { CatalogQuery } from "@/entities/catalog/model/types";
import { Card } from "@/shared/ui/card";
import { EmptyState } from "@/shared/ui/empty-state";
import { Input } from "@/shared/ui/input";

import { AppHeader } from "./app-header";
import { AuthorEditorTeaserSection } from "./author-editor-teaser-section";
import { CatalogFiltersSidebar } from "./catalog-filters-sidebar";
import { CatalogNav } from "./catalog-nav";
import { CatalogResultBar } from "./catalog-result-bar";
import { CatalogRightRail } from "./catalog-right-rail";
import { StoryFeed } from "./story-feed";

export function CatalogShell() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = useMemo(() => parseCatalogQuery(new URLSearchParams(searchParams)), [searchParams]);
  const [searchValue, setSearchValue] = useState(query.q);

  const catalogQuery = useQuery(catalogQueryOptions(query));
  const metaQuery = useQuery(catalogMetaQueryOptions());
  const trendingQuery = useQuery(trendingFandomsQueryOptions());
  const draftQuery = useQuery(authorDraftTeaserQueryOptions());

  useEffect(() => {
    setSearchValue(query.q);
  }, [query.q]);

  const updateQuery = useCallback(
    (next: Partial<CatalogQuery>) => {
      const merged = { ...query, ...next };
      const params = serializeCatalogQuery(merged);
      const href = params.toString() ? `${pathname}?${params.toString()}` : pathname;

      router.replace(href, { scroll: false });
    },
    [pathname, query, router],
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (searchValue === query.q) {
        return;
      }

      updateQuery({ q: searchValue, page: 1 });
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [searchValue, query.q, updateQuery]);

  function resetQuery() {
    const params = serializeCatalogQuery(defaultCatalogQuery);
    const href = params.toString() ? `${pathname}?${params.toString()}` : pathname;

    router.replace(href, { scroll: false });
  }

  const isLoading =
    catalogQuery.isLoading || metaQuery.isLoading || trendingQuery.isLoading || draftQuery.isLoading;
  const hasError =
    catalogQuery.isError || metaQuery.isError || trendingQuery.isError || draftQuery.isError;

  if (hasError) {
    return (
      <div className="plotty-page-shell">
        <div className="plotty-frame">
          <EmptyState
            title="Не удалось загрузить каталог"
            description="Mock API поднят, но один из запросов вернул ошибку. Это состояние специально поддержано в первой итерации."
            actionLabel="Сбросить URL-фильтры"
            onAction={resetQuery}
          />
        </div>
      </div>
    );
  }

  if (isLoading || !catalogQuery.data || !metaQuery.data || !trendingQuery.data || !draftQuery.data) {
    return (
      <div className="plotty-page-shell">
        <div className="plotty-frame h-[640px] bg-white/30" />
        <div className="plotty-frame h-[360px] bg-white/20" />
      </div>
    );
  }

  const isFiltered =
    Boolean(query.q || query.fandom || query.status || query.rating || query.size) ||
    query.sort !== defaultCatalogQuery.sort;

  return (
    <div className="plotty-page-shell">
      <section className="plotty-frame">
        <AppHeader />
        <CatalogNav />

        <div className="space-y-5 px-7 py-6">
          <Card className="space-y-5 p-5">
            <div className="space-y-5">
              <div className="space-y-4">
                <h1 className="plotty-serif max-w-[540px] text-5xl font-semibold leading-[1.06] tracking-[-0.04em]">
                  Каталог историй для чтения и публикации
                </h1>
                <p className="max-w-[520px] text-sm leading-7 text-[var(--plotty-muted)]">
                  Плотный библиотечный каталог с продуктовой логикой. Читатель видит истории, фильтры и сигналы
                  AI-помощника, а автор на этом же экране понимает, что сервис умеет быть бета-ридером, а не
                  ghostwriter.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <MetricCard label="историй по активным фильтрам" value={metaQuery.data.stats.storiesMatched} />
                <MetricCard label="обновлений сегодня" value={metaQuery.data.stats.updatedToday} />
                <MetricCard label="читателей сейчас в каталоге" value={metaQuery.data.stats.liveReaders} />
              </div>
            </div>
          </Card>

          <div className="plotty-shell-grid">
            <CatalogFiltersSidebar query={query} meta={metaQuery.data} onChange={updateQuery} />

            <div className="space-y-4">
              <Card className="space-y-4 p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-xl text-[var(--plotty-muted)]">⌕</div>
                  <Input
                    aria-label="Поиск по каталогу"
                    className="border-0 bg-transparent px-0 shadow-none focus:border-transparent"
                    placeholder="поиск по фандому, названию, персонажу или тегу"
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                  />
                </div>
              </Card>

              <CatalogResultBar
                query={query}
                meta={metaQuery.data}
                total={catalogQuery.data.total}
                onChange={updateQuery}
              />

              <StoryFeed
                stories={catalogQuery.data.items}
                view={query.view}
                isFiltered={isFiltered}
                onReset={resetQuery}
              />
            </div>

            <CatalogRightRail
              aiPromo={metaQuery.data.aiPromo}
              trending={trendingQuery.data}
              draft={draftQuery.data}
            />
          </div>
        </div>
      </section>

      <AuthorEditorTeaserSection
        title={draftQuery.data.title}
        status={draftQuery.data.status}
        summary={draftQuery.data.summary}
        highlights={draftQuery.data.highlights}
      />
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="space-y-2 p-4">
      <div className="text-3xl font-semibold">{value.toLocaleString("ru-RU")}</div>
      <div className="text-sm leading-6 text-[var(--plotty-muted)]">{label}</div>
    </Card>
  );
}
