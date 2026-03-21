"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createChapter, createStory, storyKeys } from "@/entities/story/api/stories-api";
import { routes } from "@/shared/config/routes";

import { PlottyShell } from "./plotty-shell";
import { StoryEditorForm, type StoryEditorValues } from "./story-editor-form";

const initialValues: StoryEditorValues = {
  storyTitle: "",
  storyDescription: "",
  storyExcerpt: "",
  selectedTagSlugs: [],
  chapterTitle: "",
  chapterContent: "",
  imagePrompt: "",
};

export function StoryCreateScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [values, setValues] = useState(initialValues);

  const createStoryMutation = useMutation({
    mutationFn: createStory,
  });
  const createChapterMutation = useMutation({
    mutationFn: ({ storyId, title, content }: { storyId: string; title: string; content: string }) =>
      createChapter(storyId, { title, content }),
  });

  async function handleSave() {
    const story = await createStoryMutation.mutateAsync({
      title: values.storyTitle,
      description: values.storyDescription,
      excerpt: values.storyExcerpt,
      tags: values.selectedTagSlugs,
    });

    const chapter = await createChapterMutation.mutateAsync({
      storyId: story.id,
      title: values.chapterTitle || "Глава 1",
      content: values.chapterContent,
    });

    await queryClient.invalidateQueries({ queryKey: storyKeys.all });
    router.push(routes.chapterEditor(story.id, chapter.id));
  }

  return (
    <PlottyShell
      title="Новая история и первая глава"
      description="В одной точке входа создаётся история, первая глава и стартовый маршрут в редактор для дальнейшей работы."
    >
      <StoryEditorForm
        mode="create"
        values={values}
        onChange={setValues}
        onSave={handleSave}
        onSpellcheck={() => {}}
        onGenerateImage={() => {}}
        isSaving={createStoryMutation.isPending || createChapterMutation.isPending}
        saveLabel="Создать историю и главу"
      />
    </PlottyShell>
  );
}
