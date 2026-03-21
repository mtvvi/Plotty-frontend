"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { storiesQueryOptions, storyTagsQueryOptions } from "@/entities/story/api/stories-api";
import { defaultStoriesQuery, parseStoriesQuery, serializeStoriesQuery } from "@/entities/story/model/story-query";
import { routes } from "@/shared/config/routes";
import { getStoryTagCategoryLabel, groupStoryTags } from "@/shared/config/story-tags";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { EmptyState } from "@/shared/ui/empty-state";
import { Input } from "@/shared/ui/input";

import { StoryCard } from "./story-card";
import { StoryTagChip } from "./story-tag-chip";

export function StoriesCatalogShell() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = parseStoriesQuery(new URLSearchParams(searchParams));
  const storiesQuery = useQuery(storiesQueryOptions(query));
  const tagsQuery = useQuery(storyTagsQueryOptions());
  const stories = storiesQuery.data?.items ?? [];
  const groupedTags = groupStoryTags(tagsQuery.data?.items ?? []);
  const activeTags = (tagsQuery.data?.items ?? []).filter((tag) => query.tags.includes(tag.slug));

  function updateQuery(next: Partial<typeof query>) {
    const params = serializeStoriesQuery({ ...query, ...next, page: 1 });
    const href = params.toString() ? `${pathname}?${params.toString()}` : pathname;

    router.replace(href, { scroll: false });
  }

  function toggleTag(tagSlug: string) {
    const nextTags = query.tags.includes(tagSlug)
      ? query.tags.filter((tag) => tag !== tagSlug)
      : [...query.tags, tagSlug];

    updateQuery({ tags: nextTags });
  }

  function clearFilters() {
    const params = serializeStoriesQuery(defaultStoriesQuery);
    const href = params.toString() ? `${pathname}?${params.toString()}` : pathname;

    router.replace(href, { scroll: false });
  }

  return (
    <div className="plotty-page-shell">
      <section className="plotty-frame">
        <h1 className="sr-only">Каталог Plotty</h1>

        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--plotty-line)] bg-white/35 px-7 py-3 text-[13px] text-[var(--plotty-muted)]">
          <div className="flex flex-wrap items-center gap-3">
            <span>Plotty</span>
            <span>•</span>
            <span>каталог подключен к реальному Go-бэкенду</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[16px] font-bold text-[var(--plotty-ink)]">
            <span>Всего историй: {(storiesQuery.data?.pagination.total ?? 0).toLocaleString("ru-RU")}</span>
          </div>
        </div>

        <div className="space-y-7 px-7 py-6">
          <div className="grid gap-[18px] lg:grid-cols-[240px_minmax(0,1fr)_auto] lg:items-center">
            <Link href={routes.home} className="plotty-serif text-[50px] font-bold leading-none tracking-[-0.04em]">
              Plotty
            </Link>

            <div className="grid h-[58px] grid-cols-[auto_1fr] items-center gap-3 rounded-[16px] border border-[rgba(35,33,30,0.08)] bg-white/82 px-4">
              <span className="text-[16px]">⌕</span>
              <Input
                value={query.q}
                onChange={(event) => updateQuery({ q: event.target.value })}
                placeholder="поиск по названию истории"
                className="h-auto border-0 bg-transparent px-0 shadow-none focus:border-transparent"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href={routes.write}>
                <Button variant="primary" className="text-[16px]">
                  Начать писать
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
            <nav className="flex flex-wrap items-center gap-2">
              <Link href={routes.home} className="rounded-[12px] bg-black/7 px-[14px] py-[10px] text-[16px] font-bold">
                Каталог
              </Link>
              <Link href={routes.fandoms} className="rounded-[12px] px-[14px] py-[10px] text-[16px] font-bold text-[var(--plotty-muted)]">
                Фандомы
              </Link>
              <Link href={routes.authors} className="rounded-[12px] px-[14px] py-[10px] text-[16px] font-bold text-[var(--plotty-muted)]">
                Авторы
              </Link>
              <Link
                href={routes.recommendations}
                className="rounded-[12px] px-[14px] py-[10px] text-[16px] font-bold text-[var(--plotty-muted)]"
              >
                Рекомендации
              </Link>
              <Link href={routes.write} className="rounded-[12px] px-[14px] py-[10px] text-[16px] font-bold text-[var(--plotty-muted)]">
                Написать
              </Link>
            </nav>

            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="olive">AI-орфография</Badge>
              <Badge tone="gold">Генерация изображений</Badge>
            </div>
          </div>

          <div className="plotty-shell-grid">
            <Card className="space-y-4 bg-[rgba(240,232,219,0.7)] p-[18px] shadow-none">
              <div className="flex items-center justify-between">
                <h2 className="text-[18px] font-bold">Фильтры</h2>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-[12px] font-extrabold uppercase tracking-[0.08em] text-[var(--plotty-muted)]"
                >
                  Сбросить
                </button>
              </div>

              {Object.entries(groupedTags).map(([category, tags]) => (
                <CatalogFilterGroup key={category} title={getStoryTagCategoryLabel(category)}>
                  {tags.map((tag) => (
                    <StoryTagChip
                      key={tag.id}
                      tag={tag}
                      active={query.tags.includes(tag.slug)}
                      onClick={() => toggleTag(tag.slug)}
                    />
                  ))}
                </CatalogFilterGroup>
              ))}
            </Card>

            <div className="space-y-[14px]">
              <Card className="border-[rgba(35,33,30,0.07)] bg-[rgba(240,232,219,0.88)] p-4 shadow-none">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-[14px] font-bold">
                    <span className="rounded-[12px] bg-white/92 px-3 py-[9px]">Актуальный каталог</span>
                    <span className="text-[var(--plotty-muted)]">Фильтрация по тегам и названию</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-[12px] font-extrabold uppercase tracking-[0.08em] text-[var(--plotty-muted)]">
                    <span>{(storiesQuery.data?.pagination.total ?? 0).toLocaleString("ru-RU")} результатов</span>
                    <span className="rounded-[10px] bg-[var(--plotty-panel)] px-[10px] py-[6px] normal-case tracking-normal">
                      page {storiesQuery.data?.pagination.page ?? 1}
                    </span>
                  </div>
                </div>
              </Card>

              {activeTags.length ? (
                <div className="flex flex-wrap gap-2">
                  {activeTags.map((tag) => (
                    <StoryTagChip key={tag.id} tag={tag} active onClick={() => toggleTag(tag.slug)} />
                  ))}
                </div>
              ) : null}

              {storiesQuery.isLoading ? (
                <Card className="space-y-3 p-4 shadow-none">
                  <div className="h-40 rounded-[20px] bg-white/50" />
                  <div className="h-40 rounded-[20px] bg-white/50" />
                </Card>
              ) : storiesQuery.isError ? (
                <EmptyState
                  title="Не удалось загрузить истории"
                  description="Проверьте доступность backend API и переменную BACKEND_URL."
                  actionLabel="Сбросить фильтры"
                  onAction={clearFilters}
                />
              ) : stories.length ? (
                <div className="space-y-4">
                  {stories.map((story) => (
                    <StoryCard key={story.id} story={story} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Ничего не найдено"
                  description="Попробуйте снять часть тегов или изменить поисковый запрос."
                  actionLabel="Сбросить фильтры"
                  onAction={clearFilters}
                />
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function CatalogFilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-extrabold uppercase tracking-[0.08em] text-[var(--plotty-muted)]">{title}</h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </section>
  );
}
