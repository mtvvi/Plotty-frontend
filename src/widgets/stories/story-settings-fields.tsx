"use client";

import type { StoryTag } from "@/entities/story/model/types";
import {
  getStoryTagCategoryLabel,
  groupStoryTags,
  singleSelectTagCategories,
  storyTagCategoryOrder,
} from "@/shared/config/story-tags";
import { Chip } from "@/shared/ui/chip";
import { Field, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";

export interface StorySettingsValues {
  title: string;
  description: string;
  excerpt: string;
  selectedTagIds: string[];
}

export function StorySettingsFields({
  values,
  availableTags,
  onChange,
  includeSummaryFields = true,
}: {
  values: StorySettingsValues;
  availableTags: StoryTag[];
  onChange: (next: StorySettingsValues) => void;
  includeSummaryFields?: boolean;
}) {
  const groupedTags = groupStoryTags(availableTags);
  const orderedGroups = storyTagCategoryOrder
    .map((category) => [category, groupedTags[category] ?? []] as const)
    .filter(([, tags]) => tags.length);

  function update<K extends keyof StorySettingsValues>(key: K, value: StorySettingsValues[K]) {
    onChange({
      ...values,
      [key]: value,
    });
  }

  function toggleTag(tag: StoryTag) {
    const isSingle = singleSelectTagCategories.includes(tag.category as (typeof singleSelectTagCategories)[number]);
    const nextTagIds = isSingle
      ? replaceCategoryTagIds(values.selectedTagIds, groupedTags[tag.category ?? "other"] ?? [], [tag.id])
      : values.selectedTagIds.includes(tag.id)
        ? values.selectedTagIds.filter((id) => id !== tag.id)
        : [...values.selectedTagIds, tag.id];

    update("selectedTagIds", nextTagIds);
  }

  return (
    <div className="grid gap-4">
      <Field>
        <FieldLabel htmlFor="story-settings-title">Название истории</FieldLabel>
        <Input
          id="story-settings-title"
          value={values.title}
          onChange={(event) => update("title", event.target.value)}
          placeholder="Название истории"
        />
      </Field>

      {includeSummaryFields ? (
        <>
          <Field>
            <FieldLabel htmlFor="story-settings-description">Описание</FieldLabel>
            <Textarea
              id="story-settings-description"
              value={values.description}
              onChange={(event) => update("description", event.target.value)}
              placeholder="Короткое описание истории"
              className="min-h-32"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="story-settings-excerpt">Тизер</FieldLabel>
            <Textarea
              id="story-settings-excerpt"
              value={values.excerpt}
              onChange={(event) => update("excerpt", event.target.value)}
              placeholder="Короткий тизер для каталога и страницы истории"
              className="min-h-28"
            />
          </Field>
        </>
      ) : null}

      {orderedGroups.map(([category, tags]) => {
        const isSingle = singleSelectTagCategories.includes(category as (typeof singleSelectTagCategories)[number]);

        return (
          <div key={category} className="space-y-2">
            <div className="plotty-label">{getStoryTagCategoryLabel(category)}</div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Chip
                  key={tag.id}
                  selected={values.selectedTagIds.includes(tag.id)}
                  onClick={() => toggleTag(tag)}
                  className={isSingle && values.selectedTagIds.includes(tag.id) ? "ring-1 ring-[var(--plotty-accent-soft)]" : undefined}
                >
                  {tag.name}
                </Chip>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
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
