"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, FileText, PenLine, Plus, Search, Settings } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  chapterDetailsQueryOptions,
  createChapter,
  myStoriesQueryOptions,
  storyDetailsQueryOptions,
  storyKeys,
} from "@/entities/story/api/stories-api";
import type { StoryListItem, StoryTag } from "@/entities/story/model/types";
import { defaultStoriesQuery, readerChapterNumberForChapterId } from "@/entities/story/model/story-query";
import { useAuth } from "@/entities/auth/model/auth-context";
import { STORY_ANNOTATION_PLACEHOLDER } from "@/shared/config/story-annotation";
import { isAuthError } from "@/shared/api/fetch-json";
import { routes } from "@/shared/config/routes";
import { getStoryTagCategoryLabel, groupStoryTags } from "@/shared/config/story-tags";
import { Button, ButtonLink } from "@/shared/ui/button";
import { Chip } from "@/shared/ui/chip";
import { EmptyState } from "@/shared/ui/empty-state";
import { Input } from "@/shared/ui/input";
import { Surface } from "@/shared/ui/card";
import { StoryRevealButtonLink } from "@/shared/ui/story-reveal-transition";
import { CreditBalancePill } from "@/widgets/credits/credit-balance-pill";

import { PlottyShell, ShellCard } from "./plotty-shell";
import { StoryCoverPreview } from "./story-cover-preview";
import {
  ChapterSortButton,
  sortChaptersForDisplay,
  type ChapterSortDirection,
} from "./chapter-list-sort";

const emptyChapterDraft = "Черновик новой главы. Откройте редактор и продолжайте писать.";

export function getSidebarStoryCoverImageUrl({
  story,
  selectedStorySlug,
  selectedStoryDisplayCover,
  storyFirstChapterImageUrl,
}: {
  story: Pick<StoryListItem, "slug" | "coverImageUrl">;
  selectedStorySlug: string;
  selectedStoryDisplayCover?: string | null;
  storyFirstChapterImageUrl?: string | null;
}) {
  const selectedStoryFallback = story.slug === selectedStorySlug ? selectedStoryDisplayCover : undefined;

  return story.coverImageUrl ?? storyFirstChapterImageUrl ?? selectedStoryFallback ?? undefined;
}

