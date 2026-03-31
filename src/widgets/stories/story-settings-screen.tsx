"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import {
  deleteStory,
  storyDetailsByIdQueryOptions,
  storyKeys,
  storyTagsQueryOptions,
  updateStory,
} from "@/entities/story/api/stories-api";
import type { StoriesResponse, StoryDetails } from "@/entities/story/model/types";
import { getStoryTextOverride, setStoryTextOverride } from "@/entities/story/model/story-text-cache";
import { isAuthError } from "@/shared/api/fetch-json";
import { routes } from "@/shared/config/routes";
import { Button, ButtonLink } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";

import { PlottyShell, ShellCard } from "./plotty-shell";
import { StorySettingsFields, type StorySettingsValues } from "./story-settings-fields";

const emptyValues: StorySettingsValues = {
  title: "",
  description: "",
  excerpt: "",
  selectedTagIds: [],
};

export function StorySettingsScreen({ storyId }: { storyId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const storyQuery = useQuery(storyDetailsByIdQueryOptions(storyId));
  const tagsQuery = useQuery(storyTagsQueryOptions());
  const [values, setValues] = useState<StorySettingsValues>(emptyValues);
  const updateStoryMutation = useMutation({
    mutationFn: ({ targetStoryId, targetPayload }: { targetStoryId: string; targetPayload: StorySettingsValues }) =>
      updateStory(targetStoryId, {
        title: targetPayload.title.trim(),
        description: targetPayload.description.trim(),
        excerpt: targetPayload.excerpt.trim(),
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
      excerpt: textOverride?.excerpt ?? storyQuery.data.excerpt ?? "",
      selectedTagIds: storyQuery.data.tags.map((tag) => tag.id),
    });
  }, [storyQuery.data]);

  async function handleSave() {
    try {
      const nextDescription = values.description.trim();
      const nextExcerpt = values.excerpt.trim();

      setStoryTextOverride(storyId, {
        description: nextDescription,
        excerpt: nextExcerpt,
      });

      queryClient.setQueryData<StoryDetails | undefined>(storyKeys.detailsById(storyId), (current) =>
        current
          ? {
              ...current,
              description: nextDescription,
              excerpt: nextExcerpt,
            }
          : current,
      );

      if (storyQuery.data?.slug) {
        queryClient.setQueryData<StoryDetails | undefined>(storyKeys.details(storyQuery.data.slug), (current) =>
          current
            ? {
                ...current,
                description: nextDescription,
                excerpt: nextExcerpt,
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
                      description: nextDescription,
                      excerpt: nextExcerpt,
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
          description: nextDescription,
          excerpt: nextExcerpt,
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
      <PlottyShell title="Настройки истории загружаются" description="Подтягиваем общие данные и метаданные истории.">
        <div className="h-72 rounded-[24px] bg-white/40" />
      </PlottyShell>
    );
  }

  if (storyQuery.isError || !storyQuery.data) {
    return (
      <PlottyShell title="История не найдена" description="Эта история недоступна для настройки.">
        <EmptyState title="История не найдена" description="Вернитесь в мастерскую и выберите другую историю." />
      </PlottyShell>
    );
  }

  return (
    <PlottyShell
      title={`Настройки: ${storyQuery.data.title}`}
      description="Редактируйте только общие параметры истории. Главы и текст редактируются отдельно."
      actions={
        <ButtonLink href={routes.write} variant="secondary">
          В мастерскую
        </ButtonLink>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <ShellCard title="Параметры истории" description="Название, описание и теги управляют каталогом, страницей истории и поиском.">
          <div className="space-y-5">
            <StorySettingsFields values={values} availableTags={tagsQuery.data?.items ?? storyQuery.data.tags} onChange={setValues} />
            <div className="border-t border-[var(--plotty-line)] pt-5">
              <Button variant="primary" onClick={handleSave} disabled={updateStoryMutation.isPending} className="w-full sm:w-auto">
                {updateStoryMutation.isPending ? "Сохраняем..." : "Сохранить настройки"}
              </Button>
            </div>
          </div>
        </ShellCard>

        <div className="space-y-5">
          <ShellCard title="Быстрые переходы" description="Откройте историю, вернитесь в мастерскую или перейдите к главам.">
            <div className="flex flex-col gap-3">
              <ButtonLink href={routes.story(storyQuery.data.slug)} variant="secondary" className="w-full">
                Открыть страницу истории
              </ButtonLink>
              <ButtonLink href={routes.write} variant="secondary" className="w-full">
                Вернуться в мастерскую
              </ButtonLink>
            </div>
          </ShellCard>

          <ShellCard title="Опасные действия" description="Удаление истории уберёт её из каталога и удалит главы.">
            <Button variant="destructive" onClick={handleDeleteStory} disabled={deleteStoryMutation.isPending} className="w-full sm:w-auto">
              {deleteStoryMutation.isPending ? "Удаляем..." : "Удалить историю"}
            </Button>
          </ShellCard>
        </div>
      </div>
    </PlottyShell>
  );
}
