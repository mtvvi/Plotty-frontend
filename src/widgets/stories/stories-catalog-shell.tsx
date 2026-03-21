"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { storiesQueryOptions } from "@/entities/story/api/stories-api";
import { defaultStoriesQuery, parseStoriesQuery, serializeStoriesQuery } from "@/entities/story/model/story-query";
import { routes } from "@/shared/config/routes";
import {
  storyFandoms,
  storyGenres,
  storyRatings,
  storySizes,
  storyStatuses,
  storyTags,
  storyWarnings,
} from "@/shared/config/story-tags";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { EmptyState } from "@/shared/ui/empty-state";
import { Input } from "@/shared/ui/input";

import { StoryCard } from "./story-card";
import { StoryTagChip } from "./story-tag-chip";

const trendingFandoms = [
  { name: "Гарри Поттер", count: 412 },
  { name: "Ведьмак", count: 196 },
  { name: "Властелин Колец", count: 154 },
  { name: "Наруто", count: 129 },
];

const bookmarkItems = [
  {
    title: "Комната с видом на Астрономическую башню",
    meta: "обновлена 1 час назад • глава 14",
  },
  {
    title: "Корона из речного льда",
    meta: "новые комментарии • глава 8",
  },
  {
    title: "Тонкая география молчания",
    meta: "доступна сводка сюжета",
  },
];

