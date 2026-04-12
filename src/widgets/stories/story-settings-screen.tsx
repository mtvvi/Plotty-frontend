"use client";

import type { Dispatch, SetStateAction } from "react";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import {
  deleteStory,
  storyDetailsByIdQueryOptions,
  storyKeys,
  storyTagsQueryOptions,
  updateStory,
} from "@/entities/story/api/stories-api";
import type { StoriesResponse, StoryDetails, StoryTag } from "@/entities/story/model/types";
import { getStoryTextOverride, setStoryTextOverride } from "@/entities/story/model/story-text-cache";
import { isAuthError } from "@/shared/api/fetch-json";
import { routes } from "@/shared/config/routes";
import {
  getStoryTagCategoryLabel,
  groupStoryTags,
  singleSelectTagCategories,
  storyTagCategoryOrder,
} from "@/shared/config/story-tags";
import { Button } from "@/shared/ui/button";
import { Chip } from "@/shared/ui/chip";
import { EmptyState } from "@/shared/ui/empty-state";
import { Field, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";

import { PlottyShell, ShellCard } from "./plotty-shell";

type StoryEditStage = "details" | "taxonomy" | "review";

export interface StorySettingsValues {
  title: string;
  description: string;
  selectedTagIds: string[];
}

const emptyValues: StorySettingsValues = {
  title: "",
  description: "",
  selectedTagIds: [],
};

const requiredCategoryOrder = ["directionality", "rating", "completion", "size", "genre"] as const;

export function StorySettingsScreen({ storyId }: { storyId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const storyQuery = useQuery(storyDetailsByIdQueryOptions(storyId));
  const tagsQuery = useQuery(storyTagsQueryOptions());
  const [stage, setStage] = useState<StoryEditStage>("details");
  const [values, setValues] = useState<StorySettingsValues>(emptyValues);
  const updateStoryMutation = useMutation({
    mutationFn: ({ targetStoryId, targetPayload }: { targetStoryId: string; targetPayload: StorySettingsValues }) =>
      updateStory(targetStoryId, {
        title: targetPayload.title.trim(),
        description: targetPayload.description.trim(),
        tagIds: targetPayload.selectedTagIds,
      }),
  });
  const deleteStoryMutation = useMutation({
    mutationFn: deleteStory,
  });

  useEffect(() => {
    if (!storyQuery.data) {
      return;
    }

    const textOverride = getStoryTextOverride(storyQuery.data.id);

    setValues({
      title: storyQuery.data.title,
      description: textOverride?.description ?? storyQuery.data.description ?? "",
      selectedTagIds: storyQuery.data.tags.map((tag) => tag.id),
    });
  }, [storyQuery.data]);

  const availableTags = useMemo(
    () => tagsQuery.data?.items ?? storyQuery.data?.tags ?? [],
    [storyQuery.data?.tags, tagsQuery.data?.items],
  );
  const groupedTags = useMemo(() => groupStoryTags(availableTags), [availableTags]);
  const orderedGroups = storyTagCategoryOrder
    .map((category) => [category, groupedTags[category] ?? []] as const)
    .filter(([, tags]) => tags.length);
  const selectedTagIds = useMemo(() => new Set(values.selectedTagIds), [values.selectedTagIds]);
  const selectedTags = useMemo(
    () => availableTags.filter((tag) => selectedTagIds.has(tag.id)),
    [availableTags, selectedTagIds],
  );
  const selectedTagsByCategory = useMemo(() => groupStoryTags(selectedTags), [selectedTags]);
  const canAdvanceFromDetails = Boolean(values.title.trim() && values.description.trim());
  const canAdvanceFromTaxonomy = requiredCategoryOrder.every((category) =>
    (groupedTags[category] ?? []).some((tag) => selectedTagIds.has(tag.id)),
  );

  async function handleSave() {
    try {
      const nextDescription = values.description.trim();

      setStoryTextOverride(storyId, {
        description: nextDescription,
      });

      queryClient.setQueryData<StoryDetails | undefined>(storyKeys.detailsById(storyId), (current) =>
        current
          ? {
              ...current,
              title: values.title.trim(),
              description: nextDescription,
            }
          : current,
      );

      if (storyQuery.data?.slug) {
        queryClient.setQueryData<StoryDetails | undefined>(storyKeys.details(storyQuery.data.slug), (current) =>
          current
            ? {
                ...current,
                title: values.title.trim(),
                description: nextDescription,
              }
            : current,
        );
      }

      queryClient.setQueriesData<StoriesResponse>({ queryKey: ["stories", "list"] }, (current) =>
        current
          ? {
              ...current,
              items: current.items.map((item) =>
                item.id === storyId
                  ? {
                      ...item,
                      title: values.title.trim(),
                      description: nextDescription,
                      tags: availableTags.filter((tag) => values.selectedTagIds.includes(tag.id)),
                    }
                  : item,
              ),
            }
          : current,
      );

      await updateStoryMutation.mutateAsync({
        targetStoryId: storyId,
        targetPayload: {
          ...values,
          title: values.title.trim(),
          description: nextDescription,
        },
      });

      await queryClient.invalidateQueries({ queryKey: storyKeys.all });
      await queryClient.invalidateQueries({ queryKey: storyKeys.detailsById(storyId) });

      if (storyQuery.data?.slug) {
        await queryClient.invalidateQueries({ queryKey: storyKeys.details(storyQuery.data.slug) });
      }
    } catch (error) {
      if (isAuthError(error)) {
        router.push(routes.auth({ next: routes.storySettings(storyId) }));
      }
    }
  }

  async function handleDeleteStory() {
    if (!storyQuery.data || !window.confirm("Удалить историю целиком?")) {
      return;
    }

    try {
      await deleteStoryMutation.mutateAsync(storyId);
      await queryClient.invalidateQueries({ queryKey: storyKeys.all });
      router.push(routes.write);
    } catch (error) {
      if (isAuthError(error)) {
        router.push(routes.auth({ next: routes.storySettings(storyId) }));
      }
    }
  }

  if (storyQuery.isLoading) {
    return (
      <PlottyShell title="Редактирование истории" description="" mobileBackHref={routes.write}>
        <div className="h-72 rounded-[24px] bg-white/40" />
      </PlottyShell>
    );
  }

  if (storyQuery.isError || !storyQuery.data) {
    return (
      <PlottyShell title="История не найдена" description="" mobileBackHref={routes.write}>
        <EmptyState title="История не найдена" description="Вернитесь в мастерскую и выберите другую историю." />
      </PlottyShell>
    );
  }

  return (
    <PlottyShell title="Редактирование истории" description="" mobileBackHref={routes.write}>
      <div className="space-y-4 lg:space-y-5">
        <ShellCard className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-3">
            <FlowStepButton
              number={1}
              label="Название и описание"
              active={stage === "details"}
              complete={canAdvanceFromDetails}
              onClick={() => setStage("details")}
            />
            <FlowStepButton
              number={2}
              label="Теги и категории"
              active={stage === "taxonomy"}
              complete={canAdvanceFromTaxonomy}
              disabled={!canAdvanceFromDetails}
              onClick={() => {
                if (canAdvanceFromDetails) {
                  setStage("taxonomy");
                }
              }}
            />
            <FlowStepButton
              number={3}
              label="Проверка и сохранение"
              active={stage === "review"}
              disabled={!canAdvanceFromTaxonomy}
              onClick={() => {
                if (canAdvanceFromTaxonomy) {
                  setStage("review");
                }
              }}
            />
          </div>
        </ShellCard>

        {stage === "details" ? (
          <ShellCard title="Название и описание">
            <div className="grid gap-5">
              <Field>
                <FieldLabel htmlFor="story-settings-title">Название истории</FieldLabel>
                <Input
                  id="story-settings-title"
                  value={values.title}
                  onChange={(event) => updateStoryField(setValues, "title", event.target.value)}
                  placeholder="Название истории"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="story-settings-description">Описание</FieldLabel>
                <Textarea
                  id="story-settings-description"
                  value={values.description}
                  onChange={(event) => updateStoryField(setValues, "description", event.target.value)}
                  placeholder="О чем эта история"
                  className="min-h-32"
                />
              </Field>

              <div className="flex justify-end border-t border-[var(--plotty-line)] pt-5">
                <Button variant="primary" disabled={!canAdvanceFromDetails} onClick={() => setStage("taxonomy")}>
                  Далее
                </Button>
              </div>
            </div>
          </ShellCard>
        ) : null}

        {stage === "taxonomy" ? (
          <ShellCard title="Теги и категории">
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                {orderedGroups.map(([category, tags]) => (
                  <TagCategoryCard
                    key={category}
                    category={category}
                    tags={tags}
                    selectedTagIds={selectedTagIds}
                    onToggle={(tag) => setValues((current) => toggleStoryTag(current, tag, groupedTags))}
                  />
                ))}
              </div>

              <div className="flex flex-wrap justify-between gap-3 border-t border-[var(--plotty-line)] pt-5">
                <Button variant="secondary" onClick={() => setStage("details")}>
                  Назад
                </Button>
                <Button variant="primary" disabled={!canAdvanceFromTaxonomy} onClick={() => setStage("review")}>
                  Далее
                </Button>
              </div>
            </div>
          </ShellCard>
        ) : null}

        {stage === "review" ? (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <ShellCard title="Проверьте историю перед сохранением">
              <div className="space-y-5">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
                  <div className="space-y-4 rounded-[22px] border border-[rgba(41,38,34,0.08)] bg-white/72 p-4 sm:p-5">
                    <div>
                      <div className="plotty-kicker">Название</div>
                      <div className="mt-2 text-xl font-semibold text-[var(--plotty-ink)]">{values.title}</div>
                    </div>
                    <SummaryTextBlock label="Описание" value={values.description} />
                  </div>

                  <div className="space-y-4 rounded-[22px] border border-[rgba(41,38,34,0.08)] bg-[var(--plotty-panel-muted)] p-4 sm:p-5">
                    {storyTagCategoryOrder.map((category) => {
                      const tags = selectedTagsByCategory[category] ?? [];

                      if (!tags.length) {
                        return null;
                      }

                      return (
                        <div key={category} className="space-y-2">
                          <div className="plotty-kicker">{getStoryTagCategoryLabel(category)}</div>
                          <div className="flex flex-wrap gap-2">
                            {tags.map((tag) => (
                              <Chip key={tag.id} className="bg-[var(--plotty-panel)] text-[var(--plotty-ink)]">
                                {tag.name}
                              </Chip>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap justify-between gap-3 border-t border-[var(--plotty-line)] pt-5">
                  <Button variant="secondary" onClick={() => setStage("taxonomy")}>
                    Назад
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={updateStoryMutation.isPending || !canAdvanceFromDetails || !canAdvanceFromTaxonomy}
                  >
                    {updateStoryMutation.isPending ? "Сохраняем..." : "Сохранить изменения"}
                  </Button>
                </div>
              </div>
            </ShellCard>

            <ShellCard title="Удаление истории">
              <div className="space-y-4">
                <p className="text-sm leading-6 text-[var(--plotty-muted)]">
                  Это действие удалит историю и связанные главы из мастерской.
                </p>
                <Button
                  variant="destructive"
                  onClick={handleDeleteStory}
                  disabled={deleteStoryMutation.isPending}
                  className="w-full"
                >
                  {deleteStoryMutation.isPending ? "Удаляем..." : "Удалить историю"}
                </Button>
              </div>
            </ShellCard>
          </div>
        ) : null}
      </div>
    </PlottyShell>
  );
}

function FlowStepButton({
  number,
  label,
  active,
  complete,
  disabled = false,
  onClick,
}: {
  number: number;
  label: string;
  active: boolean;
  complete?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-[20px] border px-4 py-3 text-left transition-colors ${
        active
          ? "border-transparent bg-[var(--plotty-accent-soft)] text-[var(--plotty-accent)]"
          : complete
            ? "border-[rgba(188,95,61,0.14)] bg-[rgba(188,95,61,0.06)] text-[var(--plotty-ink)]"
            : "border-[var(--plotty-line)] bg-white/76 text-[var(--plotty-muted)]"
      } ${disabled ? "cursor-not-allowed opacity-55" : ""}`}
    >
      <div className="plotty-kicker">{`Шаг ${number}`}</div>
      <div className="mt-2 text-sm font-semibold leading-5">{label}</div>
    </button>
  );
}

function TagCategoryCard({
  category,
  tags,
  selectedTagIds,
  onToggle,
}: {
  category: string;
  tags: StoryTag[];
  selectedTagIds: Set<string>;
  onToggle: (tag: StoryTag) => void;
}) {
  return (
    <div className="space-y-2.5 rounded-[18px] border border-[rgba(41,38,34,0.06)] bg-white/72 p-4">
      <div className="plotty-label">{getStoryTagCategoryLabel(category)}</div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Chip key={tag.id} selected={selectedTagIds.has(tag.id)} onClick={() => onToggle(tag)}>
            {tag.name}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function SummaryTextBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <div className="plotty-kicker">{label}</div>
      <p className="text-sm leading-6 text-[var(--plotty-muted)]">{value}</p>
    </div>
  );
}

function updateStoryField<K extends keyof StorySettingsValues>(
  setValues: Dispatch<SetStateAction<StorySettingsValues>>,
  key: K,
  value: StorySettingsValues[K],
) {
  setValues((current) => ({
    ...current,
    [key]: value,
  }));
}

function toggleStoryTag(
  current: StorySettingsValues,
  tag: StoryTag,
  groupedTags: Record<string, StoryTag[]>,
) {
  const isSingle = singleSelectTagCategories.includes(tag.category as (typeof singleSelectTagCategories)[number]);
  const categoryTags = groupedTags[tag.category ?? "other"] ?? [];

  const nextTagIds = isSingle
    ? replaceCategoryTagIds(current.selectedTagIds, categoryTags, [tag.id])
    : current.selectedTagIds.includes(tag.id)
      ? current.selectedTagIds.filter((id) => id !== tag.id)
      : [...current.selectedTagIds, tag.id];

  return {
    ...current,
    selectedTagIds: nextTagIds,
  };
}

function replaceCategoryTagIds(currentTagIds: string[], categoryTags: StoryTag[], nextCategoryTagIds: string[]) {
  const categoryTagSet = new Set(categoryTags.map((tag) => tag.id));
  const filteredTagIds = currentTagIds.filter((tagId) => !categoryTagSet.has(tagId));

  nextCategoryTagIds.forEach((tagId) => {
    if (!filteredTagIds.includes(tagId)) {
      filteredTagIds.push(tagId);
    }
  });

  return filteredTagIds;
}
