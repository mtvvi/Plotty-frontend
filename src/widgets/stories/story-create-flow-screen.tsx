"use client";

import type { Dispatch, SetStateAction } from "react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import {
  createStory,
  storyKeys,
  storyTagsQueryOptions,
} from "@/entities/story/api/stories-api";
import type { StoryTag } from "@/entities/story/model/types";
import { isAuthError } from "@/shared/api/fetch-json";
import { STORY_ANNOTATION_PLACEHOLDER } from "@/shared/config/story-annotation";
import { routes } from "@/shared/config/routes";
import {
  getStoryTagCategoryLabel,
  groupStoryTags,
  singleSelectTagCategories,
  storyTagCategoryOrder,
} from "@/shared/config/story-tags";
import { Button } from "@/shared/ui/button";
import { Chip } from "@/shared/ui/chip";
import { Field, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";

import { PlottyShell, ShellCard } from "./plotty-shell";

type StoryFlowStage = "details" | "taxonomy" | "review";

interface StorySettingsValues {
  title: string;
  selectedTagIds: string[];
}

const initialStoryValues: StorySettingsValues = {
  title: "",
  selectedTagIds: [],
};

const defaultCompletionSlug = "in-progress";
const requiredCategoryOrder = ["directionality", "rating", "size", "genre"] as const;

export function StoryCreateFlowScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [stage, setStage] = useState<StoryFlowStage>("details");
  const [storyValues, setStoryValues] = useState(initialStoryValues);
  const tagsQuery = useQuery(storyTagsQueryOptions());
  const availableTags = useMemo(() => tagsQuery.data?.items ?? [], [tagsQuery.data?.items]);
  const groupedTags = useMemo(() => groupStoryTags(availableTags), [availableTags]);
  const selectedTagIds = useMemo(() => new Set(storyValues.selectedTagIds), [storyValues.selectedTagIds]);
  const defaultCompletionTag = useMemo(
    () => availableTags.find((tag) => tag.category === "completion" && tag.slug === defaultCompletionSlug),
    [availableTags],
  );
  const selectedTagIdsForCreate = useMemo(() => {
    const ids = new Set(storyValues.selectedTagIds);

    if (defaultCompletionTag) {
      ids.add(defaultCompletionTag.id);
    }

    return Array.from(ids);
  }, [defaultCompletionTag, storyValues.selectedTagIds]);
  const selectedTagIdsForPreview = useMemo(() => new Set(selectedTagIdsForCreate), [selectedTagIdsForCreate]);
  const selectedTags = useMemo(
    () => availableTags.filter((tag) => selectedTagIdsForPreview.has(tag.id)),
    [availableTags, selectedTagIdsForPreview],
  );
  const selectedTagsByCategory = useMemo(() => groupStoryTags(selectedTags), [selectedTags]);
  const orderedGroups = storyTagCategoryOrder
    .map((category) => [category, groupedTags[category] ?? []] as const)
    .filter(([category]) => category !== "completion")
    .filter(([, tags]) => tags.length);

  const createStoryMutation = useMutation({ mutationFn: createStory });

  const canAdvanceFromDetails = Boolean(storyValues.title.trim());
  const canAdvanceFromTaxonomy = requiredCategoryOrder.every((category) =>
    (groupedTags[category] ?? []).some((tag) => selectedTagIds.has(tag.id)),
  );

  async function handleCreateStory() {
    if (!canAdvanceFromDetails || !canAdvanceFromTaxonomy) {
      return;
    }

    try {
      const story = await createStoryMutation.mutateAsync({
        title: storyValues.title.trim(),
        tagIds: selectedTagIdsForCreate,
      });

      await queryClient.invalidateQueries({ queryKey: storyKeys.all });
      router.push(`${routes.write}?story=${encodeURIComponent(story.slug)}`);
    } catch (error) {
      if (isAuthError(error)) {
        router.push(routes.auth({ next: routes.writeNew }));
      }
    }
  }

  return (
    <PlottyShell title="Создание истории" description="" mobileBackHref={routes.write}>
      <div className="space-y-4 lg:space-y-5">
        <ShellCard className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-3">
            <FlowStepButton
              number={1}
              label="Название"
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
              label="Сохранение истории"
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
              <ShellCard title="Название">
                <div className="grid gap-5">
                  <Field>
                    <FieldLabel htmlFor="story-create-title">Название истории</FieldLabel>
                    <Input
                      id="story-create-title"
                      value={storyValues.title}
                      onChange={(event) => updateStoryField(setStoryValues, "title", event.target.value)}
                      placeholder="Название истории"
                    />
                  </Field>

                  <div className="rounded-[18px] border border-[rgba(41,38,34,0.08)] bg-[var(--plotty-panel-muted)] p-4">
                    <div className="plotty-kicker">Аннотация</div>
                    <p className="mt-2 text-sm leading-6 text-[var(--plotty-muted)]">{STORY_ANNOTATION_PLACEHOLDER}</p>
                  </div>

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
                        onToggle={(tag) => setStoryValues((current) => toggleStoryTag(current, tag, groupedTags))}
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
              <ShellCard title="Проверьте историю перед сохранением">
                <div className="space-y-5">
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
                    <div className="space-y-4 rounded-[22px] border border-[rgba(41,38,34,0.08)] bg-white/72 p-4 sm:p-5">
                      <div>
                        <div className="plotty-kicker">Название</div>
                        <div className="mt-2 text-xl font-semibold text-[var(--plotty-ink)]">{storyValues.title}</div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="plotty-kicker">Аннотация</div>
                        <p className="text-sm leading-6 text-[var(--plotty-muted)]">{STORY_ANNOTATION_PLACEHOLDER}</p>
                      </div>
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
                      onClick={handleCreateStory}
                      disabled={createStoryMutation.isPending || !canAdvanceFromDetails || !canAdvanceFromTaxonomy}
                    >
                      {createStoryMutation.isPending ? "Сохраняем историю..." : "Сохранить историю"}
                    </Button>
                  </div>
                </div>
              </ShellCard>
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

function updateStoryField<K extends keyof StorySettingsValues>(
  setStoryValues: Dispatch<SetStateAction<StorySettingsValues>>,
  key: K,
  value: StorySettingsValues[K],
) {
  setStoryValues((current) => ({
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
