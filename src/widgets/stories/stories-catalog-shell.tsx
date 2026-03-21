"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { storiesQueryOptions } from "@/entities/story/api/stories-api";
import { defaultStoriesQuery, parseStoriesQuery, serializeStoriesQuery } from "@/entities/story/model/story-query";
import { storyTags } from "@/shared/config/story-tags";
import { EmptyState } from "@/shared/ui/empty-state";

import { PlottyShell, ShellCard } from "./plotty-shell";
import { StoryCard } from "./story-card";
import { StoryTagChip } from "./story-tag-chip";

export function StoriesCatalogShell() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = parseStoriesQuery(new URLSearchParams(searchParams));
  const storiesQuery = useQuery(storiesQueryOptions(query));

  function setTags(tags: string[]) {
    const params = serializeStoriesQuery({ ...query, tags, page: 1 });
    const href = params.toString() ? `${pathname}?${params.toString()}` : pathname;

    router.replace(href, { scroll: false });
  }

  function toggleTag(tagSlug: string) {
    const nextTags = query.tags.includes(tagSlug)
      ? query.tags.filter((tag) => tag !== tagSlug)
      : [...query.tags, tagSlug];

    setTags(nextTags);
  }

  function clearTags() {
    const params = serializeStoriesQuery(defaultStoriesQuery);
    const href = params.toString() ? `${pathname}?${params.toString()}` : pathname;

    router.replace(href, { scroll: false });
  }

  return (
    <PlottyShell
      title="Каталог историй и глав"
      description="Plotty показывает истории, держит короткий набор фиксированных тегов и ведёт автора в редактор без лишнего лендинга."
    >
      <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="space-y-5">
          <ShellCard title="Фильтр по тегам" description="Фиксированный набор тегов. Фильтрация работает по AND-логике.">
            <div className="flex flex-wrap gap-2">
              {storyTags.map((tag) => (
                <StoryTagChip
                  key={tag.id}
                  tag={tag}
                  active={query.tags.includes(tag.slug)}
                  onClick={() => toggleTag(tag.slug)}
                />
              ))}
            </div>
          </ShellCard>

          <ShellCard title="Текущий скоуп" description="Сейчас реализуем только истории, главы, редактор и две AI-функции.">
            <ul className="space-y-2 text-sm leading-6 text-[var(--plotty-muted)]">
              <li>Фиксированные теги без пользовательского создания</li>
              <li>Базовый текстовый редактор главы</li>
              <li>Проверка орфографии</li>
              <li>Генерация картинки для главы</li>
            </ul>
          </ShellCard>
        </div>

        <div className="space-y-5">
          <ShellCard title="Выдача" description={`${storiesQuery.data?.pagination.total ?? 0} историй по текущим тегам.`}>
            {query.tags.length ? (
              <div className="flex flex-wrap items-center gap-2">
                {query.tags.map((tagSlug) => {
                  const tag = storyTags.find((item) => item.slug === tagSlug);

                  return tag ? <StoryTagChip key={tag.id} tag={tag} active /> : null;
                })}
                <button type="button" onClick={clearTags} className="text-sm font-semibold text-[var(--plotty-accent)]">
                  Сбросить
                </button>
              </div>
            ) : null}
          </ShellCard>

          {storiesQuery.isLoading ? (
            <ShellCard>
              <div className="space-y-3">
                <div className="h-32 rounded-[20px] bg-white/50" />
                <div className="h-32 rounded-[20px] bg-white/50" />
              </div>
            </ShellCard>
          ) : storiesQuery.isError ? (
            <EmptyState
              title="Не удалось загрузить истории"
              description="Проверьте mock API или повторите запрос позже."
              actionLabel="Сбросить фильтры"
              onAction={clearTags}
            />
          ) : storiesQuery.data?.items.length ? (
            <div className="space-y-4">
              {storiesQuery.data.items.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Истории не найдены"
              description="Снимите часть тегов или создайте новую историю в редакторе."
              actionLabel="Сбросить фильтры"
              onAction={clearTags}
            />
          )}
        </div>
      </div>
    </PlottyShell>
  );
}