export function StoriesCatalogShell() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = parseStoriesQuery(new URLSearchParams(searchParams));
  const storiesQuery = useQuery(storiesQueryOptions(query));
  const stories = storiesQuery.data?.items ?? [];
  const activeTags = query.tags
    .map((tagSlug) => storyTags.find((tag) => tag.slug === tagSlug))
    .filter((tag): tag is (typeof storyTags)[number] => Boolean(tag));

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

  function toggleSingle(key: "fandom" | "rating" | "status" | "size", value: string) {
    updateQuery({ [key]: query[key] === value ? "" : value } as Partial<typeof query>);
  }

  function clearTags() {
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
            <span>Онлайн: 14 802 читателя</span>
            <span>•</span>
            <span>Новый фандом недели: «Властелин Колец»</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[16px] font-bold text-[var(--plotty-ink)]">
            <span>Войти</span>
            <span>Зарегистрироваться</span>
          </div>
        </div>

        <div className="space-y-7 px-7 py-6">
          <div className="grid gap-[18px] lg:grid-cols-[240px_minmax(0,1fr)_auto] lg:items-center">
            <Link href={routes.home} className="plotty-serif text-[50px] font-bold leading-none tracking-[-0.04em]">
              Plotty
            </Link>

            <div className="grid h-[58px] grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[16px] border border-[rgba(35,33,30,0.08)] bg-white/82 px-4">
              <span className="text-[16px]">⌕</span>
              <Input
                readOnly
                value=""
                placeholder="поиск по фандому, названию, персонажу или тегу"
                className="h-auto border-0 bg-transparent px-0 shadow-none focus:border-transparent"
              />
              <span className="rounded-[10px] bg-[var(--plotty-panel)] px-[10px] py-[6px] text-[12px] font-bold text-[var(--plotty-muted)]">
                /
              </span>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center rounded-[14px] bg-white/86 px-[18px] text-[16px] font-bold"
              >
                Черновики
              </button>
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
              <Badge tone="olive">Проверка канона</Badge>
              <Badge tone="gold">Сводки по главам</Badge>
            </div>
          </div>

          <div className="plotty-shell-grid">
            <Card className="space-y-4 bg-[rgba(240,232,219,0.7)] p-[18px] shadow-none">
              <div className="flex items-center justify-between">
                <h2 className="text-[18px] font-bold">Фильтры</h2>
                <button
                  type="button"
                  onClick={clearTags}
                  className="text-[12px] font-extrabold uppercase tracking-[0.08em] text-[var(--plotty-muted)]"
                >
                  Сбросить
                </button>
              </div>

              <CatalogFilterGroup title="Направленность">
                {storyFandoms.map((fandom) => (
                  <StaticChip key={fandom} active={query.fandom === fandom} onClick={() => toggleSingle("fandom", fandom)}>
                    {fandom}
                  </StaticChip>
                ))}
              </CatalogFilterGroup>

              <CatalogFilterGroup title="Жанры">
                {storyGenres.map((tag) => (
                  <StoryTagChip
                    key={tag.id}
                    tag={tag}
                    active={query.tags.includes(tag.slug)}
                    onClick={() => toggleTag(tag.slug)}
                  />
                ))}
              </CatalogFilterGroup>

              <CatalogFilterGroup title="Предупреждения">
                {storyWarnings.map((tag) => (
                  <StoryTagChip
                    key={tag.id}
                    tag={tag}
                    active={query.tags.includes(tag.slug)}
                    onClick={() => toggleTag(tag.slug)}
                  />
                ))}
              </CatalogFilterGroup>

              <CatalogFilterGroup title="Рейтинг">
                {storyRatings.map((rating) => (
                  <StaticChip key={rating} active={query.rating === rating} onClick={() => toggleSingle("rating", rating)}>
                    {rating}
                  </StaticChip>
                ))}
              </CatalogFilterGroup>

              <CatalogFilterGroup title="Статус">
                {storyStatuses.map((status) => (
                  <StaticChip key={status} active={query.status === status} onClick={() => toggleSingle("status", status)}>
                    {status}
                  </StaticChip>
                ))}
              </CatalogFilterGroup>

              <CatalogFilterGroup title="Размер">
                {storySizes.map((size) => (
                  <StaticChip key={size} active={query.size === size} onClick={() => toggleSingle("size", size)}>
                    {size}
                  </StaticChip>
                ))}
              </CatalogFilterGroup>

              <CatalogFilterGroup title="Искать только">
                <StaticChip>с новыми главами</StaticChip>
                <StaticChip active>с открытыми комментариями</StaticChip>
                <StaticChip>с AI-сводкой</StaticChip>
              </CatalogFilterGroup>
            </Card>

            <div className="space-y-[14px]">
              <Card className="border-[rgba(35,33,30,0.07)] bg-[rgba(240,232,219,0.88)] p-4 shadow-none">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-[14px] font-bold">
                    <span className="rounded-[12px] bg-white/92 px-3 py-[9px]">Новые</span>
                    <span className="text-[var(--plotty-muted)]">Обновления</span>
                    <span className="text-[var(--plotty-muted)]">Популярное</span>
                    <span className="text-[var(--plotty-muted)]">Обсуждаемые</span>
                    <span className="text-[var(--plotty-muted)]">С закладками</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-[12px] font-extrabold uppercase tracking-[0.08em] text-[var(--plotty-muted)]">
                    <span>{(storiesQuery.data?.pagination.total ?? 0).toLocaleString("ru-RU")} результатов</span>
                    <span className="rounded-[10px] bg-[var(--plotty-panel)] px-[10px] py-[6px] normal-case tracking-normal">
                      Плитка
                    </span>
                    <span className="rounded-[10px] bg-[var(--plotty-panel)] px-[10px] py-[6px] normal-case tracking-normal text-[var(--plotty-ink)]">
                      Лента
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
                  description="Проверьте mock API или повторите запрос позже."
                  actionLabel="Сбросить фильтры"
                  onAction={clearTags}
                />
              ) : stories.length ? (
                <div className="space-y-[14px]">
                  {stories.map((story) => (
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

            <div className="space-y-[14px]">
              <Card className="space-y-4 p-4 shadow-none">
                <h3 className="text-[18px] font-bold">В тренде по фандомам</h3>
                <div className="flex flex-wrap gap-2">
                  {trendingFandoms.map((item) => (
                    <span key={item.name} className="rounded-full bg-[var(--plotty-paper)] px-3 py-2 text-[13px] font-bold">
                      {item.name} × {item.count}
                    </span>
                  ))}
                </div>
              </Card>

              <Card className="space-y-4 p-4 shadow-none">
                <h3 className="text-[18px] font-bold">Продолжить из закладок</h3>
                <div className="space-y-3">
                  {bookmarkItems.map((item, index) => (
                    <div
                      key={item.title}
                      className={`space-y-1 ${index ? "border-t border-[var(--plotty-line)] pt-3" : ""}`}
                    >
                      <div className="text-[16px] font-bold">{item.title}</div>
                      <div className="text-[16px] text-[var(--plotty-muted)]">{item.meta}</div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="space-y-4 p-4 shadow-none">
                <h3 className="text-[18px] font-bold">Для автора</h3>
                <p className="text-[16px] leading-7 text-[var(--plotty-muted)]">
                  Наш бета-ридер не генерирует главы по кнопке. Он помогает комфортно творить, помогая в грамматике и
                  соблюдении канона.
                </p>
                <Link href={routes.write}>
                  <Button variant="primary" className="w-full text-[16px]">
                    Открыть редактор
                  </Button>
                </Link>
              </Card>
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
    <section className="space-y-3 border-t border-[var(--plotty-line)] pt-[14px] first:border-t-0 first:pt-1">
      <h3 className="text-[13px] font-bold uppercase tracking-[0.08em] text-[var(--plotty-muted)]">{title}</h3>
      <div className="flex flex-wrap gap-3">{children}</div>
    </section>
  );
}

function StaticChip({
  children,
  active = false,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  const className =
    `rounded-full px-3 py-2 text-[13px] font-bold transition-colors ${
      active ? "bg-[var(--plotty-ink)] text-[var(--plotty-paper)]" : "bg-[var(--plotty-panel)] text-[var(--plotty-ink)]"
    }`;

  if (!onClick) {
    return (
      <span
        className={className}
      >
        {children}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-2 text-[13px] font-bold ${
        active ? "bg-[var(--plotty-ink)] text-[var(--plotty-paper)]" : "bg-[var(--plotty-panel)] text-[var(--plotty-ink)]"
      }`}
    >
      {children}
    </button>
  );
}