export function StoryCreateScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const requestedStorySlug = searchParams.get("story") ?? "";
  const savedMessage = searchParams.get("saved") === "story" ? "История сохранена." : "";
  const [selectedStorySlug, setSelectedStorySlug] = useState("");
  const [storySearchDraft, setStorySearchDraft] = useState("");
  const [chapterSortDirection, setChapterSortDirection] = useState<ChapterSortDirection>("asc");
  const workshopChaptersScrollRef = useRef<HTMLDivElement | null>(null);
  const storiesQuery = useQuery(myStoriesQueryOptions({ ...defaultStoriesQuery, pageSize: 50 }, { userId: user?.id }));
  const selectedStoryQuery = useQuery({
    ...storyDetailsQueryOptions(selectedStorySlug),
    enabled: Boolean(selectedStorySlug),
  });
  const selectedStoryFirstChapterId = selectedStoryQuery.data?.chapters[0]?.id ?? "";
  const selectedStoryFirstChapterQuery = useQuery({
    ...chapterDetailsQueryOptions(selectedStoryFirstChapterId),
    enabled: Boolean(selectedStoryFirstChapterId && !selectedStoryQuery.data?.coverImageUrl),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
  const createChapterMutation = useMutation({
    mutationFn: ({ storyId, title }: { storyId: string; title: string }) =>
      createChapter(storyId, { title, content: emptyChapterDraft }),
  });

  useEffect(() => {
    if (!storiesQuery.data?.items.length) {
      return;
    }

    const requestedStoryExists = requestedStorySlug
      ? storiesQuery.data.items.some((story) => story.slug === requestedStorySlug)
      : false;
    const stillExists = storiesQuery.data.items.some((story) => story.slug === selectedStorySlug);

    if (!selectedStorySlug && requestedStoryExists) {
      setSelectedStorySlug(requestedStorySlug);
      return;
    }

    if (!selectedStorySlug || !stillExists) {
      setSelectedStorySlug(storiesQuery.data.items[0].slug);
    }
  }, [requestedStorySlug, selectedStorySlug, storiesQuery.data?.items]);

  useEffect(() => {
    if (!selectedStoryQuery.data || window.location.hash !== "#active-story") {
      return;
    }

    document.getElementById("active-story")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selectedStoryQuery.data]);

  const selectedStoryDisplayCover = selectedStoryQuery.data?.coverImageUrl ?? selectedStoryFirstChapterQuery.data?.imageUrl;
  const selectedStoryDescription = selectedStoryQuery.data?.aiHint?.trim() ? selectedStoryQuery.data.aiHint : STORY_ANNOTATION_PLACEHOLDER;
  const selectedStoryLastChapter = selectedStoryQuery.data?.chapters.at(-1);
  const selectedStoryChapters = useMemo(() => selectedStoryQuery.data?.chapters ?? [], [selectedStoryQuery.data?.chapters]);
  const sortedSelectedStoryChapters = useMemo(
    () => sortChaptersForDisplay(selectedStoryChapters, chapterSortDirection),
    [chapterSortDirection, selectedStoryChapters],
  );
  const visibleStories = useMemo(() => {
    const stories = storiesQuery.data?.items ?? [];
    const query = storySearchDraft.trim().toLowerCase();

    if (!query) {
      return stories;
    }

    return stories.filter((story) => story.title.toLowerCase().includes(query));
  }, [storiesQuery.data?.items, storySearchDraft]);

  async function handleCreateNextChapter() {
    if (!selectedStoryQuery.data) {
      return;
    }

    try {
      const nextNumber = (selectedStoryQuery.data.chapters.at(-1)?.number ?? 0) + 1;
      const chapter = await createChapterMutation.mutateAsync({
        storyId: selectedStoryQuery.data.id,
        title: `Глава ${nextNumber}`,
      });

      await queryClient.invalidateQueries({ queryKey: storyKeys.details(selectedStoryQuery.data.slug) });
      router.push(routes.chapterEditor(selectedStoryQuery.data.id, chapter.id));
    } catch (error) {
      if (isAuthError(error)) {
        router.push(routes.auth({ next: routes.write }));
      }
    }
  }

  function toggleChapterSortDirection() {
    setChapterSortDirection((current) => (current === "asc" ? "desc" : "asc"));
    const chapterList = workshopChaptersScrollRef.current;

    if (!chapterList) {
      return;
    }

    if (typeof chapterList.scrollTo === "function") {
      chapterList.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      chapterList.scrollTop = 0;
    }
  }

  return (
    <PlottyShell
      title={
        <span className="inline-flex items-end gap-2">
          Авторская мастерская
          <PenLine className="plotty-workshop-title-icon" strokeWidth={2.35} aria-hidden="true" focusable="false" />
        </span>
      }
      description="Создавайте, редактируйте и развивайте свои истории."
    >
      {savedMessage ? (
        <Surface role="status" variant="subtle" className="mb-5 px-4 py-3 text-sm font-semibold text-[var(--plotty-olive)]">
          {savedMessage}
        </Surface>
      ) : null}
      <div className="plotty-stagger grid gap-5 xl:grid-cols-[24rem_minmax(0,1fr)_18rem]">
        <ShellCard title="Мои истории" variant="sidebar" className="plotty-stagger-item plotty-lift-panel">
          {storiesQuery.isLoading ? (
            <div className="space-y-3">
              <div className="h-24 rounded-[var(--plotty-radius-md)] bg-white/40" />
              <div className="h-24 rounded-[var(--plotty-radius-md)] bg-white/40" />
            </div>
          ) : storiesQuery.data?.items.length ? (
            <div className="space-y-3">
              <div className="grid grid-cols-[auto_1fr] items-center gap-2 rounded-[var(--plotty-radius-md)] border border-[var(--plotty-line)] bg-[rgba(255,253,249,0.74)] px-3">
                <Search className="size-4 text-[var(--plotty-muted)]" aria-hidden="true" />
                <Input
                  value={storySearchDraft}
                  onChange={(event) => setStorySearchDraft(event.target.value)}
                  aria-label="Поиск по моим историям"
                  placeholder="Поиск по моим историям"
                  className="min-h-11 rounded-none border-0 bg-transparent px-0 shadow-none focus:border-transparent focus:shadow-none focus-visible:shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <div className="plotty-scroll-panel plotty-workshop-story-list space-y-2 lg:space-y-3">
                {visibleStories.map((story) => {
                  const isSelected = selectedStorySlug === story.slug;

                  return (
                    <StorySidebarItem
                      key={story.id}
                      story={story}
                      isSelected={isSelected}
                      selectedStorySlug={selectedStorySlug}
                      selectedStoryDisplayCover={selectedStoryDisplayCover}
                      onSelect={setSelectedStorySlug}
                    />
                  );
                })}
                {!visibleStories.length ? (
                  <EmptyState title="Историй не найдено" description="Очистите поиск или проверьте название." />
                ) : null}
              </div>

              <ButtonLink href={routes.writeNew} variant="secondary" className="w-full border-dashed">
                <Plus className="size-4" aria-hidden="true" />
                Новая история
              </ButtonLink>
            </div>
          ) : (
            <EmptyState
              title="Историй пока нет"
              description="Создайте первую историю и начните писать."
              actionLabel="Создать историю"
              onAction={() => router.push(routes.writeNew)}
            />
          )}
        </ShellCard>

        <ShellCard id="active-story" className="plotty-stagger-item plotty-lift-panel scroll-mt-28" title={selectedStoryQuery.data?.title ?? "Выберите историю"}>
          {selectedStoryQuery.isLoading ? (
            <div className="space-y-3">
              <div className="h-24 rounded-[var(--plotty-radius-md)] bg-white/40" />
              <div className="h-24 rounded-[var(--plotty-radius-md)] bg-white/40" />
            </div>
          ) : selectedStoryQuery.data ? (
            <div className="space-y-5">
              <div className="grid gap-5">
                <StoryCoverPreview
                  title={selectedStoryQuery.data.title}
                  imageUrl={selectedStoryDisplayCover}
                  compact
                  enableLightbox
                  priority
                  className="lg:aspect-square"
                />
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="plotty-kicker">Активная история</div>
                    <p className="plotty-body text-[var(--plotty-muted)]">
                      {selectedStoryDescription}
                    </p>
                  </div>

                  <Surface variant="subtle" className="space-y-3 p-4">
                    <StoryTagsByCategory tags={selectedStoryQuery.data.tags} />
                    <div className="flex justify-start">
                      <ButtonLink href={routes.storySettings(selectedStoryQuery.data.id)} variant="secondary" size="sm">
                        <Settings className="size-4" aria-hidden="true" />
                        Редактировать
                      </ButtonLink>
                    </div>
                  </Surface>

                  <div className="flex flex-wrap gap-3">
                    <Button variant="primary" onClick={handleCreateNextChapter} disabled={createChapterMutation.isPending}>
                      <Plus className="size-4" aria-hidden="true" />
                      {createChapterMutation.isPending ? "Создаем..." : "Создать новую главу"}
                    </Button>
                    <ButtonLink href={routes.story(selectedStoryQuery.data.slug)} variant="secondary">
                      <BookOpen className="size-4" aria-hidden="true" />
                      Открыть историю
                    </ButtonLink>
                  </div>
                </div>
              </div>

              <Surface variant="panel" className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <h2 className="plotty-section-title">Главы истории</h2>
                    <p className="plotty-meta">{selectedStoryChapters.length} {formatChapterCount(selectedStoryChapters.length)}</p>
                  </div>
                  {selectedStoryChapters.length > 1 ? (
                    <ChapterSortButton
                      chapterCount={selectedStoryChapters.length}
                      direction={chapterSortDirection}
                      onToggle={toggleChapterSortDirection}
                    />
                  ) : null}
                </div>

                {selectedStoryChapters.length ? (
                  <div ref={workshopChaptersScrollRef} className="plotty-scroll-panel plotty-workshop-chapter-list plotty-stagger divide-y divide-[var(--plotty-line)] rounded-[var(--plotty-radius-md)] border border-[var(--plotty-line)] bg-[rgba(255,253,249,0.7)]">
                    {sortedSelectedStoryChapters.map((chapter) => (
                      <div
                        key={chapter.id}
                        className="plotty-stagger-item plotty-lift-panel grid gap-3 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <div className="font-semibold text-[var(--plotty-ink)]">
                            {chapter.number}. {chapter.title}
                          </div>
                          <div className="mt-1 text-sm text-[var(--plotty-muted)]">
                            Обновлена {new Date(chapter.updatedAt).toLocaleDateString("ru-RU")}
                          </div>
                        </div>
                        <span className={chapter.status === "draft" ? "plotty-meta" : "text-sm font-semibold text-[var(--plotty-olive)]"}>
                          {chapter.status === "draft" ? "Черновик" : "Опубликована"}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          <StoryRevealButtonLink
                            href={
                              (chapter.status ?? "published") === "draft"
                                ? routes.chapterPreview(selectedStoryQuery.data.slug, chapter.id)
                                : routes.chapter(
                                    selectedStoryQuery.data.slug,
                                    readerChapterNumberForChapterId(selectedStoryQuery.data.chapters, chapter.id) ??
                                      chapter.number ??
                                      1,
                                  )
                            }
                            variant="secondary"
                            size="sm"
                            revealTitle={chapter.title}
                            revealCoverUrl={selectedStoryDisplayCover}
                          >
                            Читать
                          </StoryRevealButtonLink>
                          <ButtonLink href={routes.chapterEditor(selectedStoryQuery.data.id, chapter.id)} variant="primary" size="sm">
                            Редактировать
                          </ButtonLink>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="У истории ещё нет глав"
                    description="Создайте первую главу и сразу попадёте в редактор."
                    actionLabel="Создать новую главу"
                    onAction={handleCreateNextChapter}
                  />
                )}
              </Surface>
            </div>
          ) : (
            <EmptyState title="Выберите историю" description="Слева находится список ваших историй." />
          )}
        </ShellCard>

        <ShellCard title="Действия автора" variant="sidebar" className="plotty-stagger-item plotty-lift-panel">
          <div className="space-y-3">
            <CreditBalancePill variant="menu" />
            <ButtonLink href={routes.writeNew} variant="primary" className="w-full justify-start">
              <Plus className="size-4" aria-hidden="true" />
              Создать историю
            </ButtonLink>
            {selectedStoryQuery.data ? (
              <>
                <Button type="button" variant="secondary" className="w-full justify-start" onClick={handleCreateNextChapter} disabled={createChapterMutation.isPending}>
                  <FileText className="size-4" aria-hidden="true" />
                  Создать главу
                </Button>
                <ButtonLink href={routes.story(selectedStoryQuery.data.slug)} variant="secondary" className="w-full justify-start">
                  <BookOpen className="size-4" aria-hidden="true" />
                  Открыть историю
                </ButtonLink>
                {selectedStoryLastChapter ? (
                  <ButtonLink
                    href={routes.chapterEditor(selectedStoryQuery.data.id, selectedStoryLastChapter.id)}
                    variant="secondary"
                    className="w-full justify-start"
                  >
                    <PenLine className="size-4" aria-hidden="true" />
                    Редактировать последнюю главу
                  </ButtonLink>
                ) : null}
              </>
            ) : null}
          </div>
        </ShellCard>
      </div>
    </PlottyShell>
  );
}

function StorySidebarItem({
  story,
  isSelected,
  selectedStorySlug,
  selectedStoryDisplayCover,
  onSelect,
}: {
  story: StoryListItem;
  isSelected: boolean;
  selectedStorySlug: string;
  selectedStoryDisplayCover?: string | null;
  onSelect: (slug: string) => void;
}) {
  const sidebarCoverImage = getSidebarStoryCoverImageUrl({
    story,
    selectedStorySlug,
    selectedStoryDisplayCover,
  });

  return (
    <article
      className={`plotty-lift-panel plotty-workshop-story-card grid rounded-[var(--plotty-radius-md)] border transition-[background-color,border-color,box-shadow,transform] duration-150 ${
        isSelected
          ? "border-[rgba(195,79,50,0.22)] bg-[var(--plotty-accent-wash)] shadow-[0_12px_28px_rgba(195,79,50,0.08)]"
          : "border-[var(--plotty-line)] bg-[rgba(255,253,249,0.68)] hover:-translate-y-[1px] hover:bg-[var(--plotty-paper-strong)]"
      }`}
    >
      <button
        type="button"
        onClick={() => onSelect(story.slug)}
        className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plotty-accent)]"
        aria-label={`Выбрать историю ${story.title}`}
      >
        <StoryCoverPreview
          title={story.title}
          imageUrl={sidebarCoverImage}
          compact
          className="plotty-workshop-story-cover aspect-square"
          imageClassName="h-full"
        />
      </button>
      <button type="button" onClick={() => onSelect(story.slug)} className="min-w-0 text-left">
        <div className="plotty-card-title plotty-workshop-story-title line-clamp-2 break-words lg:line-clamp-3">{story.title}</div>
        <div className="plotty-workshop-story-date text-xs text-[var(--plotty-muted)]">
          Обновлена {new Date(story.updatedAt).toLocaleDateString("ru-RU")}
        </div>
        {story.statusLabel ? (
          <span className="plotty-workshop-story-status inline-flex rounded-full bg-[var(--plotty-olive-soft)] font-semibold leading-4 text-[var(--plotty-olive)]">
            {story.statusLabel}
          </span>
        ) : null}
      </button>
    </article>
  );
}

function StoryTagsByCategory({ tags }: { tags: StoryTag[] }) {
  const groupedTags = groupStoryTags(tags);
  const primaryGroups = ["directionality", "rating", "completion", "size"]
    .map((category) => [category, groupedTags[category] ?? []] as const)
    .filter(([, groupTags]) => groupTags.length);
  const detailGroups = ["genre", "warning"]
    .map((category) => [category, groupedTags[category] ?? []] as const)
    .filter(([, groupTags]) => groupTags.length);

  if (!primaryGroups.length && !detailGroups.length) {
    return null;
  }

  return (
    <div className="space-y-3">
      {primaryGroups.length ? (
        <div className="grid grid-cols-2 gap-3">
          {primaryGroups.map(([category, groupTags]) => (
            <TagGroup key={category} category={category} tags={groupTags} />
          ))}
        </div>
      ) : null}

      {detailGroups.map(([category, groupTags]) => (
        <TagGroup key={category} category={category} tags={groupTags} />
      ))}
    </div>
  );
}

function TagGroup({ category, tags }: { category: string; tags: StoryTag[] }) {
  return (
    <div className="space-y-1.5">
      <div className="plotty-kicker">{getStoryTagCategoryLabel(category)}</div>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <Chip key={tag.id} tone={tag.category === "completion" ? "olive" : tag.category === "warning" ? "gold" : "default"}>
            {tag.name}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function formatChapterCount(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return "глава";
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return "главы";
  }

  return "глав";
}
